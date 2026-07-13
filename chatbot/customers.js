const { money } = require('./utils');
const intents = require('./intents');

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

function handleCustomerQuestion(q, customerDebts) {
    // Detect customer mentioned in the question
    const customer = customerDebts.find(c => {
        const customerName = c.name.trim().toLowerCase();
        return q.includes(customerName);
    });

    // Note: findCustomer() is used for exact name lookups elsewhere
    // This function needs to discover which customer is mentioned in the question

    if (
        customer &&
        (
            q.includes("about") ||
            q.includes("owe") ||
            q.includes("debt") ||
            q.includes("customer") ||
            q.includes("summary") ||
            q.includes("who is")
        )
    ) {
        const items = [];

        if (customer.peanutButter > 0) {
            items.push(`🥜 Peanut Butter ×${customer.peanutButter}`);
        }

        if (customer.groundnuts > 0) {
            items.push(`🌰 Groundnuts ×${customer.groundnuts}`);
        }

        const totalItems = items.length;

        return `
👤 CUSTOMER SUMMARY

Customer:
${customer.name}

Outstanding Debt:
${money(customer.totalDebt)}

Outstanding Items

${items.join("\n")}

Total Outstanding Items:
${totalItems}
`.trim();
    }

    return null;
}

function handleDebtQuestion(q, customerDebts, outstanding) {
    if (intents.debt.test(q)) {
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

    return null;
}

module.exports = {
    groupDebtorsByCustomer,
    findCustomer,
    handleCustomerQuestion,
    handleDebtQuestion
};
