import { useState } from "react";
import { status, fc, fmtn, STATUS_COLOR, Badge, Card, SectionTitle, Th, Td, Btn, Input, Select, Label, FG, Modal } from "./ui.jsx";

function Suppliers({ suppliers, setSuppliers, ingredients }) {
  const blank = { name:"", contact:"", phone:"", notes:"" };
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(blank);

  const openAdd  = () => { setForm(blank); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm(s); setEditId(s.id); setModal(true); };
  const save = () => {
    if (editId) setSuppliers(p=>p.map(s=>s.id===editId?{...s,...form}:s));
    else        setSuppliers(p=>[...p, {...form, id:`sup-${Date.now()}`}]);
    setModal(false);
  };
  const del = (id) => setSuppliers(p=>p.filter(s=>s.id!==id));

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"var(--textMuted)" }}>{suppliers.length} suppliers on record</div>
        <Btn variant="primary" onClick={openAdd}>+ Add Supplier</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
        {suppliers.map(s => {
          const items = ingredients.filter(i=>i.supplierId===s.id);
          const val   = items.reduce((a,i)=>a+i.stock*i.cost,0);
          return (
            <Card key={s.id}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"var(--shell)", marginBottom:4 }}>{s.name}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"var(--teal)" }}>{s.contact}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"var(--textMuted)", marginTop:2 }}>{s.phone}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn small onClick={()=>openEdit(s)}>Edit</Btn>
                  <Btn small variant="danger" onClick={()=>del(s.id)}>Del</Btn>
                </div>
              </div>
              {s.notes && (
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"var(--textMuted)",
                  background:"var(--surfaceHi)", borderRadius:4, padding:"8px 12px", marginBottom:12 }}>
                  {s.notes}
                </div>
              )}
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:12 }}>
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:9, letterSpacing:"0.15em",
                  textTransform:"uppercase", color:"var(--textMuted)", marginBottom:8, fontWeight:600 }}>
                  Items Sourced ({items.length})
                </div>
                {items.map(i => {
                  const s2 = status(i.stock, i.par);
                  return (
                    <div key={i.id} style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", padding:"5px 0", borderBottom:"1px solid var(--border)", fontSize:12 }}>
                      <span style={{ fontFamily:"'Jost',sans-serif" }}>{i.name}</span>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"var(--textMuted)" }}>
                          {fmtn(i.stock)} {i.trackingUnit||i.unit}
                        </span>
                        <Badge s={s2} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:10,
                  fontFamily:"'DM Mono',monospace", fontSize:12 }}>
                  <span style={{ color:"var(--textMuted)" }}>On-hand value</span>
                  <span style={{ color:"var(--gold)", fontWeight:600 }}>{fc(val)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Edit Supplier":"Add Supplier"}>
        <FG><Label>Supplier Name</Label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></FG>
        <FG><Label>Contact / Email</Label><Input value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} /></FG>
        <FG><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></FG>
        <FG><Label>Notes (delivery schedule, lead time, etc.)</Label>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
            rows={3} style={{ background:"var(--surfaceHi)", border:"1px solid var(--border)",
              borderRadius:4, padding:"9px 12px", color:"var(--text)", fontSize:13,
              width:"100%", fontFamily:"'Jost',sans-serif", resize:"vertical" }} />
        </FG>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn onClick={()=>setModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>Save Supplier</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   RECIPES
══════════════════════════════════════════════════════════════════════════════ */

// Common unit conversions — recipeUnit → stockUnit → multiplier
// e.g. if stock is in "lbs" and recipe uses "oz", multiplier = 1/16
export const UNIT_CONVERSIONS = {
  // Weight
  "oz→lbs":   1/16,    "lbs→oz":   16,
  "oz→kg":    1/35.274,"kg→oz":    35.274,
  "lbs→kg":   0.4536,  "kg→lbs":   2.2046,
  "g→lbs":    1/453.6, "lbs→g":    453.6,
  "g→oz":     1/28.35, "oz→g":     28.35,
  "g→kg":     1/1000,  "kg→g":     1000,
  // Volume
  "tsp→oz":   1/6,     "oz→tsp":   6,
  "tbsp→oz":  1/2,     "oz→tbsp":  2,
  "cup→oz":   8,       "oz→cup":   1/8,
  "ml→oz":    1/29.57, "oz→ml":    29.57,
  "L→oz":     33.814,  "oz→L":     1/33.814,
  // Count
  "each→dozen": 1/12,  "dozen→each": 12,
  "each→each":  1,     "dozen→dozen":1,
  "lbs→lbs":    1,     "oz→oz":      1,
  "g→g":        1,     "kg→kg":      1,
};


export default Suppliers;
