import { useState } from "react";
import { status, fc, fmtn, STATUS_COLOR, Badge, Bar, Stat, Card, SectionTitle, Th, Td, Btn } from "./ui.jsx";

function Dashboard({ ingredients, shrinkLog, menuItems, suppliers, onTabChange }) {
  const alerts     = ingredients.filter(i => ["out","critical","low"].includes(status(i.stock,i.par)));
  const totalVal   = ingredients.reduce((a,i)=>a+i.stock*i.cost, 0);
  const shrinkCost = shrinkLog.reduce((a,s)=>a+s.cost, 0);
  const critCount  = ingredients.filter(i=>["out","critical"].includes(status(i.stock,i.par))).length;
  const isEmpty    = ingredients.length === 0;

  const alertColor = (s) => s==="out"||s==="critical" ? "var(--red)" : "var(--yellow)";
  const alertIcon  = (s) => s==="out" ? "🚨" : s==="critical" ? "⚠️" : "📉";

  if (isEmpty) return (
    <div className="fade-up" style={{ maxWidth:580, margin:"0 auto", paddingTop:32 }}>
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:36, marginBottom:14 }}>🔥</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"var(--shell)", marginBottom:10 }}>
          Welcome to Bonfire Inventory
        </div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:"var(--textMuted)", lineHeight:1.7 }}>
          Complete these three steps to get your dashboard live.
        </div>
      </div>

      {SETUP_STEPS.map((step, idx) => {
        const done = idx===0 ? suppliers.length>0 : idx===1 ? ingredients.length>0 : menuItems.some(m=>m.recipe?.length>0);
        return (
          <div key={step.tab} onClick={()=>onTabChange(step.tab)}
            className="card-hover"
            style={{ background:"var(--surface)", border:`1px solid ${done?"var(--teal)":"var(--border)"}`,
              borderLeft:`3px solid ${done?"var(--teal)":"var(--ember)"}`,
              borderRadius:8, padding:"18px 20px", marginBottom:12, cursor:"pointer",
              display:"flex", alignItems:"center", gap:16, transition:"border-color 0.2s" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
              background: done ? "var(--tealDim)" : "var(--emberDim)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {done
                ? <span style={{ color:"var(--teal)", fontSize:16 }}>✓</span>
                : <span style={{ color:"var(--ember)", fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700 }}>{idx+1}</span>
              }
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:14,
                color: done ? "var(--teal)" : "var(--shell)", marginBottom:3 }}>
                {step.icon} {step.label}
              </div>
              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"var(--textMuted)" }}>
                {step.sub}
              </div>
            </div>
            <div style={{ color:"var(--textFaint)", fontSize:20 }}>›</div>
          </div>
        );
      })}

      <div style={{ marginTop:20, padding:"14px 18px", background:"var(--surfaceHi)",
        border:"1px solid var(--border)", borderRadius:8,
        fontFamily:"'Jost',sans-serif", fontSize:12, color:"var(--textMuted)", lineHeight:1.9 }}>
        💡 Start with <strong style={{ color:"var(--shell)" }}>Suppliers</strong>, then <strong style={{ color:"var(--shell)" }}>Inventory</strong>.
        Once you have ingredients, go to <strong style={{ color:"var(--shell)" }}>Recipes</strong> to link them to your Square menu items.
        After that, <strong style={{ color:"var(--shell)" }}>Pull Square Sales</strong> will auto-deduct stock every time you sync.
      </div>
    </div>
  );

  /* ── Normal dashboard ── */
  return (
    <div className="fade-up">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom:20 }}>
          {alerts.map(i => {
            const s = status(i.stock,i.par);
            const sup = suppliers.find(x=>x.id===i.supplierId);
            return (
              <div key={i.id} style={{
                background:`rgba(${s==="low"?"201,168,60":"217,79,79"},0.08)`,
                border:`1px solid ${alertColor(s)}44`,
                borderLeft:`3px solid ${alertColor(s)}`,
                borderRadius:6, padding:"11px 16px", marginBottom:8,
                display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span>{alertIcon(s)}</span>
                  <div>
                    <span style={{ fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:13 }}>{i.name}</span>
                    <span style={{ color:"var(--textMuted)", fontSize:12, marginLeft:10 }}>
                      {fmtn(i.stock)} / {i.par} {i.trackingUnit||i.unit} on hand
                    </span>
                  </div>
                </div>
                {sup && (
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textMuted)" }}>
                    {sup.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        <Stat label="Low Stock Items"   value={alerts.length}    color="var(--red)"    className="fade-up" />
        <Stat label="Critical / Out"    value={critCount}        color="var(--ember)"  className="fade-up-1" />
        <Stat label="Inventory Value"   value={fc(totalVal)}     color="var(--gold)"   className="fade-up-2" />
        <Stat label="Shrink This Week"  value={fc(shrinkCost)}   color="var(--yellow)" className="fade-up-3" />
      </div>

      {/* Table */}
      <Card>
        <SectionTitle>Inventory Snapshot — All Items</SectionTitle>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <Th>Ingredient</Th><Th>Category</Th><Th>Supplier</Th>
                <Th>On Hand</Th><Th>Par</Th><Th>Level</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {[...ingredients].sort((a,b) => (a.stock/a.par) - (b.stock/b.par)).map(i => {
                const sup = suppliers.find(x=>x.id===i.supplierId);
                const s = status(i.stock, i.par);
                return (
                  <tr key={i.id} className="row-hover">
                    <Td><strong style={{ fontFamily:"'Jost',sans-serif" }}>{i.name}</strong></Td>
                    <Td muted>{i.category}</Td>
                    <Td muted style={{ fontSize:11 }}>{sup?.name||"—"}</Td>
                    <Td style={{ fontFamily:"'DM Mono',monospace", color: STATUS_COLOR[s] }}>{fmtn(i.stock)} {i.trackingUnit||i.unit}</Td>
                    <Td muted style={{ fontFamily:"'DM Mono',monospace" }}>{i.par}</Td>
                    <Td style={{ minWidth:90 }}><Bar stock={i.stock} par={i.par} /></Td>
                    <Td><Badge s={s} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   INVENTORY
══════════════════════════════════════════════════════════════════════════════ */

export default Dashboard;
