# Chatbot Module Documentation

This directory contains the modular chatbot system for the Groundnut Ledger application. Each module has a specific responsibility to maintain clean architecture and separation of concerns.

## Module Overview

### utils.js
**Purpose:** Utility and helper functions used across the chatbot system.

**Functions:**
- `money(n)` - Formats numbers as Kenyan Shillings (KSh)
- `startOfRange(range)` - Returns the start date for a given time range
- `endOfRange(range)` - Returns the end date for a given time range
- `detectRange(q)` - Detects time range from user question (today, week, month, etc.)
- `rangeLabel(range)` - Returns human-readable label for time range
- `filterByDate(rows, dateField, range)` - Filters data rows by date range

**Dependencies:** `intents.js`

### intents.js
**Purpose:** Centralized regular expression patterns for intent detection.

**Patterns:**
- `customer` - Customer-related questions
- `debt` - Debt and outstanding payment questions
- `revenue` - Revenue and sales questions
- `profit` - Profit-related questions
- `expenses` - Expense and cost questions
- `peanutButter` - Peanut butter specific questions
- `groundnuts` - Groundnuts specific questions
- `trends` - Comparison and trend analysis questions
- `insights` - Business insight and advice questions
- `business` - Business overview and summary questions
- Date range patterns (today, week, month)

**Dependencies:** None

### finance.js
**Purpose:** Handles all finance-related question handlers.

**Functions:**
- `handleRevenueQuestion(q, stats, label)` - Handles revenue/sales questions
- `handleProfitQuestion(q, stats, label)` - Handles profit questions
- `handleExpenseQuestion(q, expenses, stats, label)` - Handles expense questions
- `handlePeanutButterQuestion(q, stats, label)` - Handles peanut butter specific questions
- `handleGroundnutsQuestion(q, stats, label)` - Handles groundnuts specific questions

**Dependencies:** `utils.js`, `intents.js`

### customers.js
**Purpose:** Manages customer-related functionality and debt tracking.

**Functions:**
- `groupDebtorsByCustomer(debts)` - Groups unpaid debts by customer
- `findCustomer(name, customerDebts)` - Finds a specific customer by name
- `handleCustomerQuestion(q, customerDebts)` - Handles customer-specific questions
- `handleDebtQuestion(q, customerDebts, outstanding)` - Handles general debt questions

**Dependencies:** `utils.js`, `intents.js`

### insights.js
**Purpose:** Provides business insights and summary reports.

**Functions:**
- `getBusinessSummary(stats)` - Generates comprehensive business summary
- `getBusinessInsights(stats)` - Generates business insights and recommendations
- `handleInsightQuestion(q, stats)` - Routes insight-related questions

**Dependencies:** `utils.js`, `intents.js`

### trends.js
**Purpose:** Handles trend analysis and time-based comparisons.

**Functions:**
- `compareMonthlyPerformance(data)` - Compares current month vs last month
- `handleTrendQuestion(q, data)` - Routes trend-related questions

**Dependencies:** `utils.js`, `intents.js`

### analytics.js
**Purpose:** Advanced analytics and business intelligence (placeholder).

**Future Features:**
- Top customers analysis
- Product trends
- Revenue trends
- Expense trends
- Profit trends
- Weekly summaries

**Dependencies:** None (placeholder)

### stock.js
**Purpose:** Inventory and stock management insights (placeholder).

**Future Features:**
- Low stock alerts
- Restock advice
- Supplier analysis
- Cheapest buying period
- Stock turnover

**Dependencies:** None (placeholder)

### index.js
**Purpose:** Main chatbot entry point that orchestrates all modules.

**Functions:**
- `answerQuestion(question, data)` - Main entry point for processing questions

**Flow:**
1. Detects time range from question
2. Computes shared statistics once (revenue, expenses, profit, debts)
3. Calls handlers in order: Customer → Insights → Trends → Finance
4. Returns first matching response or fallback

**Dependencies:** `utils.js`, `customers.js`, `insights.js`, `trends.js`, `finance.js`

## Architecture Principles

1. **Separation of Concerns:** Each module has a single, well-defined responsibility
2. **No Circular Dependencies:** Dependency flow is unidirectional
3. **Centralized Intents:** All regex patterns are in `intents.js` for easy maintenance
4. **Consistent Returns:** Handler functions return `null` when they don't handle a question
5. **Preserved Behavior:** All refactoring maintains exact original functionality

## Usage

The chatbot is used by the main server via:

```javascript
const { answerQuestion } = require('./chatbot/index');
const response = answerQuestion(question, { sales, debts, expenses });
```

## Future Development

When adding new features:
1. Create appropriate handler functions in existing modules
2. Add new intent patterns to `intents.js` if needed
3. Implement placeholder modules (`analytics.js`, `stock.js`) when ready
4. Update this README with new functionality
5. Maintain the established architecture patterns
