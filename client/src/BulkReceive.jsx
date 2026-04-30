import { useState } from "react";
import { status, fc, fmtn, STATUS_COLOR, Badge, Bar, Card, SectionTitle, Th, Td, Btn, Input, Select, Label, FG } from "./ui.jsx";

function BulkReceive({ ingredients, suppliers, onReceive }) {
  const today = new Date().toISOString().slice(0,10);
  const [suppFilter, setSuppFilter] = useState("all");
  const [date, setDate]             = useState(today);
  const [note, setNote]             = useState("");
  const [qtys, setQtys]             = useState({});  // { ingredientId: qtyString }
  const [confirmed, setConfirmed]   = useState(false);

  const filtered = suppFilter === "all"
    ? ingredients
    : ingredients.filter(i => i.supplierId === suppFilter);

  const setQty = (id, val) => setQtys(q => ({ ...q, [id]: val }));

  const linesWithQty = filtered.filter(i => parseFloat(qtys[i.id]) > 0);
  const totalCost    = linesWithQty.reduce((a,i) => a + (parseFloat(qtys[i.id])||0) * i.cost, 0);

  const receive = async () => {
    await onReceive(linesWithQty.map(i => ({ id: i.id, delta: parseFloat(qtys[i.id]) })));
    setQtys({});
    setNote("");
    setConfirmed(false);
  };

  return (
    <div className="fade-up">
      {/* Config row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:16 }}>
        <div>
          <label style={{ display:"block", marginBottom:6, fontSize:10, letterSpacing:"0.12em",
            textTransform:"uppercase", color:"var(--textMuted)", fontWeight:600 }}>Delivery Date</label>
          <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display:"block", marginBottom:6, fontSize:10, letterSpacing:"0.12em",
            textTransform:"uppercase", color:"var(--textMuted)", fontWeight:600 }}>Filter by Supplier</label>
          <Select value={suppFilter} onChange={e=>{setSuppFilter(e.target.value);setQtys({});}}>
            <option value="all">All Suppliers</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div>
          <label style={{ display:"block", marginBottom:6, fontSize:10, letterSpacing:"0.12em",
            textTransform:"uppercase", color:"var(--textMuted)", fontWeight:600 }}>Notes (optional)</label>
          <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="PO#, invoice, driver name…" />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, alignItems:"start" }}>
        {/* Item list */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <SectionTitle style={{ marginBottom:0 }}>Enter Quantities Received</SectionTitle>
            <button onClick={()=>setQtys({})}
              style={{ background:"none", border:"none", color:"var(--textMuted)", fontSize:11,
                cursor:"pointer", fontFamily:"'Jost',sans-serif", letterSpacing:"0.05em" }}>
              Clear All
            </button>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <Th>Ingredient</Th>
                  <Th>Supplier</Th>
                  <Th>Current Stock</Th>
                  <Th>Par</Th>
                  <Th>Qty Received</Th>
                  <Th>New Stock</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => {
                  const sup     = suppliers.find(x=>x.id===i.supplierId);
                  const s       = status(i.stock, i.par);
                  const received= parseFloat(qtys[i.id])||0;
                  const newStock= Math.round((i.stock + received)*1000)/1000;
                  const hasQty  = received > 0;
                  return (
                    <tr key={i.id} className="row-hover"
                      style={{ background: hasQty ? "rgba(42,180,160,0.04)" : "transparent" }}>
                      <Td>
                        <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:600 }}>{i.name}</div>
                        <div style={{ fontSize:10, color:"var(--textFaint)", marginTop:2 }}>tracked in {i.trackingUnit||i.unit} · {i.caseQty||1} per {i.orderUnit||"case"}</div>
                      </Td>
                      <Td muted style={{ fontSize:11 }}>{sup?.name||"—"}</Td>
                      <Td style={{ fontFamily:"'DM Mono',monospace", color:STATUS_COLOR[s] }}>
                        {fmtn(i.stock)} {i.trackingUnit||i.unit}
                      </Td>
                      <Td muted style={{ fontFamily:"'DM Mono',monospace" }}>{i.par}</Td>
                      <Td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={qtys[i.id]||""}
                            onChange={e=>setQty(i.id, e.target.value)}
                            style={{ width:90, padding:"6px 10px", fontSize:13,
                              borderColor: hasQty ? "var(--teal)" : "var(--border)" }}
                          />
                          <span style={{ fontSize:11, color:"var(--textMuted)" }}>{i.trackingUnit||i.unit}</span>
                        </div>
                      </Td>
                      <Td style={{ fontFamily:"'DM Mono',monospace",
                        color: hasQty ? "var(--teal)" : "var(--textFaint)" }}>
                        {hasQty ? `${fmtn(newStock,2)} ${i.trackingUnit||i.unit}` : "—"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary + confirm */}
        <div>
          <Card>
            <SectionTitle>Receiving Summary</SectionTitle>
            {linesWithQty.length === 0 ? (
              <div style={{ fontSize:12, color:"var(--textFaint)", fontStyle:"italic", padding:"8px 0" }}>
                Enter quantities in the table to see a summary
              </div>
            ) : (
              <>
                {linesWithQty.map(i => (
                  <div key={i.id} style={{ display:"flex", justifyContent:"space-between",
                    padding:"7px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                    <span style={{ fontFamily:"'Jost',sans-serif" }}>{i.name}</span>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", color:"var(--teal)", fontWeight:600 }}>
                        +{qtys[i.id]} {i.trackingUnit||i.unit}
                      </div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textMuted)" }}>
                        {fc((parseFloat(qtys[i.id])||0) * i.cost)}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0 4px",
                  fontFamily:"'DM Mono',monospace", fontSize:13 }}>
                  <span style={{ color:"var(--textMuted)" }}>Delivery value</span>
                  <span style={{ color:"var(--gold)", fontWeight:700 }}>{fc(totalCost)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0 12px",
                  fontFamily:"'DM Mono',monospace", fontSize:11, color:"var(--textMuted)" }}>
                  <span>Date</span>
                  <span>{date}</span>
                </div>
                {note && (
                  <div style={{ fontSize:11, color:"var(--textMuted)", marginBottom:12,
                    background:"var(--surfaceHi)", borderRadius:4, padding:"6px 10px" }}>
                    {note}
                  </div>
                )}

                {!confirmed ? (
                  <Btn variant="primary" onClick={()=>setConfirmed(true)} style={{ width:"100%" }}>
                    Review & Confirm Delivery
                  </Btn>
                ) : (
                  <div>
                    <div style={{ background:"var(--tealDim)", border:"1px solid var(--teal)",
                      borderRadius:6, padding:"12px 14px", marginBottom:12, fontSize:12,
                      fontFamily:"'Jost',sans-serif", color:"var(--teal)", lineHeight:1.6 }}>
                      ✓ This will add the quantities above to your current stock levels. This cannot be undone.
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn onClick={()=>setConfirmed(false)} style={{ flex:1 }}>Cancel</Btn>
                      <Btn variant="primary" onClick={receive} style={{ flex:2 }}>
                        ✓ Post Delivery to Stock
                      </Btn>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SALES SYNC TAB
══════════════════════════════════════════════════════════════════════════════ */
export const QUICK_RANGES = [
  { label:"Today",       days:0  },
  { label:"Yesterday",   days:1  },
  { label:"Last 3 days", days:3  },
  { label:"Last 7 days", days:7  },
  { label:"Last 14 days",days:14 },
  { label:"Last 30 days",days:30 },
  { label:"Custom",      days:-1 },
];


export default BulkReceive;
