# Groundnut & Peanut Butter Ledger — hosted version

This version is built to run on the internet, not on your laptop. You and
your mom each get a login, and both can add/edit/delete from anywhere —
no shared WiFi required.

Tested and verified working: registration, login, sales, debts (add/mark
paid/delete), expenses, and the built-in chatbot all confirmed end-to-end
before this was handed to you.

## What's inside
- `server.js` — the Express API (auth, sales, debts, expenses, chatbot)
- `db.js` — Postgres connection + table setup (runs automatically on first start)
- `auth.js` — login/session handling (JWT)
- `chatbot.js` — answers questions using only your real data, no paid API needed
- `public/index.html` — the app itself (login screen + dashboard/sales/debts/expenses/reports)

## Deploying it (Railway — free tier works for this)

1. Go to https://railway.app and sign up (GitHub login is easiest).
2. Push this folder to a GitHub repo:
   ```
   cd groundnut-ledger-hosted
   git init
   git add .
   git commit -m "Groundnut ledger"
   git branch -M main
   git remote add origin https://github.com/<your-username>/groundnut-ledger.git
   git push -u origin main
   ```
3. In Railway: **New Project → Deploy from GitHub repo** → pick this repo.
4. Still in Railway, click **+ New → Database → PostgreSQL** in the same
   project. Railway creates it and gives it a `DATABASE_URL`.
5. Click on your web service → **Variables** tab → add:
   - `DATABASE_URL` — click "Add Reference" and pick the Postgres
     service's `DATABASE_URL` (Railway links them automatically)
   - `JWT_SECRET` — type any long random string yourself, e.g. a
     mashed-together sentence. This signs login sessions — keep it secret
     and don't change it later or everyone gets logged out.
6. Railway will build and deploy automatically. Once it's live, click the
   generated `*.up.railway.app` link — that's your permanent web address.
7. Share that link with your mom. She creates her own account from the
   same "Create account" screen the first time she opens it.

That's it — no laptop needs to stay on, no shared WiFi needed. Both of you
can add sales, mark debts paid, log expenses, and ask the chatbot from
anywhere with internet.

## About the chatbot

It answers using only the real numbers in your database — no invented
figures, and no external AI API key required, so there's nothing extra to
pay for. It understands questions like:
- "How much profit this month?"
- "Who owes me money?"
- "How much did I sell today?"
- "How much did I spend on expenses this month?"

It's rule-based rather than a full free-form AI conversation, so it works
best with plain, direct questions like the ones above rather than open-
ended chat.

## Notes

- Passwords are hashed (never stored in plain text) using bcrypt.
- Both accounts see and can edit the exact same shared data — there's no
  separation between "your" data and "your mom's" data, since it's one
  shared ledger.
- If you ever want to reset the selling prices (e.g. groundnuts go up in
  price), use the gear icon in the app — no need to touch the database.
- Local testing: if you want to run this on your own machine first, install
  Postgres locally, set `DATABASE_URL` and `JWT_SECRET` as environment
  variables, then run `npm install && npm start`.
