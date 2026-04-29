import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { compareSync } from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { db } from './db.js';
import { requireAuth } from './auth.js';
import ingredientsRouter from './routes/ingredients.js';
import suppliersRouter  from './routes/suppliers.js';
import recipesRouter    from './routes/recipes.js';
import shrinkRouter     from './routes/shrink.js';
import squareRouter     from './routes/square.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app   = express();
const PORT  = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Request logger
app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - t}ms`));
  next();
});

// ── Auth (unprotected) ──────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const stored = process.env.APP_PASSWORD || '';
  const valid = stored.startsWith('$2')
    ? compareSync(password, stored)
    : password === stored;
  if (valid) {
    req.session.authenticated = true;
    return res.json({ data: { authenticated: true } });
  }
  res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ data: { authenticated: false } });
});

app.get('/api/me', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated });
});

// ── Protected routes ────────────────────────────────────────────────────────
app.use('/api/ingredients', requireAuth, ingredientsRouter);
app.use('/api/suppliers',   requireAuth, suppliersRouter);
app.use('/api/recipes',     requireAuth, recipesRouter);
app.use('/api/shrink',      requireAuth, shrinkRouter);
app.use('/api/square',      requireAuth, squareRouter);

app.delete('/api/reset', requireAuth, (req, res) => {
  db.transaction(() => {
    db.prepare('DELETE FROM shrink_log').run();
    db.prepare('DELETE FROM recipe_lines').run();
    db.prepare('DELETE FROM ingredients').run();
    db.prepare('DELETE FROM suppliers').run();
  })();
  res.json({ data: { cleared: true } });
});

// ── Serve frontend in production ────────────────────────────────────────────
if (isProd) {
  const dist = join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(join(dist, 'index.html')));
}

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
