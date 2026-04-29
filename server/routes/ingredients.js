import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';

const router = Router();

const JOIN = `SELECT i.*, s.name as supplier_name
  FROM ingredients i LEFT JOIN suppliers s ON i.supplier_id = s.id`;

function toClient(row) {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    stock: row.stock,
    par: row.par,
    cost: row.cost,
    category: row.category,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name ?? null,
    shrinkPct: row.shrink_pct,
    orderUnit: row.order_unit,
    caseCost: row.case_cost,
    minOrderQty: row.min_order_qty,
    trackingUnit: row.tracking_unit,
    caseQty: row.case_qty,
  };
}

router.get('/', (req, res) => {
  const rows = db.prepare(`${JOIN} ORDER BY i.name`).all();
  res.json({ data: rows.map(toClient) });
});

router.post('/', (req, res) => {
  const {
    name, unit, stock = 0, par = 0, cost = 0, category,
    supplierId, shrinkPct = 5, orderUnit, caseCost = 0,
    minOrderQty = 1, trackingUnit, caseQty = 1,
  } = req.body;
  if (!name || !unit) return res.status(400).json({ error: 'name and unit required' });
  const id = randomUUID();
  db.prepare(`INSERT INTO ingredients
    (id, name, unit, stock, par, cost, category, supplier_id, shrink_pct, order_unit, case_cost, min_order_qty, tracking_unit, case_qty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, unit, stock, par, cost, category ?? null, supplierId ?? null,
    shrinkPct, orderUnit ?? null, caseCost, minOrderQty, trackingUnit ?? null, caseQty);
  const row = db.prepare(`${JOIN} WHERE i.id = ?`).get(id);
  res.status(201).json({ data: toClient(row) });
});

router.put('/:id', (req, res) => {
  const {
    name, unit, stock = 0, par = 0, cost = 0, category,
    supplierId, shrinkPct = 5, orderUnit, caseCost = 0,
    minOrderQty = 1, trackingUnit, caseQty = 1,
  } = req.body;
  if (!db.prepare('SELECT id FROM ingredients WHERE id = ?').get(req.params.id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  db.prepare(`UPDATE ingredients SET name=?, unit=?, stock=?, par=?, cost=?, category=?,
    supplier_id=?, shrink_pct=?, order_unit=?, case_cost=?, min_order_qty=?, tracking_unit=?, case_qty=?
    WHERE id=?`
  ).run(name, unit, stock, par, cost, category ?? null, supplierId ?? null,
    shrinkPct, orderUnit ?? null, caseCost, minOrderQty, trackingUnit ?? null, caseQty, req.params.id);
  const row = db.prepare(`${JOIN} WHERE i.id = ?`).get(req.params.id);
  res.json({ data: toClient(row) });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM ingredients WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { deleted: true } });
});

router.patch('/:id/stock', (req, res) => {
  const { delta } = req.body;
  if (delta === undefined) return res.status(400).json({ error: 'delta required' });
  const row = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  // If stock is 0, treat delta as absolute set; otherwise adjust
  const newStock = row.stock === 0
    ? Math.max(0, Number(delta))
    : Math.max(0, row.stock + Number(delta));
  db.prepare('UPDATE ingredients SET stock = ? WHERE id = ?').run(newStock, req.params.id);
  const updated = db.prepare(`${JOIN} WHERE i.id = ?`).get(req.params.id);
  res.json({ data: toClient(updated) });
});

export default router;
