import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';

const router = Router();

function fetchAll() {
  const items = db.prepare('SELECT * FROM menu_items ORDER BY name').all();
  const lines = db.prepare('SELECT * FROM recipe_lines').all();
  return items.map(item => ({
    id: item.id,
    name: item.name,
    squareId: item.square_item_id,
    variationId: item.variation_id,
    price: item.price,
    recipe: lines
      .filter(l => l.menu_item_id === item.id)
      .map(l => ({ id: l.ingredient_id, qty: l.qty, recipeUnit: l.recipe_unit, stockQty: l.stock_qty })),
  }));
}

const insItem = () => db.prepare(
  'INSERT INTO menu_items (id, name, square_item_id, variation_id, price) VALUES (?, ?, ?, ?, ?)'
);
const insLine = () => db.prepare(
  'INSERT INTO recipe_lines (id, menu_item_id, ingredient_id, qty, recipe_unit, stock_qty) VALUES (?, ?, ?, ?, ?, ?)'
);

router.get('/', (req, res) => {
  res.json({ data: fetchAll() });
});

router.post('/', (req, res) => {
  const { name, squareId, variationId, price = 0, recipe = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = randomUUID();
  db.transaction(() => {
    insItem().run(id, name, squareId ?? null, variationId ?? null, price);
    for (const l of recipe) {
      insLine().run(randomUUID(), id, l.id ?? l.ingredient_id, l.qty,
        l.recipeUnit ?? l.recipe_unit ?? null, l.stockQty ?? l.stock_qty ?? null);
    }
  })();
  res.status(201).json({ data: fetchAll().find(r => r.id === id) });
});

router.put('/:id', (req, res) => {
  const { name, squareId, variationId, price = 0, recipe = [] } = req.body;
  if (!db.prepare('SELECT id FROM menu_items WHERE id = ?').get(req.params.id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  db.transaction(() => {
    db.prepare('UPDATE menu_items SET name=?, square_item_id=?, variation_id=?, price=? WHERE id=?')
      .run(name, squareId ?? null, variationId ?? null, price, req.params.id);
    db.prepare('DELETE FROM recipe_lines WHERE menu_item_id = ?').run(req.params.id);
    for (const l of recipe) {
      insLine().run(randomUUID(), req.params.id, l.id ?? l.ingredient_id, l.qty,
        l.recipeUnit ?? l.recipe_unit ?? null, l.stockQty ?? l.stock_qty ?? null);
    }
  })();
  res.json({ data: fetchAll().find(r => r.id === req.params.id) });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { deleted: true } });
});

export default router;
