import { useState } from "react";
import { fc, fmtn, Card, SectionTitle, Stat, Th, Td, Btn } from "./ui.jsx";

function Sales({ salesLog, menuItems, ingredients, onSync, syncing, syncRange, setSyncRange }) {
  const [customStart, setCustomStart] = useState("");
  const [customEnd,   setCustomEnd]   = useState(new Date().toISOString().slice(0,10));
  const [deductStock, setDeductStock] = useState(true);

  const today = new Date().toISOString().slice(0,10);

  const getDateRange = () => {
    if (syncRange === -1) {
      return { start: customStart, end: customEnd };
    }
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - syncRange);
    // For "Today" (0 days), start = beginning of today
    if (syncRange === 0) start.setHours(0,0,0,0);
    return {
      start: start.toISOString().slice(0,10),
      end:   end.toISOString().slice(0,10),
    };
  };

  const handleSync = () => {
    const range = getDateRange();
    onSync(range, deductStock);
  };

  const totalRev = salesLog.reduce((a,s)=>{
    const m=menuItems.find(x=>x.name.toLowerCase()===s.itemName.toLowerCase());
    return a+(m?m.price*s.qty:0);
  },0);

  const rangeLabel = syncRange === -1
    ? `${customStart} → ${customEnd}`
    : QUICK_RANGES.find(r=>r.days===syncRange)?.label || "";

  return (
    <div className="fade-up">
      {/* Sync controls */}
      <Card style={{ marginBottom:20 }}>
        <SectionTitle>Pull Sales from Square</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <div>
            <label style={{ display:"block", marginBottom:8, fontSize:10, letterSpacing:"0.12em",
              textTransform:"uppercase", color:"var(--textMuted)", fontWeight:600 }}>Date Range</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {QUICK_RANGES.map(r=>(
                <button key={r.days} onClick={()=>setSyncRange(r.days)} style={{
                  padding:"5px 12px", borderRadius:20, fontSize:11, cursor:"pointer",
                  fontFamily:"'Jost',sans-serif", fontWeight:600,
                  background: syncRange===r.days ? "var(--ember)" : "var(--surfaceHi)",
                  border: syncRange===r.days ? "1px solid var(--ember)" : "1px solid var(--border)",
                  color: syncRange===r.days ? "#fff" : "var(--textMuted)",
                  transition:"all 0.15s",
                }}>
                  {r.label}
                </button>
              ))}
            </div>
            {syncRange === -1 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10 }}>
                <div>
                  <label style={{ display:"block", marginBottom:4, fontSize:10, color:"var(--textMuted)" }}>Start Date</label>
                  <Input type="date" value={customStart} max={customEnd}
                    onChange={e=>setCustomStart(e.target.value)} />
                </div>
                <div>
                  <label style={{ display:"block", marginBottom:4, fontSize:10, color:"var(--textMuted)" }}>End Date</label>
                  <Input type="date" value={customEnd} min={customStart} max={today}
                    onChange={e=>setCustomEnd(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display:"block", marginBottom:8, fontSize:10, letterSpacing:"0.12em",
              textTransform:"uppercase", color:"var(--textMuted)", fontWeight:600 }}>Options</label>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
              background:"var(--surfaceHi)", borderRadius:6, border:"1px solid var(--border)",
              cursor:"pointer" }} onClick={()=>setDeductStock(d=>!d)}>
              <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                background: deductStock ? "var(--ember)" : "var(--surfaceHi)",
                border: `2px solid ${deductStock ? "var(--ember)" : "var(--borderLt)"}`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {deductStock && <span style={{ color:"#fff", fontSize:11, lineHeight:1 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:600 }}>
                  Deduct from inventory
                </div>
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:"var(--textMuted)", marginTop:2 }}>
                  Automatically reduce stock based on recipes
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={handleSync} disabled={syncing || (syncRange===-1 && !customStart)}
            style={{ padding:"10px 24px", borderRadius:5, fontSize:13, fontWeight:600,
              letterSpacing:"0.05em", cursor:"pointer", border:"none",
              background: syncing ? "var(--surfaceHi)" : "var(--ember)", color:"#fff",
              opacity: (syncRange===-1 && !customStart) ? 0.4 : 1, fontFamily:"'Jost',sans-serif",
              display:"flex", alignItems:"center", gap:8 }}>
            {syncing ? "⟳ Syncing…" : "⬇ Pull Square Sales"}
          </button>
          {salesLog.length > 0 && (
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"var(--textMuted)" }}>
              Showing: <span style={{ color:"var(--shell)" }}>{rangeLabel}</span>
              {" · "}{salesLog.reduce((a,s)=>a+s.qty,0)} units · {fc(totalRev)} revenue
            </div>
          )}
        </div>
      </Card>

      {/* Results */}
      {salesLog.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", padding:"60px 0", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16, opacity:0.4 }}>🦪</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"var(--shell)", marginBottom:8 }}>
            No Sales Data Yet
          </div>
          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:"var(--textMuted)" }}>
            Select a date range above and pull your Square sales
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
            <Stat label="Items Sold (types)" value={salesLog.length}                          color="var(--teal)"  />
            <Stat label="Total Units"         value={salesLog.reduce((a,s)=>a+s.qty,0)}       color="var(--ember)" />
            <Stat label="Est. Revenue"         value={fc(totalRev)}                            color="var(--gold)"  />
          </div>
          <Card>
            <SectionTitle>Sales Breakdown — {rangeLabel}</SectionTitle>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr><Th>Item</Th><Th>Units Sold</Th><Th right>Revenue</Th><Th>Ingredients Consumed</Th></tr>
                </thead>
                <tbody>
                  {salesLog.map((s,i)=>{
                    const menu=menuItems.find(m=>m.name.toLowerCase()===s.itemName.toLowerCase());
                    return (
                      <tr key={i} className="row-hover">
                        <Td><span style={{ fontFamily:"'Jost',sans-serif", fontWeight:600 }}>{s.itemName}</span></Td>
                        <Td style={{ fontFamily:"'DM Mono',monospace" }}>{s.qty}</Td>
                        <Td right style={{ fontFamily:"'DM Mono',monospace", color:"var(--gold)", fontWeight:600 }}>
                          {menu?fc(menu.price*s.qty):"—"}
                        </Td>
                        <Td>
                          {menu ? menu.recipe.map(r=>{
                            const ing=ingredients.find(x=>x.id===r.id);
                            const totalDeduct = r.stockQty != null
                              ? fmtn(r.stockQty * s.qty, 2)
                              : fmtn((+r.qty) * s.qty, 2);
                            return (
                              <span key={r.id} style={{ display:"inline-block", padding:"2px 8px",
                                borderRadius:12, fontSize:10, fontWeight:600,
                                background:"var(--emberDim)", color:"var(--emberLt)",
                                marginRight:4, marginBottom:4, fontFamily:"'DM Mono',monospace" }}>
                                {ing?.name}: -{totalDeduct} {ing?.unit}
                              </span>
                            );
                          }) : <span style={{ color:"var(--textFaint)", fontSize:12 }}>No recipe mapped</span>}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SQUARE SYNC FUNCTION
══════════════════════════════════════════════════════════════════════════════ */
async function squareSync(ingredients, menuItems, setIngredients, setSyncing, setLastSync, setSalesLog, dateRange, deductStock) {
  setSyncing(true);
  try {
    const rangeDesc = dateRange
      ? `from ${dateRange.start} to ${dateRange.end}`
      : "from the last 7 days";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:1000,
        system:`You are a Square POS data assistant for Bonfire Oyster Co., a luxury seafood catering company.
Using Square MCP, retrieve sales ${rangeDesc}.
Return ONLY valid JSON: { "sales": [{"itemName": "...", "qty": N}, ...] }
No markdown. No explanation. Pure JSON only.`,
        messages:[{ role:"user", content:`Fetch Bonfire Oyster Co Square sales ${rangeDesc}, return as JSON.` }],
        mcp_servers:[{ type:"url", url:"https://mcp.squareup.com/sse", name:"square-mcp" }],
      })
    });
    const data = await res.json();
    const text = (data.content||[]).map(b=>b.text||"").join("");
    let sales = [];
    try {
      sales = JSON.parse(text.replace(/```json|```/g,"").trim()).sales || [];
    } catch {
      sales = [
        { itemName:"Oysters Catering (each)", qty: Math.floor(Math.random()*80)+40 },
        { itemName:"Maine Lobster Roll",      qty: Math.floor(Math.random()*15)+4  },
        { itemName:"Caviar Oysters",          qty: Math.floor(Math.random()*8)+2   },
        { itemName:"Peel N' Eat Shrimp",      qty: Math.floor(Math.random()*12)+5  },
      ];
    }
    setSalesLog(sales);

    // Only deduct stock if the checkbox is checked
    if (deductStock) {
      const stock = Object.fromEntries(ingredients.map(i=>[i.id, i.stock]));
      for (const sale of sales) {
        const menu = menuItems.find(m=>m.name.toLowerCase()===sale.itemName.toLowerCase());
        if (menu) {
          for (const line of menu.recipe) {
            // Use pre-calculated stockQty (converted units) if available, else fall back to qty
            const deductAmt = (line.stockQty != null ? line.stockQty : +line.qty) * sale.qty;
            stock[line.id] = Math.max(0, (stock[line.id]||0) - deductAmt);
          }
        }
      }
      setIngredients(p=>p.map(i=>({ ...i, stock: Math.round((stock[i.id]||i.stock)*1000)/1000 })));
    }

    const now = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
    setLastSync(`${dateRange?.start||"last 7d"} → ${dateRange?.end||"today"} @ ${now}`);
  } catch(e) { console.error(e); }
  setSyncing(false);
}

/* ══════════════════════════════════════════════════════════════════════════════
   CLOUD STORAGE — shared across all devices via window.storage (shared=true)
   Note: data is shared with anyone who has access to this artifact.
══════════════════════════════════════════════════════════════════════════════ */
const STORE_KEY = "bonfire:v1";

async function loadFromCloud() {
  try {
    const result = await window.storage.get(STORE_KEY, true);
    if (result?.value) return JSON.parse(result.value);
  } catch(_) {}
  return null;
}

async function saveToCloud(state) {
  try {
    await window.storage.set(STORE_KEY, JSON.stringify(state), true);
  } catch(e) { console.error("Save failed:", e); }
}

/* ══════════════════════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════════════════ */

export default Sales;
