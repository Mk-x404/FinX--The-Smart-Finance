import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_KEY_HERE') {
  console.warn('WARNING: GEMINI_API_KEY is not set or is using placeholder. AI Advisor will be disabled.');
}

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('finsight.db');
db.pragma('journal_mode = WAL');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    monthly_budget REAL DEFAULT 50000,
    savings_goal REAL DEFAULT 10000
  );

  INSERT OR IGNORE INTO settings (id, monthly_budget, savings_goal) VALUES (1, 50000, 10000);

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    vendor_name TEXT NOT NULL,
    amount REAL NOT NULL,
    item TEXT,
    taken_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS income (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS savings (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

  app.use(express.json());

  // --- API Routes ---

  app.get('/api/settings', (_req, res) => {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(settings);
  });

  app.post('/api/settings', (req, res) => {
    const { monthly_budget, savings_goal } = req.body;
    db.prepare('UPDATE settings SET monthly_budget = ?, savings_goal = ? WHERE id = 1')
      .run(monthly_budget, savings_goal);
    res.json({ success: true });
  });

  app.get('/api/expenses', (_req, res) => {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
    res.json(expenses);
  });

  app.post('/api/expenses', (req, res) => {
    const { amount, category, date, note } = req.body;
    
    // Strict Budget Check
    const settings = db.prepare('SELECT monthly_budget FROM settings WHERE id = 1').get() as any;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const expenses = db.prepare('SELECT amount FROM expenses WHERE date LIKE ?').all(`${currentMonth}%`) as any[];
    const currentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    if (currentTotal + amount > settings.monthly_budget) {
      return res.status(403).json({ 
        error: `Budget Exceeded! Your current total (PKR ${currentTotal.toLocaleString()}) plus this expense would exceed your monthly limit of PKR ${settings.monthly_budget.toLocaleString()}.` 
      });
    }

    const id = crypto.randomUUID();
    db.prepare('INSERT INTO expenses (id, amount, category, date, note) VALUES (?, ?, ?, ?, ?)')
      .run(id, amount, category, date, note);
    res.status(201).json({ id, success: true });
  });

  app.delete('/api/expenses/:id', (req, res) => {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/loans', (_req, res) => {
    const rows = db.prepare('SELECT * FROM loans ORDER BY due_date ASC').all() as any[];
    const loans = rows.map(r => ({
      id: r.id,
      vendorName: r.vendor_name,
      amount: r.amount,
      item: r.item,
      takenDate: r.taken_date,
      dueDate: r.due_date,
      status: r.status
    }));
    res.json(loans);
  });

  app.post('/api/loans', (req, res) => {
    const { vendorName, amount, item, takenDate, dueDate } = req.body;
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO loans (id, vendor_name, amount, item, taken_date, due_date) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, vendorName, amount, item, takenDate, dueDate);
    res.status(201).json({ id, success: true });
  });

  app.post('/api/loans/:id/settle', (req, res) => {
    const loan = db.prepare('SELECT amount, vendor_name FROM loans WHERE id = ?').get(req.params.id) as any;
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const settleTransaction = db.transaction(() => {
      // 1. Mark loan as paid
      db.prepare("UPDATE loans SET status = 'paid' WHERE id = ?").run(req.params.id);
      
      // 2. Create corresponding expense entry
      const expenseId = crypto.randomUUID();
      const date = new Date().toISOString().split('T')[0];
      db.prepare('INSERT INTO expenses (id, amount, category, date, note) VALUES (?, ?, ?, ?, ?)')
        .run(expenseId, loan.amount, 'Debt Repayment', date, `Repayment to ${loan.vendor_name}`);
    });

    try {
      settleTransaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to settle loan' });
    }
  });

  app.delete('/api/loans/:id', (req, res) => {
    db.prepare('DELETE FROM loans WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/income', (_req, res) => {
    const income = db.prepare('SELECT * FROM income ORDER BY date DESC').all();
    res.json(income);
  });

  app.post('/api/income', (req, res) => {
    const { source, amount, date } = req.body;
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO income (id, source, amount, date) VALUES (?, ?, ?, ?)')
      .run(id, source, amount, date);
    res.status(201).json({ id, success: true });
  });

  app.delete('/api/income/:id', (req, res) => {
    db.prepare('DELETE FROM income WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/savings', (_req, res) => {
    const savings = db.prepare('SELECT * FROM savings ORDER BY date DESC').all();
    res.json(savings);
  });

  app.post('/api/savings', (req, res) => {
    const { amount, date, note } = req.body;
    const id = crypto.randomUUID();
    const dateStr = date || new Date().toISOString().split('T')[0];
    db.prepare('INSERT INTO savings (id, amount, date, note) VALUES (?, ?, ?, ?)')
      .run(id, amount, dateStr, note || '');
    res.status(201).json({ id, success: true });
  });

  app.delete('/api/savings/:id', (req, res) => {
    db.prepare('DELETE FROM savings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/summary', (_req, res) => {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    const expenses = db.prepare('SELECT * FROM expenses').all() as any[];
    const incomeRows = db.prepare('SELECT * FROM income').all() as any[];
    const savingsRows = db.prepare('SELECT * FROM savings').all() as any[];
    const allLoans = db.prepare('SELECT * FROM loans').all() as any[];
    const pendingLoans = allLoans.filter(l => l.status === 'pending');

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomeRows.reduce((sum, i) => sum + i.amount, 0);
    const totalSavings = savingsRows.reduce((sum, s) => sum + s.amount, 0);
    const totalLoans = pendingLoans.reduce((sum, l) => sum + l.amount, 0);

    const budgetUsedPercent = settings.monthly_budget > 0 ? (totalExpenses / settings.monthly_budget) * 100 : 0;
    const savingsProgress = settings.savings_goal > 0 ? (totalSavings / settings.savings_goal) * 100 : 0;
    
    const budgetScore = Math.max(0, 100 - budgetUsedPercent);
    const loanBurdenRatio = totalIncome > 0 ? (totalLoans / totalIncome) * 100 : (totalLoans > 0 ? 100 : 0);
    const loanScore = Math.max(0, 100 - loanBurdenRatio);
    const financialHealthScore = Math.round(budgetScore * 0.4 + savingsProgress * 0.3 + loanScore * 0.3);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - now.getDate() + 1;
    const remainingBudget = settings.monthly_budget - totalExpenses - totalSavings;
    const dailySpendLimit = remainingDays > 0 ? Math.max(0, remainingBudget / remainingDays) : 0;

    res.json({
      totalExpenses, totalIncome, totalSavings, totalLoans,
      financialHealthScore,
      budgetUsedPercent: Math.round(budgetUsedPercent),
      savingsProgress: Math.round(savingsProgress),
      dailySpendLimit: Math.round(dailySpendLimit),
      monthlyBudget: settings.monthly_budget,
      savingsGoal: settings.savings_goal,
      categoryBreakdown: [...new Set(expenses.map(e => e.category))].map(cat => ({
        category: cat,
        amount: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
      })),
      repaymentPlans: pendingLoans.map(l => {
        const diffDays = Math.ceil((new Date(l.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
          id: l.id, vendor: l.vendor_name, amount: l.amount, dueDate: l.due_date,
          dailySave: diffDays > 0 ? Math.ceil(l.amount / diffDays) : l.amount,
          daysLeft: Math.max(0, diffDays), isOverdue: diffDays <= 0
        };
      })
    });
  });

  // AI Chat Advisor
  app.post('/api/chat', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_KEY_HERE') return res.status(503).json({ error: 'AI not configured' });

    const { message } = req.body;
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    const expenses = db.prepare('SELECT * FROM expenses').all() as any[];
    const loans = db.prepare("SELECT * FROM loans WHERE status = 'pending'").all() as any[];

    // Improved prompt for structured output
    const context = `You are FinX AI, a professional financial advisor for a Pakistani user. 
    Current Month Budget: PKR ${settings.monthly_budget}
    Total Month Expenses: PKR ${expenses.reduce((s:any,e:any)=>s+e.amount,0)}
    Pending Loans: ${loans.length}
    User Message: ${message}

    Respond using **Markdown** formatting. Use bold text for numbers, bullet points for lists, and clear headers if needed. 
    Speak in a friendly mix of Urdu and English. Keep responses visually structured and easy to read.`;

    try {
      if (apiKey.startsWith('sk-or-')) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "google/gemma-2-9b-it", messages: [{ role: "user", content: context }] })
        });
        const data = await response.json() as any;
        res.json({ reply: data.choices[0].message.content });
      } else {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(context);
        res.json({ reply: (await result.response).text() });
      }
    } catch (e: any) {
      res.status(500).json({ error: 'AI Error' });
    }
  });

  // Vite / Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`✅ FinX Server running on http://localhost:${PORT}`));
}

startServer();
