const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = 3002;
const ADMIN_PASSWORD = 'Netherne42';

const db = createClient({
  url: 'libsql://aminn-mikefeufh.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODE1NDE1MDcsImlkIjoiMDE5ZWNjMjYtMDMwMS03ZDRkLTk5MGUtOGNkNWNhYWJiMGVmIiwicmlkIjoiZGYxY2JiMjktMTRlMy00MWE2LTk1ZjEtM2JmZGE5NzAwMmRiIn0.MzQqjVgJtJo4MgMw1UCZxPBZZD0GMVxVnAgGNQzrgCq51KsjZouMPSGqqoeaKp5ad1DC2k_1lgTaEiCVZwDYAg',
});

const sessions = new Set();

app.use(cors());
app.use(express.json());

const BUGTRACKER_DIR = path.join(__dirname, '..');

async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bugs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      steps TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Anonymous',
      rating INTEGER,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  console.log('Database tables ready');
}

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

app.post('/api/logout', auth, (req, res) => {
  const token = req.headers.authorization;
  sessions.delete(token);
  res.json({ success: true });
});

app.post('/api/bugs', async (req, res) => {
  const { type, name, description, steps } = req.body;
  if (!type || !name || !description || !steps) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  try {
    await db.execute({
      sql: 'INSERT INTO bugs (id, type, name, description, steps, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, type, name, description, steps, createdAt],
    });
    res.json({ success: true, bug: { id, type, name, description, steps, createdAt } });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { name, rating, message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  const feedbackName = name || 'Anonymous';
  try {
    await db.execute({
      sql: 'INSERT INTO feedback (id, name, rating, message, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [id, feedbackName, rating || null, message, createdAt],
    });
    res.json({ success: true, feedback: { id, name: feedbackName, rating: rating || null, message, createdAt } });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.get('/api/admin/bugs', auth, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM bugs ORDER BY created_at DESC');
    const bugs = result.rows.map(r => ({
      id: r.id,
      type: r.type,
      name: r.name,
      description: r.description,
      steps: r.steps,
      createdAt: r.created_at,
    }));
    res.json({ success: true, bugs });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.get('/api/admin/feedback', auth, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM feedback ORDER BY created_at DESC');
    const feedbacks = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      message: r.message,
      createdAt: r.created_at,
    }));
    res.json({ success: true, feedback: feedbacks });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.delete('/api/admin/bugs/:id', auth, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM bugs WHERE id = ?',
      args: [req.params.id],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.delete('/api/admin/feedback/:id', auth, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM feedback WHERE id = ?',
      args: [req.params.id],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.use(express.static(BUGTRACKER_DIR));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/server/')) return;
  res.sendFile(path.join(BUGTRACKER_DIR, 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`PitchView Bug Tracker running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
