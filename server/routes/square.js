import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { getSquareClient } from '../square.js';

const router = Router();
const LOCATION_ID = 'LNYH65XS386CD';

router.post('/sync', async (req, res) => {
  const { start_date, end_date, deduct_stock = false } = req.body;
  if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date required' });

  const client = getSquareClient();
  try {
    const startAt = new Date(start_date + 'T00:00:00Z').toISOString();
    const endAt   = new Date(end_date   + 'T23:59:59Z').toISOString();

    // Paginate through all completed orders
    const orders = [];
    let cursor;
    do {
      const { result } = await client.ordersApi.searchOrders({
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
      if (result.orders) orders.push(...result.orders);
      cursor = result.cursor;
    } while (cursor);

    // Aggregate qty + revenue by variation_id (catalogObjectId on line items)
    const salesMap = {};
    for (const order of orders) {
      for (const item of (order.lineItems || [])) {
        const vid = item.catalogObjectId;
        if (!vid) continue;
        if (!salesMap[vid]) salesMap[vid] = { qty: 0, revenue: 0 };
        salesMap[vid].qty += parseInt(item.quantity || '1', 10);
        const cents = item.totalMoney?.amount ?? 0;
        salesMap[vid].revenue += Number(cents) / 100;
      }
    }

    // Match variation IDs to menu items
    const menuItems = db.prepare('SELECT * FROM menu_items').all();
    const matched = [];
    for (const [varId, agg] of Object.entries(salesMap)) {
      const mi = menuItems.find(m => m.variation_id === varId);
      if (mi) matched.push({ varId, mi, ...agg });
    }

    // Write sales log + optionally deduct stock — all in one transaction
    db.transaction(() => {
      for (const s of matched) {
        db.prepare(`INSERT INTO sales_log (id, item_name, variation_id, qty, revenue, date_range_start, date_range_end)
          VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(randomUUID(), s.mi.name, s.varId, s.qty, s.revenue, start_date, end_date);

        if (deduct_stock) {
          const lines = db.prepare('SELECT * FROM recipe_lines WHERE menu_item_id = ?').all(s.mi.id);
          for (const line of lines) {
            const ing = db.prepare('SELECT stock FROM ingredients WHERE id = ?').get(line.ingredient_id);
            if (!ing) continue;
            const deduct = (line.stock_qty ?? line.qty) * s.qty;
            db.prepare('UPDATE ingredients SET stock = ? WHERE id = ?')
              .run(Math.max(0, ing.stock - deduct), line.ingredient_id);
          }
        }
      }
    })();

    res.json({
      data: {
        sales: matched.map(s => ({ itemName: s.mi.name, qty: s.qty, revenue: s.revenue })),
        orders_processed: orders.length,
      },
    });
  } catch (err) {
    console.error('Square sync error:', err);
    res.status(500).json({ error: err.message || 'Square sync failed' });
  }
});

router.get('/sync/latest', (req, res) => {
  const rows = db.prepare('SELECT * FROM sales_log ORDER BY synced_at DESC LIMIT 50').all();
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
