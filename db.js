const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable. See README for setup.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  price_groundnut NUMERIC NOT NULL DEFAULT 100,
  price_pb NUMERIC NOT NULL DEFAULT 600
);

INSERT INTO settings (id, price_groundnut, price_pb)
  VALUES (1, 100, 600)
  ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  sale_date DATE NOT NULL,
  product TEXT NOT NULL CHECK (product IN ('groundnuts','peanutbutter')),
  qty NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

CREATE TABLE IF NOT EXISTS debts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  product TEXT NOT NULL CHECK (product IN ('groundnuts','peanutbutter')),
  qty NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL,
  debt_date DATE NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debts_paid ON debts(paid);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  business TEXT NOT NULL CHECK (business IN ('groundnuts','peanutbutter','shared')),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
`;

async function initSchema() {
  await pool.query(SCHEMA);
  console.log('Database schema ready.');
}

module.exports = { pool, initSchema };
