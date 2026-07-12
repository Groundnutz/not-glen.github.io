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
 * Groups all unpaid debts by customer.
 * This lets the chatbot think in terms of customers instead of rows.
 */
function groupDebtorsByCustomer(debts) {

    const customers = {};

    debts
        .filter(d => !d.paid)
        .forEach(d => {

            const name = d.name.trim();

            if (!customers[name]) {

                customers[name] = {

                    name,

                    totalDebt: 0,

                    groundnuts: 0,

                    peanutButter: 0

                };

            }

            customers[name].totalDebt += Number(d.amount);

            if (d.product === "groundnuts") {

                customers[name].groundnuts += Number(d.qty);

            }

            if (d.product === "peanutbutter") {

                customers[name].peanutButter += Number(d.qty);

            }

        });

    return Object.values(customers)
        .sort((a,b)=>b.totalDebt-a.totalDebt);

}
function findCustomer(name, customerDebts) {

    return customerDebts.find(c =>
        c.name.toLowerCase() === name.toLowerCase()
    );

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
/**
 * Gives intelligent business advice using real ledger data.
 * No AI required—just analysis.
 */
function getBusinessInsights(stats) {

    const insights = [];

    // Revenue contribution
    const totalRevenue = stats.groundnutRevenue + stats.peanutRevenue;

    const groundnutPercent =
        totalRevenue === 0
            ? 0
            : ((stats.groundnutRevenue / totalRevenue) * 100).toFixed(1);

    const peanutPercent =
        totalRevenue === 0
            ? 0
            : ((stats.peanutRevenue / totalRevenue) * 100).toFixed(1);

    insights.push(
        `Groundnuts generate ${groundnutPercent}% of your total revenue.`
    );

    insights.push(
        `Peanut butter generates ${peanutPercent}% of your total revenue.`
    );

    // Profitability
    if (stats.profit < 0) {
        insights.push(
            "⚠ Your expenses are currently higher than your revenue."
        );
    } else {
        insights.push(
            "✅ Your business is currently profitable."
        );
    }

    // Debt
    if (stats.outstandingDebt > 0) {
        insights.push(
            `You have ${money(stats.outstandingDebt)} waiting to be collected from customers.`
        );
    } else {
        insights.push(
            "You currently have no outstanding debts."
        );
    }

    // Recommendations
    const recommendations = [];

    if (groundnutPercent > peanutPercent) {
        recommendations.push(
            "Increase groundnut stock because it is your strongest product."
        );
    }

    if (peanutPercent < 20) {
        recommendations.push(
            "Consider promoting peanut butter through offers or bundles."
        );
    }

    if (stats.profit < 0) {
        recommendations.push(
            "Reduce unnecessary expenses before increasing inventory."
        );
    }

    if (recommendations.length === 0) {
        recommendations.push(
            "Maintain your current strategy and continue monitoring performance."
        );
    }

    return `
📈 BUSINESS INSIGHTS

${insights.join("\n")}

Priority Actions

${recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
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
    const customerDebts = groupDebtorsByCustomer(data.debts);
    // ==========================
// Detect customer mentioned in the question
// ==========================
const customer = customerDebts.find(c => {

    const customerName = c.name.trim().toLowerCase();

    return q.includes(customerName);

});

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
// Customer lookup
// ==========================
if (
    customer &&
    /owe|debt|customer|tell me about|summary|who is/.test(q)
) {

    const items = [];

    if (customer.peanutButter)
        items.push(`${customer.peanutButter} Peanut Butter`);

    if (customer.groundnuts)
        items.push(`${customer.groundnuts} Groundnuts`);

    return `
👤 CUSTOMER SUMMARY

Name: ${customer.name}

Outstanding Debt: ${money(customer.totalDebt)}

Products:
${items.join("\n")}
`.trim();

}

// ==========================
// Monthly comparison
// ==========================
if (
    /compare|comparison|improving|growth|decline|better than last month|compare this month|last month/.test(q)
) {
    return compareMonthlyPerformance(data);
}

// ==========================
// Business Insights
// ==========================
if (
    /focus|improve|insight|insights|what should i do|what next|business advice|help my business|strategy|priority/.test(q)
) {
    return getBusinessInsights(businessStats);
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
// Customer Summary
// ==========================
if (
    customer &&
    (
        q.includes("about") ||
        q.includes("owe") ||
        q.includes("debt") ||
        q.includes("customer") ||
        q.includes("summary")
    )
) {

    const items = [];

    if (customer.peanutButter > 0) {
        items.push(`🥜 Peanut Butter: ${customer.peanutButter}`);
    }

    if (customer.groundnuts > 0) {
        items.push(`🌰 Groundnuts: ${customer.groundnuts}`);
    }

    return `
👤 CUSTOMER SUMMARY

Customer: ${customer.name}

Outstanding Debt: ${money(customer.totalDebt)}

Items Owed

${items.join("\n")}
`.trim();

}

    // ==========================
    // Debts
    // ==========================
    if (/who (owes|owe)|outstanding debt|debtors|unpaid/.test(q)) {

    if (!customerDebts.length) {

        return "Nobody currently owes you money.";

    }

    const top = customerDebts.slice(0,8);

    const lines = top.map(c => {

        const items = [];

        if(c.peanutButter)
            items.push(`${c.peanutButter} Peanut Butter`);

        if(c.groundnuts)
            items.push(`${c.groundnuts} Groundnuts`);

        return `${c.name} owes ${money(c.totalDebt)} (${items.join(", ")})`;

    });

    return `Outstanding debt is ${money(outstanding)} across ${customerDebts.length} customers.\n\n${lines.join("\n")}`;

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
