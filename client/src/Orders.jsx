import { useState } from "react";
import { status, fc, fmtn, STATUS_COLOR, Badge, Card, SectionTitle, Th, Td, Btn, Input, Select, Label, FG } from "./ui.jsx";

function Orders({ ingredients, suppliers }) {
  const [buffer, setBuffer] = useState(15);
  const [suppFilter, setSuppFilter] = useState("all");
  const [order, setOrder] = useState(null);

  const generate = () => {
    const lines = ingredients
      .filter(i => i.stock < i.par && (suppFilter==="all" || i.supplierId===suppFilter))
      .map(i => {
        const trackUnit  = i.trackingUnit || i.unit || "unit";
        const caseQty    = i.caseQty  || 1;
        const caseCost   = i.caseCost || (i.cost * caseQty);
        const minOrder   = i.minOrderQty || 1;
        const needed     = (i.par - i.stock) * (1 + buffer/100);
        const casesNeeded= Math.max(minOrder, Math.ceil(needed / caseQty));
        const orderQty   = casesNeeded * caseQty;
        const lineTotal  = casesNeeded * caseCost;
        return { ...i, trackUnit, caseQty, caseCost, casesNeeded, orderQty, lineTotal, minOrder };
      });
    setOrder({ lines, date:new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}),
      supplier: suppFilter==="all" ? "All Suppliers" : suppliers.find(s=>s.id===suppFilter)?.name,
      total: lines.reduce((a,l)=>a+l.lineTotal,0) });
  };

  const grouped = order ? order.lines.reduce((acc,l)=>{
    const sup = suppliers.find(s=>s.id===l.supplierId);
    const key = sup?.name || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  },{}) : {};

  return (
    <div className="fade-up">
      <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:16, alignItems:"start" }}>
        {/* Settings */}
        <div>
          <Card>
            <SectionTitle>Order Configuration</SectionTitle>
            <FG><Label>Filter by Supplier</Label>
              <Select value={suppFilter} onChange={e=>setSuppFilter(e.target.value)}>
                <option value="all">All Suppliers</option>
                {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FG>
            <FG><Label>Buffer Stock % (above par)</Label>
              <Input type="number" value={buffer} onChange={e=>setBuffer(+e.target.value)} />
            </FG>
            <Btn variant="primary" onClick={generate} style={{ width:"100%" }}>Generate Purchase Order</Btn>
          </Card>

          <Card>
            <SectionTitle>Items Below Par</SectionTitle>
            {ingredients.filter(i=>i.stock<i.par).map(i=>{
              const s=status(i.stock,i.par);
              const sup=suppliers.find(x=>x.id===i.supplierId);
              return (
                <div key={i.id} style={{ padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12 }}>{i.name}</span>
                    <Badge s={s} />
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textFaint)", marginTop:2 }}>
                    {fmtn(i.stock)}/{i.par} {i.trackingUnit||i.unit} · {sup?.name||"—"}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Generated PO */}
        {order && (
          <div>
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"var(--shell)", marginBottom:4 }}>
                    Purchase Order
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"var(--textMuted)" }}>
                    {order.date} · {order.supplier}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"var(--gold)", fontWeight:700 }}>
                    {fc(order.total)}
                  </div>
                  <Btn onClick={()=>window.print()}>🖨 Print</Btn>
                </div>
              </div>

              {Object.entries(grouped).map(([supName, lines]) => (
                <div key={supName} style={{ marginBottom:24 }}>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, letterSpacing:"0.15em",
                    textTransform:"uppercase", color:"var(--ember)", fontWeight:600,
                    borderBottom:"1px solid var(--emberDim)", paddingBottom:8, marginBottom:12 }}>
                    🔥 {supName}
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr><Th>Item</Th><Th>On Hand</Th><Th>Par</Th><Th>Cases to Order</Th><Th>{"{tracking units}"}</Th><Th right>Case Cost</Th><Th right>Line Total</Th></tr>
                    </thead>
                    <tbody>
                      {lines.map(l=>(
                        <tr key={l.id} className="row-hover">
                          <Td><strong style={{ fontFamily:"'Jost',sans-serif" }}>{l.name}</strong>
                            {l.minOrder > 1 && <div style={{ fontSize:10, color:"var(--textFaint)" }}>min {l.minOrder} {l.orderUnit||"cases"}</div>}
                          </Td>
                          <Td style={{ fontFamily:"'DM Mono',monospace", color:"var(--red)" }}>
                            {fmtn(l.stock)} {l.trackUnit}
                            <div style={{ fontSize:10, color:"var(--textFaint)" }}>{fmtn(l.stock/l.caseQty,2)} {l.orderUnit||"cases"}</div>
                          </Td>
                          <Td muted style={{ fontFamily:"'DM Mono',monospace" }}>
                            {l.par} {l.trackUnit}
                            <div style={{ fontSize:10, color:"var(--textFaint)" }}>{fmtn(l.par/l.caseQty,2)} {l.orderUnit||"cases"}</div>
                          </Td>
                          <Td style={{ fontFamily:"'DM Mono',monospace", color:"var(--emberLt)", fontWeight:700, fontSize:15 }}>
                            {l.casesNeeded} {l.orderUnit||"cases"}
                          </Td>
                          <Td muted style={{ fontFamily:"'DM Mono',monospace", fontSize:11 }}>
                            {fmtn(l.orderQty,1)} {l.trackUnit}
                          </Td>
                          <Td right style={{ fontFamily:"'DM Mono',monospace", color:"var(--gold)" }}>{fc(l.caseCost)}</Td>
                          <Td right style={{ fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{fc(l.lineTotal)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <div style={{ display:"flex", justifyContent:"flex-end", borderTop:"1px solid var(--borderLt)", paddingTop:14 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"var(--gold)", fontWeight:700 }}>
                  Order Total: {fc(order.total)}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   BULK RECEIVE
══════════════════════════════════════════════════════════════════════════════ */

export default Orders;
