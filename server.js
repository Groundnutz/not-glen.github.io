const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, initSchema } = require('./db');
const { signToken, requireAuth } = require('./auth');
const { answerQuestion } = require('./chatbot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- AUTH ---------- */

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) return res.status(400).json({ error: 'Name, email, and password are all required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with that email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase().trim(), name.trim(), hash]
    );
    const user = result.rows[0];
    res.json({ token: signToken(user), user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create account' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Incorrect email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password' });

    res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not log in' });
  }
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/* ---------- SETTINGS ---------- */

app.get('/api/settings', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT price_groundnut, price_pb FROM settings WHERE id = 1');
  res.json(result.rows[0]);
});

app.put('/api/settings', requireAuth, async (req, res) => {
  const { price_groundnut, price_pb } = req.body || {};
  await pool.query('UPDATE settings SET price_groundnut = $1, price_pb = $2 WHERE id = 1', [price_groundnut, price_pb]);
  res.json({ ok: true });
});

/* ---------- SALES ---------- */

app.get('/api/sales', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM sales ORDER BY sale_date DESC, id DESC');
  res.json(result.rows);
});

app.post('/api/sales', requireAuth, async (req, res) => {
  const { sale_date, product, qty, unit_price } = req.body || {};
  if (!sale_date || !product || !qty || !unit_price) return res.status(400).json({ error: 'Missing fields' });
  const result = await pool.query(
    'INSERT INTO sales (sale_date, product, qty, unit_price, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [sale_date, product, qty, unit_price, req.user.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/sales/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM sales WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- DEBTS ---------- */

app.get('/api/debts', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM debts ORDER BY debt_date DESC, id DESC');
  res.json(result.rows);
});

app.post('/api/debts', requireAuth, async (req, res) => {
  const { name, product, qty, amount, debt_date } = req.body || {};
  if (!name || !product || !amount || !debt_date) return res.status(400).json({ error: 'Missing fields' });
  const result = await pool.query(
    'INSERT INTO debts (name, product, qty, amount, debt_date, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, product, qty || 0, amount, debt_date, req.user.id]
  );
  res.json(result.rows[0]);
});

app.patch('/api/debts/:id/pay', requireAuth, async (req, res) => {
  const result = await pool.query(
    "UPDATE debts SET paid = true, paid_date = CURRENT_DATE WHERE id = $1 RETURNING *",
    [req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/debts/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM debts WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- EXPENSES ---------- */

app.get('/api/expenses', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC');
  res.json(result.rows);
});

app.post('/api/expenses', requireAuth, async (req, res) => {
  const { business, category, description, amount, expense_date } = req.body || {};
  if (!business || !category || !amount || !expense_date) return res.status(400).json({ error: 'Missing fields' });
  const result = await pool.query(
    'INSERT INTO expenses (business, category, description, amount, expense_date, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [business, category, description || '', amount, expense_date, req.user.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- CHATBOT ---------- */

app.post('/api/chatbot', requireAuth, async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: 'No question provided' });
    const [sales, debts, expenses] = await Promise.all([
      pool.query('SELECT * FROM sales'),
      pool.query('SELECT * FROM debts'),
      pool.query('SELECT * FROM expenses')
    ]);
    const answer = answerQuestion(question, {
      sales: sales.rows,
      debts: debts.rows,
      expenses: expenses.rows
    });
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not answer that right now' });
  }
});

/* ---------- START ---------- */

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log('Groundnut Ledger server running on port ' + PORT);
    });
  })
  .catch((e) => {
    console.error('Failed to initialize database schema:', e);
    process.exit(1);
  });
