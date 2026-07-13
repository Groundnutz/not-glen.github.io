// A small rule-based assistant that answers questions using only the real
// data already in the database. No external API key required, so it works
// out of the box with no extra cost. Keeps things honest: no numbers are
// ever invented.

const { detectRange, rangeLabel, filterByDate, money } = require('./utils');
const { groupDebtorsByCustomer, handleCustomerQuestion, handleDebtQuestion } = require('./customers');
const { handleInsightQuestion } = require('./insights');
const { handleTrendQuestion } = require('./trends');
const { 
    handleRevenueQuestion, 
    handleProfitQuestion, 
    handleExpenseQuestion,
    handlePeanutButterQuestion,
    handleGroundnutsQuestion
} = require('./finance');

function answerQuestion(question, data) {

    const q = (question || "").toLowerCase();

    const range = detectRange(q);

    const label = rangeLabel(range);

    const sales = filterByDate(data.sales, "sale_date", range);

    const expenses = filterByDate(data.expenses, "expense_date", range);

    // Compute all shared statistics ONCE
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

    // Call handlers in order: Customer, Insights, Trends, Finance

    // Customer handlers
    const customerResponse = handleCustomerQuestion(q, customerDebts);
    if (customerResponse) return customerResponse;

    const debtResponse = handleDebtQuestion(q, customerDebts, outstanding);
    if (debtResponse) return debtResponse;

    // Insights handlers
    const insightResponse = handleInsightQuestion(q, businessStats);
    if (insightResponse) return insightResponse;

    // Trends handlers
    const trendResponse = handleTrendQuestion(q, data);
    if (trendResponse) return trendResponse;

    // Finance handlers
    const profitResponse = handleProfitQuestion(q, businessStats, label);
    if (profitResponse) return profitResponse;

    const expenseResponse = handleExpenseQuestion(q, expenses, businessStats, label);
    if (expenseResponse) return expenseResponse;

    const peanutButterResponse = handlePeanutButterQuestion(q, businessStats, label);
    if (peanutButterResponse) return peanutButterResponse;

    const groundnutsResponse = handleGroundnutsQuestion(q, businessStats, label);
    if (groundnutsResponse) return groundnutsResponse;

    const revenueResponse = handleRevenueQuestion(q, businessStats, label);
    if (revenueResponse) return revenueResponse;

    // Fallback response (unchanged)
    return `Here's your business snapshot for ${label}: Revenue ${money(totalRev)}, Expenses ${money(totalExp)}, Profit ${money(profit)}, Outstanding Debt ${money(outstanding)}. Try asking "Compare this month to last month" or "Business summary".`;

}

module.exports = {
    answerQuestion
};
