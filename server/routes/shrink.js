import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';

const router = Router();

const JOIN = `SELECT sl.*, i.name as ingredient_name
  FROM shrink_log sl LEFT JOIN ingredients i ON sl.ingredient_id = i.id`;

function toClient(row) {
  return {
    id: row.id,
    date: row.date,
    ingredientId: row.ingredient_id,
    ingredientName: row.ingredient_name ?? null,
    qty: row.qty,
    reason: row.reason,
    cost: row.cost,
  };
}

router.get('/', (req, res) => {
  const rows = db.prepare(`${JOIN} ORDER BY sl.created_at DESC`).all();
  res.json({ data: rows.map(toClient) });
});

router.post('/', (req, res) => {
  const { date, ingredientId, qty, reason } = req.body;
  if (!date || qty === undefined) return res.status(400).json({ error: 'date and qty required' });
  const ingredient = ingredientId
    ? db.prepare('SELECT cost FROM ingredients WHERE id = ?').get(ingredientId)
    : null;
  const cost = ingredient ? ingredient.cost * Number(qty) : 0;
  const id = randomUUID();
  db.prepare('INSERT INTO shrink_log (id, date, ingredient_id, qty, reason, cost) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, date, ingredientId ?? null, qty, reason ?? null, cost);
  const row = db.prepare(`${JOIN} WHERE sl.id = ?`).get(id);
  res.status(201).json({ data: toClient(row) });
});

export default router;
