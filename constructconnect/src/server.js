import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_constructconnect_please_change';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// In-memory data store (demo only)
const users = [
  // Seeded manager
  {
    id: 'u-1',
    firstName: 'Alex',
    lastName: 'Builder',
    email: 'manager@constructconnect.com',
    phone: '+1-555-1000',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'manager',
    notifications: [
      { id: 'n1', message: '3 invoices awaiting review', createdAt: new Date() },
      { id: 'n2', message: 'Schedule updated for Project A', createdAt: new Date() }
    ]
  },
  // Seeded client
  {
    id: 'u-2',
    firstName: 'Casey',
    lastName: 'Owner',
    email: 'client@constructconnect.com',
    phone: '+1-555-2000',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'client',
    notifications: [
      { id: 'n3', message: 'Change Request CR-104 approved', createdAt: new Date() }
    ]
  }
];

// Demo data
const demoProjects = [
  { id: 'p1', name: 'Project A - Corporate HQ', status: 'active', budget: 1500000, used: 650000 },
  { id: 'p2', name: 'Project B - Retail Outlet', status: 'active', budget: 500000, used: 220000 },
  { id: 'p3', name: 'Project C - Warehousing', status: 'planned', budget: 800000, used: 0 },
  { id: 'p4', name: 'Project D - Renovation', status: 'completed', budget: 200000, used: 195000 }
];

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role, name: `${user.firstName} ${user.lastName}` }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password || '', user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 3600 * 1000 });
  return res.json({ role: user.role, name: `${user.firstName} ${user.lastName}` });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ id: user.id, email: user.email, role: user.role, name: `${user.firstName} ${user.lastName}` });
});

app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const exists = users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (exists) return res.status(400).json({ error: 'Email already registered' });
  const user = {
    id: `u-${users.length + 1}`,
    firstName,
    lastName,
    phone: phone || '',
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'client', // default new accounts to client
    notifications: []
  };
  users.push(user);
  const token = signToken(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 3600 * 1000 });
  return res.json({ role: user.role, name: `${user.firstName} ${user.lastName}` });
});

app.post('/api/auth/forgot', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  // In real app, send email; here, pretend success even if not found to avoid disclosure.
  return res.json({ ok: true, message: user ? 'Recovery email sent' : 'If the email exists, recovery link was sent' });
});

// Dashboard data
app.get('/api/dashboard/metrics', authMiddleware, (req, res) => {
  // For demo, same metrics for all users; could filter by role or project membership.
  const totalProjects = demoProjects.length;
  const activeProjects = demoProjects.filter(p => p.status === 'active').length;
  const totalBudget = demoProjects.reduce((sum, p) => sum + p.budget, 0);
  const budgetUsed = demoProjects.reduce((sum, p) => sum + p.used, 0);
  return res.json({ totalProjects, activeProjects, totalBudget, budgetUsed });
});

app.get('/api/dashboard/recent-projects', authMiddleware, (req, res) => {
  const recent = demoProjects
    .filter(p => p.status === 'active' || p.status === 'planned')
    .slice(0, 5)
    .map(p => ({ id: p.id, name: p.name, status: p.status }));
  return res.json({ projects: recent });
});

app.get('/api/notifications', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  return res.json({ notifications: user?.notifications || [] });
});

// Fallback routes to serve dashboards safely
app.get('/manager', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'manager.html'));
});
app.get('/client', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'client.html'));
});

app.listen(PORT, () => {
  console.log(`ConstructConnect server running on http://localhost:${PORT}`);
});

