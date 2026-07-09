// A small rule-based assistant that answers questions using only the real
// data already in the database. No external API key required, so it works
// out of the box with no extra cost. Keeps things honest: no numbers are
// ever invented.

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

    if(/\btoday\b/.test(q)) return "today";

    if(/\blast week\b/.test(q)) return "week";

    if(/\bthis week\b|\bweek\b/.test(q)) return "week";

    if(/\blast month\b/.test(q)) return "lastmonth";

    if(/\bthis month\b|\bmonth\b/.test(q)) return "month";

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

/**
 * Business Summary
 */
function getBusinessSummary(stats){

    const advice=[];

    if(stats.groundnutRevenue>stats.peanutRevenue){

        advice.push(
            "• Groundnuts are currently your strongest source of income."
        );

    }else if(stats.peanutRevenue>stats.groundnutRevenue){

        advice.push(
            "• Peanut butter currently generates more revenue."
        );

    }

    if(stats.profit<0){

        advice.push(
            "• The business is operating at a loss. Review your expenses."
        );

    }else if(stats.profit<stats.revenue*0.2){

        advice.push(
            "• Profit is relatively low compared to revenue."
        );

    }else{

        advice.push(
            "• Your current profit margin looks healthy."
        );

    }

    if(stats.outstandingDebt>0){

        advice.push(
            `• Outstanding debts total ${money(stats.outstandingDebt)}. Following up with customers would improve cash flow.`
        );

    }else{

        advice.push(
            "• There are currently no outstanding debts."
        );

    }

    return `
📊 BUSINESS SUMMARY

Revenue: ${money(stats.revenue)}

Expenses: ${money(stats.expenses)}

Estimated Profit: ${money(stats.profit)}

Outstanding Debt: ${money(stats.outstandingDebt)}

Groundnut Revenue: ${money(stats.groundnutRevenue)}

Peanut Butter Revenue: ${money(stats.peanutRevenue)}

Groundnuts Sold: ${stats.groundnutQty}

Peanut Butter Sold: ${stats.peanutQty}

Recommendations

${advice.join("\n")}
`.trim();

}

/**
 * Compare this month with last month
 */
function compareMonthlyPerformance(data){

    const currentSales=filterByDate(data.sales,"sale_date","month");

    const previousSales=filterByDate(data.sales,"sale_date","lastmonth");

    const currentExpenses=filterByDate(data.expenses,"expense_date","month");

    const previousExpenses=filterByDate(data.expenses,"expense_date","lastmonth");

    const revenue=rows=>rows.reduce(
        (a,s)=>a+(Number(s.qty)*Number(s.unit_price)),
        0
    );

    const expense=rows=>rows.reduce(
        (a,e)=>a+Number(e.amount),
        0
    );

    const currentRevenue=revenue(currentSales);

    const previousRevenue=revenue(previousSales);

    const currentExpense=expense(currentExpenses);

    const previousExpense=expense(previousExpenses);

    const currentProfit=currentRevenue-currentExpense;

    const previousProfit=previousRevenue-previousExpense;

    function compare(now,before){

        const diff=now-before;

        if(before===0){

            return{

                diff,

                percent:null

            };

        }

        return{

            diff,

            percent:((diff/before)*100).toFixed(1)

        };

    }

    const revenueDiff=compare(currentRevenue,previousRevenue);

    const expenseDiff=compare(currentExpense,previousExpense);

    const profitDiff=compare(currentProfit,previousProfit);

    function line(name,item){

        if(item.percent===null){

            return `${name}: ${money(item.diff)} (no previous data)`;

        }

        return `${name}: ${item.diff>=0?"↑":"↓"} ${item.percent}% (${money(item.diff)})`;

    }

    return `
📈 MONTHLY COMPARISON

${line("Revenue",revenueDiff)}

${line("Expenses",expenseDiff)}

${line("Profit",profitDiff)}

${currentProfit>previousProfit
?"✅ Your business is improving compared to last month."
:"⚠️ Profit has declined compared to last month."}
`.trim();

}

function answerQuestion(question, data) {

    const q = (question || "").toLowerCase();

    const range = detectRange(q);

    const label = rangeLabel(range);

    const sales = filterByDate(data.sales, "sale_date", range);

    const expenses = filterByDate(data.expenses, "expense_date", range);

    const revGn = sales
        .filter(s => s.product === "groundnuts")
        .reduce((a, s) => a + Number(s.qty) * Number(s.unit_price), 0);

    const revPb = sales
        .filter(s => s.product === "peanutbutter")
        .reduce((a, s) => a + Number(s.qty) * Number(s.unit_price), 0);

    const qtyGn = sales
        .filter(s => s.product === "groundnuts")
        .reduce((a, s) => a + Number(s.qty), 0);

    const qtyPb = sales
        .filter(s => s.product === "peanutbutter")
        .reduce((a, s) => a + Number(s.qty), 0);

    const totalRev = revGn + revPb;

    const totalExp = expenses.reduce(
        (a, e) => a + Number(e.amount),
        0
    );

    const profit = totalRev - totalExp;

    const unpaidDebts = data.debts.filter(d => !d.paid);

    const outstanding = unpaidDebts.reduce(
        (a, d) => a + Number(d.amount),
        0
    );

    const businessStats = {

        revenue: totalRev,

        expenses: totalExp,

        profit,

        outstandingDebt: outstanding,

        groundnutRevenue: revGn,

        peanutRevenue: revPb,

        groundnutQty: qtyGn,

        peanutQty: qtyPb

    };

    // ==========================
    // Monthly comparison
    // ==========================
    if (
        /compare|comparison|improving|growth|decline|better than last month|compare this month|last month/.test(q)
    ) {

        return compareMonthlyPerformance(data);

    }

    // ==========================
    // Business summary
    // ==========================
    if (
        /business|summary|overview|performance|status|health|analysis|analyze|recommend|recommendation|advice|improve|how am i doing|how is my business|how are things going/.test(q)
    ) {

        return getBusinessSummary(businessStats);

    }

    // ==========================
    // Debts
    // ==========================
    if (/who (owes|owe)|outstanding debt|debtors|unpaid/.test(q)) {

        if (!unpaidDebts.length) {

            return "Nobody currently owes you money — all debts are paid.";

        }

        const top = unpaidDebts
            .slice()
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8);

        const lines = top.map(d =>
            `${d.name} owes ${money(d.amount)} (${d.product === "peanutbutter" ? "peanut butter" : "groundnuts"})`
        );

        return `Outstanding debt is ${money(outstanding)} across ${unpaidDebts.length} people. Biggest: ${lines.join("; ")}.`;

    }

    // Profit
    if (/profit/.test(q)) {

        return `Profit for ${label} is ${money(profit)} (Revenue ${money(totalRev)} minus Expenses ${money(totalExp)}).`;

    }

    // Expenses
    if (/expense|spend|spent|cost/.test(q)) {

        if (!expenses.length) {

            return `No expenses were recorded for ${label}.`;

        }

        const byBiz = {

            groundnuts: 0,

            peanutbutter: 0,

            shared: 0

        };

        expenses.forEach(e => {

            byBiz[e.business] =
                (byBiz[e.business] || 0) + Number(e.amount);

        });

        return `Expenses for ${label}: Groundnuts ${money(byBiz.groundnuts)}, Peanut Butter ${money(byBiz.peanutbutter)}, Shared ${money(byBiz.shared)}. Total ${money(totalExp)}.`;

    }

    // Peanut butter
    if (/peanut butter|jars?/.test(q) && !/groundnut/.test(q)) {

        return `You sold ${qtyPb} jar${qtyPb === 1 ? "" : "s"} of peanut butter during ${label}, earning ${money(revPb)}.`;

    }

    // Groundnuts
    if (/groundnut/.test(q) && !/peanut butter/.test(q)) {

        return `You sold ${qtyGn} piece${qtyGn === 1 ? "" : "s"} of groundnuts during ${label}, earning ${money(revGn)}.`;

    }

    // Revenue
    if (/revenue|sales|sold|made|earn|income/.test(q)) {

        return `Revenue for ${label}: Groundnuts ${money(revGn)} (${qtyGn} sold), Peanut Butter ${money(revPb)} (${qtyPb} sold). Total Revenue ${money(totalRev)}.`;

    }

    return `Here's your business snapshot for ${label}: Revenue ${money(totalRev)}, Expenses ${money(totalExp)}, Profit ${money(profit)}, Outstanding Debt ${money(outstanding)}. Try asking "Compare this month to last month" or "Business summary".`;

}

module.exports = {
    answerQuestion
};
