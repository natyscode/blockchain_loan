App = {

    web3Provider: null,
    contracts: {},
    initialCashPaymentAmount: 0,
    regularDrawdownAmount: 0,
    lendersCommitmentAmount: 0,
    expectedProgress: 0,
  
    init: function() {
        return App.initWeb3();
    },
  
    initWeb3: function() {
      // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider;
      } else {
        // set the provider you want from Web3.providers
        console.log('No web3? You should consider trying MetaMask!');
        App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      }
      web3 = new Web3(App.web3Provider);
      return App.initContract();
    },
  
    initContract: function() {
      
        $.getJSON('Loan.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var LoanArtifact = data;
            App.contracts.Loan = TruffleContract(LoanArtifact);
          
            // Set the provider for our contract
            App.contracts.Loan.setProvider(App.web3Provider);
          
            // Use our contract to retrieve and mark the adopted pets
            return App.bindEvents();
        });
    },
  
    bindEvents: function() {
      $(document).on('click', '#requestContractFormButton', App.requestLoan);
      $(document).on('click', '#confirmContractFormButton', App.confirmLoan);
      $(document).on('click', '#initialCashPaymentFormButton', App.initialCashPayment);
      $(document).on('click', '#drawdownFormButton', App.verifyDrawdownApproval);
      $(document).on('click', '#repaymentButton', App.verifyRepayment);
    },

    /* 1st Step: Signing of loan */
    requestLoan: function(event) {
      event.preventDefault();
  
      console.log('requestLoan');
  
      var values = {};
      $.each($('#request_contract_form').serializeArray(), function(i, field) {
        values[field.name] = field.value;
      });
  
      var loanInstance;
      
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
      
        var account = accounts[0];
  
        console.log("Account 0: " + accounts[0]);
      
        App.contracts.Loan.deployed().then(function(instance) {
          smartcontractInstance = instance;
  
          console.log('--> requestLoan - App.contracs.requestLoan.deployed');
          console.log(instance);
      
          // Execute adopt as a transaction by sending account
          return smartcontractInstance.requestLoan(values['lender'],
                                                  values['borrower'],
                                                  values['borrower_address'], 
                                                  values['purpose_loan'],
                                                  web3.toWei(Fx.convertToEther(values['loan_amount'],'EUR'),'ether'),
                                                  values['tranches'],
                                                  values['interest_rate'],
                                                  new Date(values['signing_date'].split("/").reverse().join("-")).getTime(),
                                                  new Date(Schedule.cashflow_array[0].date.split("/").reverse().join("-")).getTime(),
                                                  {from: account, gas: 1000000});
        }).then(function(result) {
          console.log('LOAN REQUESTED CORRECTLY.');
          //Update data in next step
          App.getCurrentLoandId($('div.confirm_contract_form.messages'));
          App.getTotalLoanAmount();
          return true;
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    },

    /* Helper */
    getCurrentLoandId: function(element) {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;
        // Execute adopt as a transaction by sending account
        return loanInstance.findCurrentLoanId.call();

      }).then(function(loanid) {

        loanid = loanid.toNumber();
        console.log("--> getCurrentLoandId - Showing result: " + loanid);
        if (loanid != undefined && element != undefined) {
          //Updating next step
          element.html('<p> The current contract Loan Id is: ' + loanid + '</p>');
        }

        return loanid;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },

    /* Helper */
    getTotalLoanAmount: function() {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        console.log('--> getTotalLoanAmount - App.contracs.getTotalLoanAmount.deployed');
        console.log(instance);
    
        // Execute adopt as a transaction by sending account
        return loanInstance.getToTalLoanAmount.call();

      }).then(function(loanamount) {

        loanamount = loanamount.toNumber();
        console.log("--> getTotalLoanAmount - Showing result: ");
        console.log(loanamount);

        if (loanamount != undefined) {
          //Updating next step
          console.log('<p> The total Loan Amount is: ' + loanamount + '</p>');
        }

        return loanamount;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },
  
    /* 1st Step b continuation: Borrower confirms contract */
    confirmLoan: function(event) {
      event.preventDefault();
  
      //var petId = parseInt($(event.target).data('id'));
      console.log('confimLoan');
  
      var values = {};
      $.each($('#confirm_contract_form').serializeArray(), function(i, field) {
        values[field.name] = field.value;
      });
      
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
      
        var account = accounts[0];
  
        App.contracts.Loan.deployed().then(function(instance) {
          smartcontractInstance = instance;
  
          console.log('--> confirmLoan - App.contracs.confirmLoan.deployed');
      
          // Confirm if Borrower agrees to Loan and confirm
          if ($('#borrower_confirm').is(':checked')) {
            return smartcontractInstance.confirmLoan({from: account, gas: 1000000 /*, value: web3.toWei(10, "ether")*/});
          } else {
              alert("Please confirm if you confirm this contract.");
          }
        }).then(function(result) {
          
          console.log("Showing the result in confirmLoan");
          App.updateInitialCashPayment($('div.initial_cashpayment_form.messages_drawdown'));
  
          return true;
  
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    },

    /* Update Drawdown */
    updateInitialCashPayment: function(element) {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        console.log('--> updateInitialCashPayment - App.contracts.getInitialDrawdownAmount.deployed');
    
        // Execute adopt as a transaction by sending account
        return loanInstance.getInitialDrawdownAmount.call();

      }).then(function(initialDrawdownAmount) {

        initialDrawdownAmount = initialDrawdownAmount.toNumber();
        //console.log("--> updateInitialCashPayment - Showing result: ");
        //console.log(initialDrawdownAmount);

        if (initialDrawdownAmount != undefined) {
          App.initialCashPaymentAmount = initialDrawdownAmount;
          element.html('<spam> The Initial Drawdown Amount is: <p style="font-weight: bold;">' + 
                       Fx.convertToCurrency(web3.fromWei(App.initialCashPaymentAmount, 'ether'), 'EUR') +
                       ' EUR</p></spam>');
        }

        return initialDrawdownAmount;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },

    /* 2nd Step: Initial Cash Payment */
    initialCashPayment : function(event) {
      event.preventDefault();
    
      var values = {};
      $.each($('#initial_cashpayment_form').serializeArray(), function(i, field) {
        values[field.name] = field.value;
      });
      
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
      
        var account = accounts[0];
      
        App.contracts.Loan.deployed().then(function(instance) {
          smartcontractInstance = instance;
  
          console.log('--> initial_cashpayment - App.contracs.initialCashPayment.deployed');
      
          // Confirm if Lender confirms to send the initial cash payment
          if ($('#lender_sends_initialcashpayment').is(':checked')) {
            return smartcontractInstance.initialCashPayment(new Date(values['initial_current_date'].split("/").reverse().join("-")).getTime(),
                                                     {from: account,
                                                      value: App.initialCashPaymentAmount});
          } else {
              alert("Dear lender, please confirm if you confirm this contract.");
          }
        }).then(function(result) {
          
          console.log('Done Step 2 Initial Cash Payment from Lender to Borrower');
          App.updateRegularDrawdown($('div.drawdown_form.messages_drawdown'));
          App.updateLenderCommitment($('div.drawdown_form.messages_commitment'));

          /*******************/
          App.expectedProgress = App.findExpectedProjectProgress();
        
          return true; 

        }).catch(function(err) {
          console.log(err.message);
        });
      });
    },

    /* Update Drawdown */
    updateRegularDrawdown: function(element) {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        console.log('--> getCurrentLoandId - App.contracs.findCurrentLoanId.deployed');
        console.log(instance);
    
        // Execute adopt as a transaction by sending account
        return loanInstance.findRegularDrawdownAmount.call();

      }).then(function(drawdownAmount) {

        drawdownAmount = drawdownAmount.toNumber();
        console.log("--> getCurrentLoandId - Showing result: ");
        console.log(drawdownAmount);

        App.regularDrawdownAmount = drawdownAmount;

        if (drawdownAmount != undefined && element != undefined) {
          element.empty();
          element.html('<spam> The next Drawdown Amount is: <p style="font-weight: bold;">' + Fx.convertToCurrency(web3.fromWei(drawdownAmount, 'ether'), 'EUR') + ' EUR.</p></spam>'); 
        }

        return drawdownAmount;

      }).catch(function(err) {
        console.log(err.message);
      });
    },

    /* Update Lenders Commitment */
    updateLenderCommitment: function(element) {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        console.log('--> updateLenderCommitment - App.contracs.findLenderCommitment.deployed');
    
        // Execute adopt as a transaction by sending account
        return loanInstance.findLendersOpenCommitment.call();

      }).then(function(commitmentAmount) {

        commitmentAmount = commitmentAmount.toNumber();
        console.log("--> updateLenderCommitment - Showing result: ");
        console.log(commitmentAmount);
        App.lendersCommitmentAmount = commitmentAmount;

        if (commitmentAmount != undefined) {
          element.empty();
          var commitmentvalue = Math.floor(Fx.convertToCurrency(web3.fromWei(commitmentAmount, 'ether'), 'EUR')); 
          if (commitmentvalue > 0) {
            element.html('<spam> The Lenders Commitment Amount is: <p style="font-weight: bold;">' + commitmentvalue + ' EUR.</p></spam>');
          } else {
            element.html('<spam> The Lenders Commitment Amount is: <p style="font-weight: bold;">' + commitmentvalue + ' EUR.</p><br/>'+
                         '<p>Now, it´s time for REPAYMENT.<br/></p></spam>');
          }

        }

        return commitmentAmount;

      }).catch(function(err) {
        console.log(err.message);
      });
    },

    /* Helper Function */
    findBorrowerDrawdownAmount: function() {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        console.log('--> findBorrowerDrawdownAmount - App.contracs.findBorrowerDrawdownAmount.deployed');
        console.log(instance);
    
        // Execute adopt as a transaction by sending account
        return loanInstance.findBorrowerDrawdownAmount.call();

      }).then(function(totaldrawdownamount) {

        totaldrawdownamount = totaldrawdownamount.toNumber();
        console.log("--> findBorrowerDrawdownAmount - Showing result: ");
        console.log(totaldrawdownamount);

        if (totaldrawdownamount != undefined) {
          //Updating next step
          console.log('<p> The total Borrowers Drawdown Amount is: ' + totaldrawdownamount + '</p>');
        }

        return totaldrawdownamount;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },

    /******************** Helper Function *****************/
    findExpectedProjectProgress: function(element) {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        // Execute adopt as a transaction by sending account
        return loanInstance.findCurrentProjectProgress.call();

      }).then(function(expectedprogress) {

        expectedprogress = expectedprogress.toNumber();
        
        if (expectedprogress != undefined) {
          //Updating next step
          console.log('The expected Project Progress is: ' + expectedprogress);
          if (element != undefined) {
            element.html('The expected Project Progress is: ' + expectedprogress);
          }
        }

        return expectedprogress;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },


    /******************** Helper Function *****************/
    findLendersOpenCommitment: function() {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        //console.log('--> findLendersOpenCommitment - App.contracs.findLendersOpenCommitment.deployed');
        //console.log(instance);
    
        // Execute adopt as a transaction by sending account
        return loanInstance.findLendersOpenCommitment.call();

      }).then(function(lendersOpenCommitment) {

        lendersOpenCommitment = lendersOpenCommitment.toNumber();

        if (lendersOpenCommitment != undefined) {
          //Updating next step
          console.log('The lenders Open Commitment is: ' + lendersOpenCommitment);
        }

        return lendersOpenCommitment;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },

    verifyDrawdownApproval: function(event) {
      event.preventDefault();

      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        var values = {};
        $.each($('#drawdown_form').serializeArray(), function(i, field) {
          values[field.name] = field.value;
        });
    
        // Execute adopt as a transaction by sending account
        return loanInstance.verifyDrawdownApproval.call(values['project_progress']);

      }).then(function(verify) {
        console.log("--> verifyDrawdownApproval - Showing result: " + verify);
        if (verify != undefined) {
          if (verify == true) {
            if (App.regularDrawdownAmount == 0) App.updateRegularDrawdown();
            App.requestDrawdown();
            return true;
          } else {
            App.findExpectedProjectProgress($('div.drawdown_form.messages_progress'));
            $('div.drawdown_form.messages_drawdown').html("");
            $('div.drawdown_form.messages_commitment').html("");
            return false;
          }
        }
      }).catch(function(err) {
        console.log(err.message);
      });
    },

    /* 3rd Step: Request Drawdown */
    requestDrawdown : function() {
      console.log('requestDrawdown');
      
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
      
        var account = accounts[0];
  
        console.log("Account 0: " + accounts[0]);
      
        App.contracts.Loan.deployed().then(function(instance) {
          smartcontractInstance = instance;
          console.log('--> requestDrawdown - App.contracts.requestDrawdown.deployed');

          var cashpayment_amount = App.regularDrawdownAmount;
          if (cashpayment_amount == undefined) alert("Invalid amount value for Cash Payment Drawdown");
          
          var values = {};
          $.each($('#drawdown_form').serializeArray(), function(i, field) {
            values[field.name] = field.value;
          });

          // Borrower requests drawdown
          return smartcontractInstance.requestDrawdown(new Date(values['drawdawn_current_date'].split("/").reverse().join("-")).getTime(),
                                                    {from: account,
                                                    value: cashpayment_amount});
          
        }).then(function(result) {

          console.log("DRAWDOWN REQUESTED CORRECTLY.");
          App.updateRegularDrawdown($('div.drawdown_form.messages_drawdown'));
          App.updateLenderCommitment($('div.drawdown_form.messages_commitment'));
          return true;
          
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    },

    /******************** Helper Function *****************/
    findInterestRate: function() {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        console.log('--> findLendersOpenCommitment - App.contracs.findLendersOpenCommitment.deployed');
        console.log(instance);
    
        // Execute adopt as a transaction by sending account
        return loanInstance.findLoansInterestRate.call();

      }).then(function(interestRate) {

        interestRate = interestRate.toNumber();
        console.log("--> findInterestRate - Showing result: ");
        console.log(interestRate);

        if (interestRate != undefined) {
          console.log('Loan interest rate is: ' + interestRate);
        }

        return interestRate;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },

    /* Update Drawdown */
    getPaymentInterest: function() {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        console.log('--> getCurrentLoandId - App.contracs.getPaymentInterest.deployed');
        console.log(instance);
    
        // Execute adopt as a transaction by sending account
        return loanInstance.getPaymentInterest.call();

      }).then(function(paymentInterest) {

        paymentInterest = paymentInterest.toNumber();
        if (paymentInterest != undefined) {
          console.log('The current Payment Interest Amount is: ' + Fx.convertToCurrency(web3.fromWei(paymentInterest, 'ether'), 'EUR')); 
        }

        return paymentInterest;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },

    verifyRepayment: function(event) {
      event.preventDefault();

      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        var values = {};
        $.each($('#repayment_form').serializeArray(), function(i, field) {
          values[field.name] = field.value;
        });
    
        // Execute adopt as a transaction by sending account
        return loanInstance.verifyRepayment.call(web3.toWei(Fx.convertToEther(values['repayment_amount'],'EUR'),'ether'));

      }).then(function(verify) {
        console.log("--> verifyRepayment - Showing result: " + verify);
        if (verify != undefined) {
          if (verify == true) {
            App.requestRepayment();
            return true;
          } else {
            return false;
          }
        }
      }).catch(function(err) {
        console.log(err.message);
      });
    },

    /* Last Step: Repayment */
    requestRepayment : function() {
      console.log('repayment');
      
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
      
        var account = accounts[0];
  
        App.contracts.Loan.deployed().then(function(instance) {
          smartcontractInstance = instance;
          console.log('--> requestRepayment - App.contracts.requestRepayment.deployed');

          var values = {};
          $.each($('#repayment_form').serializeArray(), function(i, field) {
            values[field.name] = field.value;
          });

          // Borrower sends Repayment
          return smartcontractInstance.requestRepayment(new Date(values['repayment_current_date'].split("/").reverse().join("-")).getTime(),
                                                    {from: account,
                                                    value: web3.toWei(Fx.convertToEther(values['repayment_amount'],'EUR'),'ether')});
          
        }).then(function(result) {

          console.log("REPAYMENT DONE CORRECTLY.");
          App.updateRegularDrawdown($('div.repayment_form.messages_repayment'));
          return true;
          
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    },

    /* Helper Function */
    findTotalRepaymentAmount: function() {
      var loanInstance;

      App.contracts.Loan.deployed().then(function(instance) {
        loanInstance = instance;

        console.log('--> findTotalRepaymentAmount - App.contracs.findTotalRepaymentAmount.deployed');
        console.log(instance);
    
        // Execute adopt as a transaction by sending account
        return loanInstance.findTotalRepaymentAmount.call();

      }).then(function(totalrepaymentamount) {

        totalrepaymentamount = totalrepaymentamount.toNumber();
        
        if (totalrepaymentamount != undefined) {
          //Updating next step
          console.log('The total Repayment Amount by the Borrower is: ' + totalrepaymentamount);
        }

        return totalrepaymentamount;
      
      }).catch(function(err) {
        console.log(err.message);
      });
    },

  };
  
  $(function() {
    $(window).load(function() {
      App.init();
    });
  });
  