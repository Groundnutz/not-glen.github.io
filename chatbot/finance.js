const { money, rangeLabel } = require('./utils');
const intents = require('./intents');

function handleRevenueQuestion(q, stats, label) {
    if (intents.revenue.test(q)) {
        return `Revenue for ${label}: Groundnuts ${money(stats.groundnutRevenue)} (${stats.groundnutQty} sold), Peanut Butter ${money(stats.peanutRevenue)} (${stats.peanutQty} sold). Total Revenue ${money(stats.revenue)}.`;
    }
    return null;
}

function handleProfitQuestion(q, stats, label) {
    if (intents.profit.test(q)) {
        return `Profit for ${label} is ${money(stats.profit)} (Revenue ${money(stats.revenue)} minus Expenses ${money(stats.expenses)}).`;
    }
    return null;
}

function handleExpenseQuestion(q, expenses, stats, label) {
    if (intents.expenses.test(q)) {
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

        return `Expenses for ${label}: Groundnuts ${money(byBiz.groundnuts)}, Peanut Butter ${money(byBiz.peanutbutter)}, Shared ${money(byBiz.shared)}. Total ${money(stats.expenses)}.`;
    }
    return null;
}

function handlePeanutButterQuestion(q, stats, label) {
    if (intents.peanutButter.test(q) && !intents.groundnuts.test(q)) {
        return `You sold ${stats.peanutQty} jar${stats.peanutQty === 1 ? "" : "s"} of peanut butter during ${label}, earning ${money(stats.peanutRevenue)}.`;
    }
    return null;
}

function handleGroundnutsQuestion(q, stats, label) {
    if (intents.groundnuts.test(q) && !intents.peanutButter.test(q)) {
        return `You sold ${stats.groundnutQty} piece${stats.groundnutQty === 1 ? "" : "s"} of groundnuts during ${label}, earning ${money(stats.groundnutRevenue)}.`;
    }
    return null;
}

module.exports = {
    handleRevenueQuestion,
    handleProfitQuestion,
    handleExpenseQuestion,
    handlePeanutButterQuestion,
    handleGroundnutsQuestion
};
