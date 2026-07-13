const { money } = require('./utils');
const intents = require('./intents');

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

function handleInsightQuestion(q, stats) {
    // Business Insights
    if (intents.insights.test(q)) {
        return getBusinessInsights(stats);
    }

    // Business summary
    if (intents.business.test(q)) {
        return getBusinessSummary(stats);
    }

    return null;
}

module.exports = {
    getBusinessSummary,
    getBusinessInsights,
    handleInsightQuestion
};
