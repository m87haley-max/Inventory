import { useState } from "react";
import { fc, fmtn, Card, SectionTitle, Th, Td, Btn, Input, Select, Label, FG, Modal } from "./ui.jsx";
import { UNIT_CONVERSIONS } from "./Suppliers.jsx";

function getConversion(recipeUnit, stockUnit) {
  if (!recipeUnit || !stockUnit) return 1;
  if (recipeUnit === stockUnit) return 1;
  const key = `${recipeUnit.toLowerCase()}→${stockUnit.toLowerCase()}`;
  return UNIT_CONVERSIONS[key] ?? 1; // returns 1 if unknown (user must handle manually)
}

// Common recipe units for the dropdown
const RECIPE_UNITS = ["oz","lbs","g","kg","tsp","tbsp","cup","ml","L","each","dozen","slice","portion","pinch"];

function Recipes({ menuItems, ingredients, onSave, onDelete, onAddIngredient }) {
  const blank = { name:"", squareId:"", price:"", recipe:[] };
  const blankIng = { name:"", unit:"", category:"Shellfish", cost:"", par:"", shrinkPct:"5" };
  const [modal, setModal]             = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState(blank);
  const [showSquarePanel, setShowSquarePanel] = useState(false);
  const [squareSyncing, setSquareSyncing]     = useState(false);
  const [squareResult,  setSquareResult]      = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showNewIng, setShowNewIng]   = useState(false);
  const [newIng, setNewIng]           = useState(blankIng);

  // Create a brand-new ingredient and immediately add it as a recipe line
  const createAndAddIngredient = async () => {
    if (!newIng.name || !newIng.unit) return;
    const created = await onAddIngredient({
      name:       newIng.name,
      unit:       newIng.unit,
      category:   newIng.category,
      cost:       +newIng.cost || 0,
      par:        +newIng.par  || 0,
      stock:      0,
      shrinkPct:  +newIng.shrinkPct || 5,
      supplierId: "",
    });
    setForm(f => ({
      ...f,
      recipe: [...f.recipe, { id: created.id, qty: "", recipeUnit: newIng.unit }]
    }));
    setNewIng(blankIng);
    setShowNewIng(false);
  };

  const openAdd  = () => { setForm(blank); setEditId(null); setModal(true); };
  const openEdit = (m) => {
    setForm({
      ...m,
      price: String(m.price),
      recipe: m.recipe.map(r=>({...r, qty:String(r.qty)}))
    });
    setEditId(m.id);
    setModal(true);
  };

  // Inline two-step delete — no browser confirm() dialog needed
  const deleteItem = async (id) => {
    if (confirmDeleteId === id) {
      await onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  // Pull latest Square catalog filtered to your actual menu categories
  // Menu category IDs: Menu (RBMOY7WS25XLSBHZKKUGYOKH), Food Truck Menu (34NF56X5KEN7CCBERU4BSID2),
  // Friday and Sat Menu (G7EIRO6TT77BIEHNEGFVDCEV), Brunch Menu (P5GTRRPEXVKOGRLTOG64ICOQ),
  // Brunch (WBTMW2US66WYSOCQPIGVC2ZE), Online Menu (BGWIDN6TXZBCGPSCUYSRDGL6),
  // Menu/Online submenu (J36OR3LYVPDP5PUQSR56JZFO), Holiday Kits (RBALN7BRDBVB42F5RKUSHVND)
  const MENU_CATEGORY_IDS = [
    "RBMOY7WS25XLSBHZKKUGYOKH", // Menu (kitchen)
    "34NF56X5KEN7CCBERU4BSID2", // Food Truck Menu
    "G7EIRO6TT77BIEHNEGFVDCEV", // Friday and Sat Menu
    "P5GTRRPEXVKOGRLTOG64ICOQ", // Brunch Menu
    "WBTMW2US66WYSOCQPIGVC2ZE", // Brunch
    "BGWIDN6TXZBCGPSCUYSRDGL6", // Online Menu
    "J36OR3LYVPDP5PUQSR56JZFO", // Menu (Online submenu)
    "RBALN7BRDBVB42F5RKUSHVND", // Holiday Kits
    "4CJY7N4AC3HO3BTQ33JY6WS4", // Kits
    "Y6TQPH4KJ2GUPUMH22Q3LEYB", // A-La-Carte
  ];

  const resyncFromSquare = async () => {
    setSquareSyncing(true);
    setSquareResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: `You are a Square catalog assistant for Bonfire Oyster Co.
Using the Square MCP, search for catalog items (type: ITEM) that belong to ANY of these category IDs:
${MENU_CATEGORY_IDS.join(", ")}

Use the searchObjects endpoint with object_types: ["ITEM", "ITEM_VARIATION"] and include_related_objects: true.
Only return items that have at least one of those category IDs in their categories array.
Exclude items whose names contain: sweatshirt, sweater, tee, shirt, knife, class, ticket.

Return ONLY valid JSON — no markdown, no explanation:
{ "items": [{ "id": "VARIATION_ID", "name": "Item Name", "squareId": "CATALOG_ITEM_ID", "variationId": "VARIATION_ID", "price": 0.00, "category": "Category Name" }] }

For items with multiple variations, include each variation as a separate entry.
Use the variation ID as both "id" and "variationId".
Convert price from cents to dollars (divide by 100).`,
          messages: [{ role: "user", content: "Fetch Bonfire Oyster Co menu items from Square filtered to menu categories, return as JSON." }],
          mcp_servers: [{ type: "url", url: "https://mcp.squareup.com/sse", name: "square-mcp" }],
        })
      });
      const data = await res.json();
      const text = (data.content||[]).map(b=>b.text||"").join("");
      let fetched = [];
      try {
        fetched = JSON.parse(text.replace(/```json|```/g,"").trim()).items || [];
      } catch { fetched = []; }

      // Add only items not already in the list
      const existingIds = new Set(menuItems.map(m => m.variationId || m.id));
      const newItems = fetched
        .filter(f => !existingIds.has(f.variationId) && !existingIds.has(f.id))
        .map(f => ({ ...f, recipe: [] }));

      if (newItems.length > 0) setMenuItems(p => [...p, ...newItems]);
      setSquareResult({ added: newItems.length, names: newItems.map(n=>n.name) });
    } catch(e) {
      console.error(e);
      setSquareResult({ added: 0, names: [], error: true });
    }
    setSquareSyncing(false);
  };
  const save = async () => {
    const e = {
      ...form,
      price: +form.price,
      recipe: form.recipe.map(r => {
        const ing = ingredients.find(x=>x.id===r.id);
        const conv = getConversion(r.recipeUnit, ing?.unit);
        return {
          ...r,
          qty:          +r.qty,
          recipeUnit:   r.recipeUnit || ing?.unit || "",
          stockQty:     +(+r.qty * conv).toFixed(4),
        };
      })
    };
    await onSave(e, editId);
    setModal(false);
  };

  const addLine = () => {
    const firstIng = ingredients[0];
    setForm(f=>({...f, recipe:[...f.recipe, {
      id: firstIng?.id||"",
      qty: "",
      recipeUnit: firstIng?.unit || "oz"
    }]}));
  };
  const updateLine = (idx,k,v) => setForm(f=>({...f, recipe:f.recipe.map((r,i)=>i===idx?{...r,[k]:v}:r)}));
  const removeLine = (idx) => setForm(f=>({...f, recipe:f.recipe.filter((_,i)=>i!==idx)}));

  // When ingredient changes on a line, reset recipeUnit to match the ingredient's stock unit
  const changeIngredient = (idx, ingId) => {
    const ing = ingredients.find(x=>x.id===ingId);
    setForm(f=>({...f, recipe:f.recipe.map((r,i)=>i===idx ? {...r, id:ingId, recipeUnit: ing?.unit||"oz"} : r)}));
  };

  const cost = (recipe) => recipe.reduce((sum,r)=>{
    const ing = ingredients.find(x=>x.id===r.id);
    if (!ing) return sum;
    const conv = getConversion(r.recipeUnit, ing.unit);
    return sum + (ing.cost * (+r.qty) * conv);
  }, 0);

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"var(--textMuted)" }}>{menuItems.length} items mapped</div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={()=>setShowSquarePanel(s=>!s)}>
            {showSquarePanel ? "✕ Close Square Panel" : "⬇ Re-sync from Square"}
          </Btn>
          <Btn variant="primary" onClick={openAdd}>+ Add Menu Item</Btn>
        </div>
      </div>

      {/* Square re-sync panel */}
      {showSquarePanel && (
        <Card style={{ marginBottom:20, borderColor:"var(--borderLt)" }}>
          <SectionTitle>Re-sync Menu Items from Square</SectionTitle>
          <div style={{ fontSize:12, color:"var(--textMuted)", marginBottom:16, lineHeight:1.7 }}>
            This pulls your current Square catalog and adds any items that aren't already in your recipe list.
            Existing items and their recipes are <strong style={{ color:"var(--shell)" }}>not overwritten</strong> — only new items are added.
          </div>
          {squareSyncing ? (
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"var(--teal)", padding:"8px 0" }}>
              ⟳ Fetching from Square…
            </div>
          ) : squareResult ? (
            <div>
              {squareResult.added === 0 ? (
                <div style={{ fontSize:12, color:"var(--teal)" }}>✓ All Square items are already in your recipe list.</div>
              ) : (
                <div style={{ fontSize:12, color:"var(--teal)" }}>
                  ✓ Added {squareResult.added} new item{squareResult.added>1?"s":""}: {squareResult.names.join(", ")}
                </div>
              )}
              <Btn onClick={()=>setSquareResult(null)} style={{ marginTop:12 }}>Dismiss</Btn>
            </div>
          ) : (
            <Btn variant="primary" onClick={resyncFromSquare}>Pull Latest from Square</Btn>
          )}
        </Card>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
        {menuItems.map(item => {
          const c = cost(item.recipe);
          const margin = item.price > 0 ? ((item.price-c)/item.price*100) : 0;
          const mCol = margin>65?"var(--teal)":margin>40?"var(--yellow)":"var(--red)";
          return (
            <Card key={item.id} style={{ display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:"var(--shell)", marginBottom:3 }}>{item.name}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textFaint)" }}>SQ: {item.squareId||"—"}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"var(--gold)", fontWeight:700 }}>{fc(item.price)}</div>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:mCol, fontWeight:600 }}>{fmtn(margin,0)}% margin</div>
                </div>
              </div>

              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:9, letterSpacing:"0.15em",
                textTransform:"uppercase", color:"var(--textMuted)", marginBottom:8, fontWeight:600 }}>Recipe</div>
              {item.recipe.length === 0 && (
                <div style={{ fontSize:11, color:"var(--textFaint)", fontStyle:"italic", padding:"8px 0" }}>
                  No ingredients mapped yet
                </div>
              )}
              {item.recipe.map((r,i) => {
                const ing = ingredients.find(x=>x.id===r.id);
                const conv = getConversion(r.recipeUnit, ing?.unit);
                const stockDeduct = +(+r.qty * conv).toFixed(4);
                const sameUnit = r.recipeUnit === ing?.unit;
                return (
                  <div key={i} style={{ padding:"6px 0", borderBottom:"1px solid var(--border)", fontSize:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"'Jost',sans-serif", fontWeight:500 }}>{ing?.name||"?"}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", color:"var(--emberLt)", fontWeight:600 }}>
                        {r.qty} {r.recipeUnit||ing?.unit}
                      </span>
                    </div>
                    {!sameUnit && ing && (
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textFaint)", marginTop:2 }}>
                        → deducts {stockDeduct} {ing.unit} from stock
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14, gap:8 }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"var(--textMuted)" }}>
                  Food cost: <span style={{ color:"var(--shell)" }}>{fc(c)}</span>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {confirmDeleteId === item.id ? (
                    <>
                      <span style={{ fontSize:11, color:"var(--red)", fontFamily:"'Jost',sans-serif" }}>Sure?</span>
                      <Btn small variant="danger" onClick={()=>deleteItem(item.id)}>Yes, Remove</Btn>
                      <Btn small onClick={()=>setConfirmDeleteId(null)}>Cancel</Btn>
                    </>
                  ) : (
                    <>
                      <Btn small onClick={()=>openEdit(item)}>Edit Recipe</Btn>
                      <Btn small variant="danger" onClick={()=>deleteItem(item.id)}>Remove</Btn>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Edit Menu Item":"Add Menu Item"}>
        <FG><Label>Item Name</Label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></FG>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <FG><Label>Square Item ID</Label><Input value={form.squareId} onChange={e=>setForm(f=>({...f,squareId:e.target.value}))} /></FG>
          <FG><Label>Sale Price ($)</Label><Input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} /></FG>
        </div>

        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, letterSpacing:"0.12em",
          textTransform:"uppercase", color:"var(--textMuted)", marginBottom:4, fontWeight:600 }}>
          Ingredients Used Per Serving
        </div>
        <div style={{ fontSize:11, color:"var(--textFaint)", marginBottom:12, lineHeight:1.5 }}>
          Enter the amount used per dish in whatever unit makes sense. The app converts to your stock unit automatically.
        </div>

        {form.recipe.map((r,idx) => {
          const ing = ingredients.find(x=>x.id===r.id);
          const conv = getConversion(r.recipeUnit, ing?.unit);
          const stockDeduct = r.qty ? +(+r.qty * conv).toFixed(4) : null;
          const sameUnit = r.recipeUnit === ing?.unit;
          return (
            <div key={idx} style={{ marginBottom:10, background:"var(--surfaceHi)",
              border:"1px solid var(--border)", borderRadius:6, padding:"10px 12px" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom: (!sameUnit && stockDeduct) ? 6 : 0 }}>
                {/* Ingredient picker */}
                <Select style={{ flex:3 }} value={r.id} onChange={e=>changeIngredient(idx, e.target.value)}>
                  {ingredients.map(i=><option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </Select>
                {/* Amount */}
                <Input type="number" placeholder="Qty" value={r.qty}
                  onChange={e=>updateLine(idx,"qty",e.target.value)}
                  style={{ flex:1, minWidth:64 }} />
                {/* Recipe unit */}
                <Select style={{ flex:1.5 }} value={r.recipeUnit||ing?.unit||"oz"}
                  onChange={e=>updateLine(idx,"recipeUnit",e.target.value)}>
                  {RECIPE_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                </Select>
                <Btn small variant="danger" onClick={()=>removeLine(idx)}>✕</Btn>
              </div>
              {/* Conversion hint */}
              {!sameUnit && stockDeduct && ing && (
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--teal)" }}>
                  ✓ deducts {stockDeduct} {ing.unit} from stock per serving
                </div>
              )}
              {r.qty && sameUnit && ing && (
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textFaint)" }}>
                  same unit as stock ({ing.unit})
                </div>
              )}
            </div>
          );
        })}

        <Btn onClick={addLine} style={{ marginBottom:8 }}>+ Add Ingredient</Btn>
        <Btn onClick={()=>setShowNewIng(s=>!s)} style={{ marginBottom:16, marginLeft:8 }}>
          {showNewIng ? "✕ Cancel New" : "+ Create New Ingredient"}
        </Btn>

        {showNewIng && (
          <div style={{ background:"var(--deep)", border:"1px solid var(--borderLt)",
            borderRadius:6, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, letterSpacing:"0.12em",
              textTransform:"uppercase", color:"var(--ember)", fontWeight:600, marginBottom:12 }}>
              Quick-Add New Ingredient
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <FG><Label>Name</Label>
                <Input value={newIng.name} placeholder="e.g. Lobster Butter"
                  onChange={e=>setNewIng(f=>({...f,name:e.target.value}))} />
              </FG>
              <FG><Label>Unit (stock unit)</Label>
                <Input value={newIng.unit} placeholder="e.g. lbs, oz, each"
                  onChange={e=>setNewIng(f=>({...f,unit:e.target.value}))} />
              </FG>
              <FG><Label>Category</Label>
                <Select value={newIng.category} onChange={e=>setNewIng(f=>({...f,category:e.target.value}))}>
                  {["Shellfish","Fish","Produce","Dairy","Sauces","Bread","Pantry","Luxury","Other"].map(c=><option key={c}>{c}</option>)}
                </Select>
              </FG>
              <FG><Label>Cost per Unit ($)</Label>
                <Input type="number" step="0.01" value={newIng.cost} placeholder="0.00"
                  onChange={e=>setNewIng(f=>({...f,cost:e.target.value}))} />
              </FG>
              <FG><Label>Par Level</Label>
                <Input type="number" value={newIng.par} placeholder="Min stock target"
                  onChange={e=>setNewIng(f=>({...f,par:e.target.value}))} />
              </FG>
              <FG><Label>Shrink %</Label>
                <Input type="number" value={newIng.shrinkPct} placeholder="5"
                  onChange={e=>setNewIng(f=>({...f,shrinkPct:e.target.value}))} />
              </FG>
            </div>
            <Btn variant="primary" onClick={createAndAddIngredient}
              style={{ opacity: newIng.name && newIng.unit ? 1 : 0.4 }}>
              ✓ Create & Add to Recipe
            </Btn>
          </div>
        )}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn onClick={()=>setModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>Save Recipe</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SHRINK
══════════════════════════════════════════════════════════════════════════════ */

export default Recipes;
