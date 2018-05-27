Schedule = {
    //Object values
    cashflow_array : [],
    cashflow_obj_unit : {date:null,borrower_drawdown:0,lender_outs_comm:0,borrower_drawdown_amount:0,borrower_int_pay:0,borrower_repayment:0},
    total_loan_amount : 0,
    interest_rate : 0.05,
    interest_convention : 30/360,
    status : 'new',

    //Input from User
    event_date : null,
    drawdown : 0, //requested by borrower
    repayment : 0, //given by borrower

    init: function(jObj) {
        jObj.change(function() {
            if (!Schedule.is_valid_number(jObj.val()) && jObj.val() < 0) {
                console.log("Schedule: Please introduce a valid total loan amount.");
            } else {
                Schedule.total_loan_amount = parseInt(jObj.val());
                console.log("Schedule: Correctly initialized.");
            }
        });
    },

    is_valid_number: function(val) {
        if(!isNaN(val)) { return true; } else { return false; }
    },

    /*
    * @TODO
    * Rules: Format dd/mm/yyyy
    * Valid date and always later than date before in the  previous row at cashflow_array
    * cashflow_array is formed by cashflow_obj_unit
    * */
    is_valid_date: function(date){
        return true;
    },

    /*
    * Rules:
    * Valid number and always less than total_loan_amount taking into account the repayment
    * Less than outstanding commitment at Lender
    * It can be 0 or void
    * */
    is_valid_drawdown: function(value){
        if (Schedule.is_valid_number(value)) {
            if (value >= Schedule.total_loan_amount) {
                console.log("Schedule: Please introduce a drawdown amount less than loan amount.");
                return false;
            } 
            else return true;
        } else {
            console.log("Schedule: Please introduce a valid drawdown amount.");
            return false;
        }
    },

    is_valid_repayment: function(value) {
        if (Schedule.is_valid_number(value)) {
            if (value >= Schedule.total_loan_amount) {
                console.log("Schedule: Please introduce a re-payment amount less than loan amount.");
                return false;
            }
            if (Schedule.status == 'new' && Schedule.cashflow_array.length != 0) {
                console.log("Schedule: Repayment can not be done at this stage.");
                return false;
            }
            return true;
        } else {
            console.log("Schedule: Please introduce a valid re-payment amount.");
            return false;
        }
    },
    
    /*
    * event_date: Format expected dd/mm/yyyy - mandatory
    * drawdown: uint value - optional
    * repayment: uint value - optional
    */
    addCashflowEvent: function(event_date, drawdown, repayment) {
        if (!Schedule.is_valid_date(event_date)) return false;
        if (!Schedule.is_valid_drawdown(drawdown)) return false;
        if (!Schedule.is_valid_repayment(repayment)) return false;
        //First cashflow event
        if (Schedule.cashflow_array.length == 0) {
            
            var cashflow_obj_unit = {
                date: event_date,
                borrower_drawdown: drawdown,
                lender_outs_comm: Schedule.total_loan_amount - drawdown,
                borrower_drawdown_amount: drawdown,
                borrower_int_pay: 0,
                borrower_repayment: 0
            };
            Schedule.cashflow_array.push(cashflow_obj_unit);
            Schedule.status = 'ongoing';
        } else { /*Regular Cashflow event*/
            var cashflow_obj_unit = {
                date: event_date,
                borrower_drawdown: drawdown,
                lender_outs_comm: Schedule.calculate_lender_outs_comm(drawdown, repayment),
                borrower_drawdown_amount: Schedule.calculate_borrower_drawdown_amount(drawdown, repayment),
                borrower_int_pay: Schedule.calculate_borrower_int_pay(drawdown, repayment),
                borrower_repayment: repayment
            };
            Schedule.cashflow_array.push(cashflow_obj_unit);
        }
    },
    calculate_lender_outs_comm: function(drawdown, repayment) {
        obj_len = Schedule.cashflow_array.length;
        if (obj_len > 0) {
            prev_lender_outs_com = Schedule.cashflow_array[obj_len-1]['lender_outs_comm'];
            if (prev_lender_outs_com - drawdown < 0) {
                console.log('Schedule: The drawdown is higher than the Lenders outstanding commitment.');
                return 0;
            } else {
                return prev_lender_outs_com - drawdown;
            }
        } else {
            return Schedule.total_loan_amount - drawdown;
        }
    },
    calculate_borrower_drawdown_amount: function(drawdown, repayment) {
        obj_len = Schedule.cashflow_array.length;
        if (obj_len > 0) {
            prev_borrower_drawdown_amount = Schedule.cashflow_array[obj_len-1]['borrower_drawdown_amount'];
            if (prev_borrower_drawdown_amount < Schedule.total_loan_amount && Schedule.cashflow_array[obj_len-1]['lender_outs_comm'] > 0) {
                if (prev_borrower_drawdown_amount + drawdown > Schedule.total_loan_amount) {
                    console.log('Schedule: The drawdown amount cannot exceed the loan amount.');
                    return 0;
                } else {
                    if (prev_borrower_drawdown_amount + drawdown == Schedule.total_loan_amount) Schedule.status = 'repayment';
                    return prev_borrower_drawdown_amount + drawdown;
                }
            }
            if (Schedule.cashflow_array[obj_len-1]['lender_outs_comm'] == 0 && repayment) {
                if (prev_borrower_drawdown_amount - repayment < 0) {
                    console.log('Schedule: Repayment shall not exceed the outstanding amount.');
                    return 0;
                } else {
                    if (prev_borrower_drawdown_amount - repayment == 0) Schedule.status = 'closed'; else Schedule.status = 'repayment';
                    
                    return prev_borrower_drawdown_amount - repayment;
                }
            } else {
                Schedule.status = 'repayment';
                return prev_borrower_drawdown_amount;
            }

        } else {
            return drawdown;
        }
    },
    calculate_borrower_int_pay: function(drawdown, repayment) {
        obj_len = Schedule.cashflow_array.length;
        if (obj_len > 0) {
            prev_borrower_drawdown_amount = Schedule.cashflow_array[obj_len-1]['borrower_drawdown_amount'];
            interest = prev_borrower_drawdown_amount * Schedule.interest_rate * Schedule.interest_convention;
            return interest;
        } else {
            Schedule.status = 'new';
            return 0;
        }
    }
}