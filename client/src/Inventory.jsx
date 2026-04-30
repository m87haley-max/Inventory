import { useState } from "react";
import { status, fc, fmtn, STATUS_COLOR, Badge, Card, SectionTitle, Th, Td, Btn, Input, Select, Label, FG, Modal } from "./ui.jsx";

function Inventory({ ingredients, suppliers, onSave, onDelete, onAdjust }) {
  const CATS = ["Shellfish","Fish","Produce","Dairy","Sauces","Bread","Pantry","Luxury","Other"];
  const blank = {
    name:"", category:"Shellfish", supplierId:"",
    orderUnit:"case", caseCost:"", minOrderQty:"1",
    trackingUnit:"", caseQty:"", par:"", stock:"", shrinkPct:"5",
    unit:"", cost:0,
  };
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(blank);
  const [adjustId, setAdjustId] = useState(null);
  const [adjQty, setAdjQty] = useState("");
  const [filter, setFilter] = useState("All");

  const openAdd  = () => { setForm({...blank, supplierId:suppliers[0]?.id||""}); setEditId(null); setModal(true); };
  const openEdit = (i) => {
    setForm({
      name:         i.name,
      category:     i.category,
      supplierId:   i.supplierId || "",
      orderUnit:    i.orderUnit  || "case",
      caseCost:     String(i.caseCost != null ? i.caseCost : (i.cost||0) * (i.caseQty||1)),
      minOrderQty:  String(i.minOrderQty || "1"),
      trackingUnit: i.trackingUnit || i.unit || "",
      caseQty:      String(i.caseQty  || ""),
      par:          String(i.par      || ""),
      stock:        String(i.stock    || ""),
      shrinkPct:    String(i.shrinkPct|| "5"),
      unit:         i.unit || "",
      cost:         i.cost || 0,
    });
    setEditId(i.id);
    setModal(true);
  };
  const save = async () => {
    const caseQty    = +form.caseQty  || 1;
    const caseCost   = +form.caseCost || 0;
    const costPerUnit = caseQty > 0 ? caseCost / caseQty : 0;
    const entry = {
      name:         form.name,
      category:     form.category,
      supplierId:   form.supplierId,
      orderUnit:    form.orderUnit,
      caseCost:     caseCost,
      minOrderQty:  +form.minOrderQty || 1,
      trackingUnit: form.trackingUnit,
      caseQty:      caseQty,
      par:          +form.par    || 0,
      stock:        +form.stock  || 0,
      shrinkPct:    +form.shrinkPct || 5,
      unit:         form.trackingUnit,
      cost:         costPerUnit,
    };
    await onSave(entry, editId);
    setModal(false);
  };
  const del  = (id) => onDelete(id);
  // If stock is 0, treat input as absolute "set to this amount"; otherwise treat as +/- delta
  const adj  = async (i) => {
    await onAdjust(i.id, +adjQty);
    setAdjustId(null);
    setAdjQty("");
  };

  const all = ["All", ...CATS];
  const rows = filter==="All" ? ingredients : ingredients.filter(i=>i.category===filter);

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {all.map(c=>(
            <button key={c} onClick={()=>setFilter(c)} style={{
              padding:"5px 14px", borderRadius:20, fontSize:11, cursor:"pointer",
              fontFamily:"'Jost',sans-serif", fontWeight:600, letterSpacing:"0.05em",
              background: filter===c ? "var(--ember)" : "var(--surfaceHi)",
              border: filter===c ? "1px solid var(--ember)" : "1px solid var(--border)",
              color: filter===c ? "#fff" : "var(--textMuted)" }}>
              {c}
            </button>
          ))}
        </div>
        <Btn variant="primary" onClick={openAdd}>+ Add Ingredient</Btn>
      </div>

      {ingredients.length === 0 ? (
        <Card style={{ textAlign:"center", padding:"48px 24px" }}>
          <div style={{ fontSize:36, marginBottom:14 }}>🦪</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"var(--shell)", marginBottom:8 }}>
            No ingredients yet
          </div>
          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:"var(--textMuted)", marginBottom:24, lineHeight:1.6 }}>
            Add the ingredients you stock — oysters by the dozen, sauces by the oz,<br />
            garnishes, packaging, anything you track and reorder.
          </div>
          <Btn variant="primary" onClick={openAdd}>+ Add Your First Ingredient</Btn>
        </Card>
      ) : (
      <>
        {/* On-hand count prompt — show when any ingredients still have 0 stock */}
        {ingredients.some(i => i.stock === 0 || i.stock === "0") && (
          <div style={{
            background:"rgba(200,98,26,0.08)", border:"1px solid rgba(200,98,26,0.35)",
            borderLeft:"3px solid var(--ember)", borderRadius:6,
            padding:"12px 16px", marginBottom:16,
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:16
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:18 }}>📋</span>
              <div>
                <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:13, color:"var(--shell)", marginBottom:2 }}>
                  Update your on-hand counts
                </div>
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"var(--textMuted)" }}>
                  {ingredients.filter(i => i.stock === 0 || i.stock === "0").length} ingredient{ingredients.filter(i=>i.stock===0||i.stock==="0").length>1?"s":""} showing 0 on hand.
                  Click the count in the <strong style={{ color:"var(--shell)" }}>On Hand</strong> column to set your actual stock level.
                </div>
              </div>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textMuted)", whiteSpace:"nowrap" }}>
              Tap any count to edit ✎
            </div>
          </div>
        )}
      <Card>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <Th>Ingredient</Th>
                <Th>Category</Th>
                <Th>Supplier</Th>
                <Th>On Hand</Th>
                <Th>Cases</Th>
                <Th>Par</Th>
                <Th>Case Cost</Th>
                <Th>Cost/{"{unit}"}</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(i => {
                const s        = status(i.stock, i.par);
                const sup      = suppliers.find(x=>x.id===i.supplierId);
                const isZero   = i.stock === 0 || i.stock === "0";
                const caseQty  = i.caseQty  || 1;
                const caseCost = i.caseCost || (i.cost * caseQty);
                const cases    = i.stock / caseQty;
                const trackUnit = i.trackingUnit || i.unit || "unit";
                return (
                  <tr key={i.id} className="row-hover">
                    <Td><span style={{ fontFamily:"'Jost',sans-serif", fontWeight:600 }}>{i.name}</span>
                      <div style={{ fontSize:10, color:"var(--textFaint)", marginTop:2 }}>{i.category}</div>
                    </Td>
                    <Td muted style={{ fontSize:11 }}>{sup?.name||"—"}</Td>
                    <Td>
                      {adjustId===i.id ? (
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          <Input style={{ width:80, padding:"5px 8px", fontSize:12 }}
                            type="number" value={adjQty}
                            onChange={e=>setAdjQty(e.target.value)}
                            placeholder={isZero ? "Set count" : "+/-"} autoFocus />
                          <Btn small variant="primary" onClick={()=>adj(i)}>✓</Btn>
                          <Btn small onClick={()=>setAdjustId(null)}>✕</Btn>
                        </div>
                      ) : (
                        <span style={{ fontFamily:"'DM Mono',monospace",
                          color: isZero ? "var(--ember)" : STATUS_COLOR[s],
                          cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}
                          onClick={()=>{setAdjustId(i.id);setAdjQty("");}}>
                          {isZero
                            ? <span style={{ fontSize:10, background:"var(--emberDim)", color:"var(--ember)",
                                borderRadius:3, padding:"1px 6px", fontWeight:700, letterSpacing:"0.05em" }}>SET COUNT</span>
                            : <>{fmtn(i.stock,1)} {trackUnit}</>
                          }
                          <span style={{ fontSize:10, color:"var(--textFaint)" }}>✎</span>
                        </span>
                      )}
                    </Td>
                    <Td style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"var(--textMuted)" }}>
                      {i.stock > 0
                        ? <><span style={{ color:STATUS_COLOR[s], fontWeight:600 }}>{fmtn(cases,2)}</span>
                            <span style={{ color:"var(--textFaint)", fontSize:10 }}> {i.orderUnit||"cases"}</span></>
                        : <span style={{ color:"var(--textFaint)" }}>—</span>
                      }
                    </Td>
                    <Td muted style={{ fontFamily:"'DM Mono',monospace" }}>
                      {i.par} {trackUnit}
                      {i.par && caseQty > 1 && (
                        <div style={{ fontSize:10, color:"var(--textFaint)" }}>
                          {fmtn(i.par/caseQty,2)} {i.orderUnit||"cases"}
                        </div>
                      )}
                    </Td>
                    <Td style={{ fontFamily:"'DM Mono',monospace', color:'var(--gold)'" }}>
                      {caseCost > 0 ? fc(caseCost) : "—"}
                      {i.minOrderQty > 1 && (
                        <div style={{ fontSize:10, color:"var(--textFaint)" }}>min {i.minOrderQty} {i.orderUnit||"cases"}</div>
                      )}
                    </Td>
                    <Td muted style={{ fontFamily:"'DM Mono',monospace", fontSize:11 }}>
                      {i.cost > 0 ? `${fc(i.cost)}/${trackUnit}` : "—"}
                    </Td>
                    <Td><Badge s={s} /></Td>
                    <Td>
                      <div style={{ display:"flex", gap:6 }}>
                        <Btn small onClick={()=>openEdit(i)}>Edit</Btn>
                        <Btn small variant="danger" onClick={()=>del(i.id)}>Del</Btn>
                      </div>
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

      <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Edit Ingredient":"Add Ingredient"}>

        {/* Live preview calculation */}
        {form.caseQty && form.caseCost && form.trackingUnit && (
          <div style={{ background:"var(--tealDim)", border:"1px solid rgba(42,180,160,0.3)",
            borderRadius:6, padding:"10px 14px", marginBottom:16,
            fontFamily:"'DM Mono',monospace", fontSize:11, color:"var(--teal)", lineHeight:2 }}>
            💡 1 case = <strong>{form.caseQty} {form.trackingUnit}</strong>
            {" · "}cost per {form.trackingUnit}: <strong>{form.caseQty ? `$${(+form.caseCost / +form.caseQty).toFixed(4)}` : "—"}</strong>
            {" · "}par of {form.par||"?"} {form.trackingUnit} = <strong>{form.par && form.caseQty ? `${(+form.par / +form.caseQty).toFixed(2)} cases` : "—"}</strong>
          </div>
        )}

        <FG><Label>Ingredient Name</Label>
          <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. East Coast Oysters" />
        </FG>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:4 }}>
          <FG><Label>Category</Label>
            <Select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </Select>
          </FG>
          <FG><Label>Supplier</Label>
            <Select value={form.supplierId||""} onChange={e=>setForm(f=>({...f,supplierId:e.target.value}))}>
              <option value="">— None —</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FG>
        </div>

        {/* Ordering section */}
        <div style={{ background:"var(--surfaceHi)", border:"1px solid var(--border)",
          borderRadius:6, padding:"14px", marginBottom:12 }}>
          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, letterSpacing:"0.15em",
            textTransform:"uppercase", color:"var(--ember)", fontWeight:600, marginBottom:12 }}>
            🔥 How You Order
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            <FG>
              <Label>Order Unit
                <span title="The unit your supplier sells in. Examples: 'case', 'bag', 'flat', 'gallon', 'box'"
                  style={{ marginLeft:5, display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:13, height:13, borderRadius:"50%", background:"var(--borderLt)",
                    color:"var(--textMuted)", fontSize:9, fontWeight:700, cursor:"help", verticalAlign:"middle" }}>?</span>
              </Label>
              <Input value={form.orderUnit} onChange={e=>setForm(f=>({...f,orderUnit:e.target.value}))}
                placeholder="case, bag, gallon…" />
            </FG>
            <FG>
              <Label>Case / Order Cost ($)
                <span title="Total cost of one order unit (one case, one bag, one gallon, etc.)"
                  style={{ marginLeft:5, display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:13, height:13, borderRadius:"50%", background:"var(--borderLt)",
                    color:"var(--textMuted)", fontSize:9, fontWeight:700, cursor:"help", verticalAlign:"middle" }}>?</span>
              </Label>
              <Input type="number" step="0.01" value={form.caseCost}
                onChange={e=>setForm(f=>({...f,caseCost:e.target.value}))} placeholder="e.g. 100.00" />
            </FG>
            <FG>
              <Label>Min Order Qty
                <span title="Minimum number of order units per purchase (e.g. 1 case, 2 flats)"
                  style={{ marginLeft:5, display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:13, height:13, borderRadius:"50%", background:"var(--borderLt)",
                    color:"var(--textMuted)", fontSize:9, fontWeight:700, cursor:"help", verticalAlign:"middle" }}>?</span>
              </Label>
              <Input type="number" value={form.minOrderQty}
                onChange={e=>setForm(f=>({...f,minOrderQty:e.target.value}))} placeholder="e.g. 1" />
            </FG>
          </div>
        </div>

        {/* Tracking section */}
        <div style={{ background:"var(--surfaceHi)", border:"1px solid var(--border)",
          borderRadius:6, padding:"14px", marginBottom:12 }}>
          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, letterSpacing:"0.15em",
            textTransform:"uppercase", color:"var(--teal)", fontWeight:600, marginBottom:12 }}>
            📦 How You Track It
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            <FG>
              <Label>Tracking Unit
                <span title="The unit you count inventory in. Examples: 'each', 'lbs', 'oz', 'gallons'. This is what you physically count."
                  style={{ marginLeft:5, display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:13, height:13, borderRadius:"50%", background:"var(--borderLt)",
                    color:"var(--textMuted)", fontSize:9, fontWeight:700, cursor:"help", verticalAlign:"middle" }}>?</span>
              </Label>
              <Input value={form.trackingUnit} onChange={e=>setForm(f=>({...f,trackingUnit:e.target.value}))}
                placeholder="each, lbs, oz…" />
            </FG>
            <FG>
              <Label>Tracking Units per Case
                <span title="How many tracking units come in one order unit. E.g. 100 oysters per case, 12 lbs per case, 128 oz per gallon."
                  style={{ marginLeft:5, display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:13, height:13, borderRadius:"50%", background:"var(--borderLt)",
                    color:"var(--textMuted)", fontSize:9, fontWeight:700, cursor:"help", verticalAlign:"middle" }}>?</span>
              </Label>
              <Input type="number" value={form.caseQty}
                onChange={e=>setForm(f=>({...f,caseQty:e.target.value}))} placeholder="e.g. 100, 12, 128" />
            </FG>
            <FG>
              <Label>Par Level ({form.trackingUnit||"units"})
                <span title="Minimum tracking units to keep on hand. When stock drops below this, item shows as LOW."
                  style={{ marginLeft:5, display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:13, height:13, borderRadius:"50%", background:"var(--borderLt)",
                    color:"var(--textMuted)", fontSize:9, fontWeight:700, cursor:"help", verticalAlign:"middle" }}>?</span>
              </Label>
              <Input type="number" value={form.par}
                onChange={e=>setForm(f=>({...f,par:e.target.value}))} placeholder="e.g. 50, 6, 64" />
            </FG>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:4 }}>
            <FG>
              <Label>Current Stock ({form.trackingUnit||"units"})</Label>
              <Input type="number" value={form.stock}
                onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="How many on hand right now" />
            </FG>
            <FG>
              <Label>Shrink %
                <span title="% typically lost to spoilage, trim, spillage. Used for real usage calculations."
                  style={{ marginLeft:5, display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:13, height:13, borderRadius:"50%", background:"var(--borderLt)",
                    color:"var(--textMuted)", fontSize:9, fontWeight:700, cursor:"help", verticalAlign:"middle" }}>?</span>
              </Label>
              <Input type="number" value={form.shrinkPct}
                onChange={e=>setForm(f=>({...f,shrinkPct:e.target.value}))} placeholder="5" />
            </FG>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <Btn onClick={()=>setModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>{editId ? "Save Changes" : "Add Ingredient"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SUPPLIERS
══════════════════════════════════════════════════════════════════════════════ */

export default Inventory;
