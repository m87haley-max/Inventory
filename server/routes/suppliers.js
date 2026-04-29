import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ data: db.prepare('SELECT * FROM suppliers ORDER BY name').all() });
});

router.post('/', (req, res) => {
  const { name, contact, phone, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = randomUUID();
  db.prepare('INSERT INTO suppliers (id, name, contact, phone, notes) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, contact ?? null, phone ?? null, notes ?? null);
  res.status(201).json({ data: db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) });
});

router.put('/:id', (req, res) => {
  const { name, contact, phone, notes } = req.body;
  if (!db.prepare('SELECT id FROM suppliers WHERE id = ?').get(req.params.id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  db.prepare('UPDATE suppliers SET name=?, contact=?, phone=?, notes=? WHERE id=?')
    .run(name, contact ?? null, phone ?? null, notes ?? null, req.params.id);
  res.json({ data: db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { deleted: true } });
});

export default router;
