import bcrypt from 'bcryptjs';
const { hashSync, compareSync } = bcrypt;
import { Router } from 'express';

// Hash the plaintext APP_PASSWORD once at startup so compare is always bcrypt
const passwordHash = hashSync(process.env.APP_PASSWORD || '', 10);

export function requireAuth(req, res, next) {
  if (req.session?.authenticated) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

const router = Router();

router.post('/login', (req, res) => {
  if (compareSync(req.body.password ?? '', passwordHash)) {
    req.session.authenticated = true;
    return res.json({ data: { authenticated: true } });
  }
  res.status(401).json({ error: 'Invalid password' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {});
  res.json({ data: { authenticated: false } });
});

router.get('/me', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated });
});

export default router;
