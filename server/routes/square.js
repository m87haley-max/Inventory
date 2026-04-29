import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { squareClient } from '../square-client.js';

const router = Router();
const LOCATION_ID = 'LNYH65XS386CD';

router.post('/sync', async (req, res, next) => {
  const { start_date, end_date, deduct_stock = false } = req.body;
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date required' });
  }

  try {
    const startAt = new Date(start_date + 'T00:00:00Z').toISOString();
    const endAt   = new Date(end_date   + 'T23:59:59Z').toISOString();

    // 1. Paginate through all completed orders for the location
    const orders = [];
    let cursor;
    do {
      const response = await squareClient.orders.search({
        locationIds: [LOCATION_ID],
        query: {
          filter: {
            stateFilter: { states: ['COMPLETED'] },
            dateTimeFilter: { closedAt: { startAt, endAt } },
          },
        },
        ...(cursor ? { cursor } : {}),
        limit: 500,
      });
      if (response.orders) orders.push(...response.orders);
      cursor = response.cursor;
    } while (cursor);

    // 2. Aggregate qty + revenue by catalog_object_id (variation ID)
    const salesMap = {};
    for (const order of orders) {
      for (const item of (order.lineItems || [])) {
        const vid = item.catalogObjectId;
        if (!vid) continue;
        if (!salesMap[vid]) salesMap[vid] = { qty: 0, revenue: 0 };
        salesMap[vid].qty += parseInt(item.quantity || '1', 10);
        salesMap[vid].revenue += Number(item.totalMoney?.amount ?? 0) / 100;
      }
    }

    // 3. Match variation IDs to menu_items
    const menuItems = db.prepare('SELECT * FROM menu_items').all();
    const matched = [];
    for (const [varId, agg] of Object.entries(salesMap)) {
      const mi = menuItems.find(m => m.variation_id === varId);
      if (mi) matched.push({ varId, mi, qty: agg.qty, revenue: agg.revenue });
    }

    // 4 & 5. Deduct stock + save to sales_log — all in one transaction
    db.transaction(() => {
      for (const s of matched) {
        db.prepare(`
          INSERT INTO sales_log (id, item_name, variation_id, qty, revenue, date_range_start, date_range_end)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(randomUUID(), s.mi.name, s.varId, s.qty, s.revenue, start_date, end_date);

        if (deduct_stock) {
          const lines = db.prepare(
            'SELECT * FROM recipe_lines WHERE menu_item_id = ?'
          ).all(s.mi.id);
          for (const line of lines) {
            const ing = db.prepare(
              'SELECT stock FROM ingredients WHERE id = ?'
            ).get(line.ingredient_id);
            if (!ing) continue;
            const deduct = (line.stock_qty ?? line.qty) * s.qty;
            db.prepare('UPDATE ingredients SET stock = ? WHERE id = ?')
              .run(Math.max(0, ing.stock - deduct), line.ingredient_id);
          }
        }
      }
    })();

    // 6. Return results
    res.json({
      data: {
        sales: matched.map(s => ({ itemName: s.mi.name, qty: s.qty, revenue: s.revenue })),
        orders_processed: orders.length,
      },
    });
  } catch (err) {
    console.error('Square sync error:', err);
    next(err);
  }
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
