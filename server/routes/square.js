import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { squareClient } from '../square-client.js';

const router = Router();
const LOCATION_ID = 'LNYH65XS386CD';

// Prepared statements hoisted so they are compiled once, not per-request
const insertSale = db.prepare(`
  INSERT INTO sales_log (id, item_name, variation_id, qty, revenue, date_range_start, date_range_end)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const getRecipeLines  = db.prepare('SELECT * FROM recipe_lines WHERE menu_item_id = ?');
const getIngStock     = db.prepare('SELECT stock FROM ingredients WHERE id = ?');
const updateIngStock  = db.prepare('UPDATE ingredients SET stock = ? WHERE id = ?');

router.post('/sync', async (req, res) => {
  const { start_date, end_date, deduct_stock = false } = req.body;
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date required' });
  }

  // ── 1. Fetch all completed orders from Square (paginated) ─────────────────
  let orders = [];
  try {
    const startAt = new Date(start_date).toISOString();
    const endAt   = new Date(end_date + 'T23:59:59Z').toISOString();
    let cursor;
    do {
      // v42 SDK: squareClient.orders.search() is the equivalent of
      // v37's squareClient.ordersApi.searchOrders(). Response is returned
      // directly (no .result wrapper). Keys are camelCase.
      const response = await squareClient.orders.search({
        locationIds: [LOCATION_ID],
        query: {
          filter: {
            stateFilter: { states: ['COMPLETED'] },
            dateTimeFilter: { closedAt: { startAt, endAt } },
          },
          sort: { sortField: 'CLOSED_AT' },
        },
        ...(cursor ? { cursor } : {}),
        limit: 500,
      });
      if (response.orders) orders.push(...response.orders);
      cursor = response.cursor;
    } while (cursor);
  } catch (err) {
    console.error('Square API error:', err);
    return res.status(502).json({
      error: err?.errors?.[0]?.detail ?? err.message ?? 'Square API request failed',
    });
  }

  // ── 2. Aggregate qty + revenue by catalog_object_id (= variation ID) ──────
  const salesMap = {};
  for (const order of orders) {
    for (const item of (order.lineItems || [])) {
      const vid = item.catalogObjectId;
      if (!vid) continue;
      if (!salesMap[vid]) salesMap[vid] = { qty: 0, revenue: 0 };
      salesMap[vid].qty     += parseInt(item.quantity || '1', 10);
      salesMap[vid].revenue += Number(item.totalMoney?.amount ?? 0) / 100;
    }
  }

  // ── 3. Match variation IDs to menu_items ──────────────────────────────────
  const menuItems = db.prepare('SELECT * FROM menu_items').all();
  const matched = [];
  for (const [varId, agg] of Object.entries(salesMap)) {
    const mi = menuItems.find(m => m.variation_id === varId);
    if (mi) matched.push({ varId, mi, qty: agg.qty, revenue: agg.revenue });
  }

  // ── 4–6. Deduct stock + persist sales — single SQLite transaction ─────────
  db.transaction(() => {
    for (const s of matched) {
      // 6. Save to sales_log
      insertSale.run(randomUUID(), s.mi.name, s.varId, s.qty, s.revenue, start_date, end_date);

      // 5. Deduct ingredient stock if requested
      if (deduct_stock) {
        for (const line of getRecipeLines.all(s.mi.id)) {
          const ing = getIngStock.get(line.ingredient_id);
          if (!ing) continue;
          const deduct = (line.stock_qty ?? line.qty) * s.qty;
          updateIngStock.run(Math.max(0, ing.stock - deduct), line.ingredient_id);
        }
      }
    }
  })();

  // ── 7. Return aggregated results ──────────────────────────────────────────
  res.json({
    data: {
      sales: matched.map(s => ({ itemName: s.mi.name, qty: s.qty, revenue: s.revenue })),
      orders_processed: orders.length,
    },
  });
});

router.get('/sync/latest', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM sales_log ORDER BY synced_at DESC LIMIT 50'
  ).all();
  res.json({
    data: rows.map(r => ({
      id: r.id,
      itemName: r.item_name,
      variationId: r.variation_id,
      qty: r.qty,
      revenue: r.revenue,
      dateRangeStart: r.date_range_start,
      dateRangeEnd: r.date_range_end,
      syncedAt: r.synced_at,
    })),
  });
});

export default router;
