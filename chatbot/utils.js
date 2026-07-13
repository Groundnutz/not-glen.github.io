// Utility/helper functions for the chatbot
const intents = require('./intents');

function money(n) {
    return "KSh " + Math.round(n || 0).toLocaleString("en-KE");
}

function startOfRange(range) {

    const now = new Date();
    const d = new Date(now);

    if (range === "today") {
        d.setHours(0,0,0,0);
        return d;
    }

    if (range === "week") {
        d.setDate(d.getDate()-7);
        return d;
    }

    if (range === "month") {
        d.setDate(1);
        d.setHours(0,0,0,0);
        return d;
    }

    if (range === "lastmonth") {
        d.setMonth(d.getMonth()-1,1);
        d.setHours(0,0,0,0);
        return d;
    }

    return new Date(0);

}

function endOfRange(range){

    if(range==="lastmonth"){

        const now=new Date();

        return new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

    }

    return new Date(8640000000000000);

}

function detectRange(q){

    if(intents.today.test(q)) return "today";

    if(intents.lastWeek.test(q)) return "week";

    if(intents.thisWeek.test(q)) return "week";

    if(intents.lastMonth.test(q)) return "lastmonth";

    if(intents.thisMonth.test(q)) return "month";

    return "all";

}

function rangeLabel(range){

    return {

        today:"today",

        week:"the last 7 days",

        month:"this month",

        lastmonth:"last month",

        all:"all time"

    }[range];

}

function filterByDate(rows,dateField,range){

    const start=startOfRange(range);

    const end=endOfRange(range);

    return rows.filter(r=>{

        const d=new Date(r[dateField]);

        return d>=start && d<end;

    });

}

module.exports = {
    money,
    startOfRange,
    endOfRange,
    detectRange,
    rangeLabel,
    filterByDate
};
