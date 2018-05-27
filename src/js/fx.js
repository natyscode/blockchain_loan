Fx = {
    base: "ETHER",
    init : {
        //https://www.cryptocompare.com/coins/eth/overview/
        "EUR" : 2800, 
        "GBP" : 2900,
        "USD" : 3200, 
    },
    convertToEther : function (amount, currency) {
        if (Fx.init[currency] != undefined){
            return amount/Fx.init[currency];
        } else {
            return undefined;
        }
    },
    convertToCurrency : function (amount, currency) {
        if (Fx.init[currency] != undefined){
            return amount*Fx.init[currency];
        } else {
            return undefined;
        }
    },
}