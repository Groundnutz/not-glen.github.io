// Regular expression patterns for intent detection
// Centralized to avoid duplication and make updates easier

module.exports = {
    // Customer-related intents
    customer: /owe|debt|customer|tell me about|summary|who is/i,
    
    // Debt-related intents
    debt: /who (owes|owe)|outstanding debt|debtors|unpaid/i,
    
    // Revenue-related intents
    revenue: /revenue|sales|sold|made|earn|income/i,
    
    // Profit-related intents
    profit: /profit/i,
    
    // Expense-related intents
    expenses: /expense|spend|spent|cost/i,
    
    // Peanut butter specific
    peanutButter: /peanut butter|jars?/i,
    
    // Groundnuts specific
    groundnuts: /groundnut/i,
    
    // Trends and comparison intents
    trends: /compare|comparison|improving|growth|decline|better than last month|compare this month|last month/i,
    
    // Business insights and summary intents
    insights: /focus|improve|insight|insights|what should i do|what next|business advice|help my business|strategy|priority/i,
    
    // Business overview/summary intents
    business: /business|summary|overview|performance|status|health|analysis|analyze|recommend|recommendation|advice|how am i doing|how is my business|how are things going/i,
    
    // Date range detection
    today: /\btoday\b/i,
    lastWeek: /\blast week\b/i,
    thisWeek: /\bthis week\b|\bweek\b/i,
    lastMonth: /\blast month\b/i,
    thisMonth: /\bthis month\b|\bmonth\b/i
};
