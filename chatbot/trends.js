const { money, filterByDate } = require('./utils');
const intents = require('./intents');

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

function handleTrendQuestion(q, data) {
    if (intents.trends.test(q)) {
        return compareMonthlyPerformance(data);
    }

    return null;
}

module.exports = {
    compareMonthlyPerformance,
    handleTrendQuestion
};
