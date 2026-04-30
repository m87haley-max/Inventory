import { useState } from "react";
import { fc, fmtn, Card, SectionTitle, Th, Td, Btn, Input, Select, Label, FG } from "./ui.jsx";

function Shrink({ shrinkLog, setShrinkLog, ingredients }) {
  const REASONS = ["Spoilage","Spillage","Temp abuse","Expired","Trim/yield loss","Theft","Other"];
  const blank = { date:new Date().toISOString().slice(0,10), ingredientId:ingredients[0]?.id||"", qty:"", reason:"Spoilage" };
  const [form, setForm] = useState(blank);

  const add = () => {
    const ing = ingredients.find(i=>i.id===form.ingredientId);
    const costAmt = ing ? ing.cost * (+form.qty) : 0;
    setShrinkLog(p=>[{ ...form, qty:+form.qty, cost:costAmt, id:`sh${Date.now()}` }, ...p]);
    setForm(f=>({...f, qty:""}));
  };

  const total     = shrinkLog.reduce((a,s)=>a+s.cost,0);
  const byReason  = REASONS.map(r=>({ r, cost:shrinkLog.filter(s=>s.reason===r).reduce((a,s)=>a+s.cost,0) })).filter(x=>x.cost>0);

  return (
    <div className="fade-up">
      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:16, alignItems:"start" }}>
        {/* Left column */}
        <div>
          <Card>
            <SectionTitle>Log Shrink / Waste Event</SectionTitle>
            <FG><Label>Date</Label><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></FG>
            <FG><Label>Ingredient</Label>
              <Select value={form.ingredientId} onChange={e=>setForm(f=>({...f,ingredientId:e.target.value}))}>
                {ingredients.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}
              </Select>
            </FG>
            <FG><Label>Quantity Lost</Label><Input type="number" value={form.qty} placeholder="e.g. 2" onChange={e=>setForm(f=>({...f,qty:e.target.value}))} /></FG>
            <FG><Label>Reason</Label>
              <Select value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}>
                {REASONS.map(r=><option key={r}>{r}</option>)}
              </Select>
            </FG>
            <Btn variant="primary" onClick={add} style={{ width:"100%" }}>Log Event</Btn>
          </Card>

          <Card>
            <SectionTitle>Shrink by Reason</SectionTitle>
            {byReason.map(x=>(
              <div key={x.r} style={{ display:"flex", justifyContent:"space-between",
                padding:"8px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                <span style={{ fontFamily:"'Jost',sans-serif" }}>{x.r}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", color:"var(--red)" }}>{fc(x.cost)}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0",
              fontFamily:"'Playfair Display',serif", fontSize:16 }}>
              <span>Total Lost</span>
              <span style={{ color:"var(--red)", fontWeight:700 }}>{fc(total)}</span>
            </div>
          </Card>
        </div>

        {/* Right: log */}
        <Card>
          <SectionTitle>Shrink Log</SectionTitle>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr><Th>Date</Th><Th>Ingredient</Th><Th>Qty</Th><Th>Reason</Th><Th right>Cost Lost</Th></tr>
              </thead>
              <tbody>
                {shrinkLog.map(s=>{
                  const ing=ingredients.find(i=>i.id===s.ingredientId);
                  return (
                    <tr key={s.id} className="row-hover">
                      <Td muted style={{ fontFamily:"'DM Mono',monospace", fontSize:11 }}>{s.date}</Td>
                      <Td style={{ fontFamily:"'Jost',sans-serif" }}>{ing?.name||"?"}</Td>
                      <Td style={{ fontFamily:"'DM Mono',monospace" }}>{s.qty} {ing?.unit}</Td>
                      <Td muted>{s.reason}</Td>
                      <Td right style={{ fontFamily:"'DM Mono',monospace", color:"var(--red)", fontWeight:600 }}>{fc(s.cost)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PURCHASE ORDERS
══════════════════════════════════════════════════════════════════════════════ */

export default Shrink;
