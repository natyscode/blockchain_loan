$(document).ready(function(){

    // Add rows for scheduling table

    Schedule.init($('#loan_amount'));

    $(".add-row").click(function() {
        var parent = $(this).parent();
        
        var drawdown_schedule = $(".schedule_date", parent).val();

        if ($(".schedule_amount", parent).val() == "" || $(".schedule_amount", parent).val() == undefined) { var drawdown_amount = 0; }
        else { var drawdown_amount = parseInt($(".schedule_amount", parent).val()); }

        if ($(".repayment_amount", parent).val() == "" || $(".repayment_amount", parent).val() == undefined) { var repayment_amount = 0; } 
        else { var repayment_amount = parseInt($(".repayment_amount", parent).val()); }
        

        Schedule.addCashflowEvent(drawdown_schedule, drawdown_amount, repayment_amount);

        len = Schedule.cashflow_array.length;
        if (len > 0) {

            // {date:null,borrower_drawdown:0,lender_outs_comm:0,borrower_drawdown_amount:0,borrower_int_pay:0,borrower_repayment:0}

            cashflow_obj_unit_tmp = Schedule.cashflow_array[len-1];
            var markup = "<tr>"+
            "<td><input type='checkbox' name='record'></td>"+
            "<td>" + cashflow_obj_unit_tmp.date + "</td>"+
            "<td>" + cashflow_obj_unit_tmp.borrower_drawdown + "</td>"+
            "<td>" + cashflow_obj_unit_tmp.lender_outs_comm + "</td>"+
            "<td>" + cashflow_obj_unit_tmp.borrower_drawdown_amount + "</td>"+
            "<td>" + cashflow_obj_unit_tmp.borrower_int_pay + "</td>"+
            "<td>" + cashflow_obj_unit_tmp.borrower_repayment + "</td>"+
            "</tr>";
            $("table tbody", parent).append(markup);
        }

        /*
        if (!isNaN(open_commitment) && open_commitment >= 0) {
            var markup = "<tr>"+
                        "<td><input type='checkbox' name='record'></td>"+
                        "<td>" + drawdown_schedule + "</td>"+
                        "<td class=\"open_commitment\">" + drawdown_amount + "</td>"+
                        "<td>" + open_commitment + "</td>"+
                        "</tr>";
            $("table tbody", parent).append(markup);
        }

        if (open_commitment <= 0 || open_commitment == false) {
            $(".add-row", parent).prop('disabled', true);
        }
        */
    });
    
    // Find and remove selected table rows
    $(".delete-row").click(function(){
        var parent = $(this).parent();
        $("table tbody", parent).find('input[name="record"]').each(function(){
            if($(this).is(":checked")){
                $(this).parents("tr").remove();
            }
        });
    });

    // Datepicker
    $( ".datepicker" ).datepicker({
        dateFormat: 'dd/mm/yy',
        changeMonth: true,
        changeYear: true
    });

});