/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const status = (stock, par) => {
  if (!par) return "ok";
  const r = stock / par;
  if (r <= 0)    return "out";
  if (r < 0.25)  return "critical";
  if (r < 0.5)   return "low";
  if (r > 1.15)  return "over";
  return "ok";
};
const STATUS_COLOR = { out:"var(--red)", critical:"var(--red)", low:"var(--yellow)", ok:"var(--teal)", over:"var(--ember)" };
const STATUS_BG    = { out:"var(--redDim)", critical:"var(--redDim)", low:"var(--yellowDim)", ok:"var(--tealDim)", over:"var(--emberDim)" };
const STATUS_LABEL = { out:"OUT", critical:"CRITICAL", low:"LOW", ok:"OK", over:"OVER PAR" };

const fc  = (n) => `$${Number(n||0).toFixed(2)}`;
const fmtn = (n, d=1) => Number(n||0).toFixed(d);

const Badge = ({ s }) => (
  <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:2, fontSize:10,
    letterSpacing:"0.1em", fontWeight:700, background:STATUS_BG[s], color:STATUS_COLOR[s] }}>
    {STATUS_LABEL[s]}
  </span>
);

const Bar = ({ stock, par }) => {
  const s = status(stock, par);
  const w = Math.min((stock / (par||1)) * 100, 100);
  return (
    <div style={{ height:3, background:"var(--border)", borderRadius:2, minWidth:80, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, height:"100%", width:`${w}%`,
        background: STATUS_COLOR[s], borderRadius:2, transition:"width 0.4s" }} />
    </div>
  );
};

/* ─── Flame icon ─────────────────────────────────────────────────────────────── */
const Flame = ({ size=18, color="var(--ember)" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C9 7 6 9 6 14a6 6 0 0012 0c0-3-1.5-5-2-7-1 2-2 3-4 3 0-3 0-6 0-8z"/>
  </svg>
);
const Shell = ({ size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--textMuted)">
    <path d="M12 3C7 3 3 7.5 3 13s3 8 9 8 9-2 9-8S17 3 12 3zm0 14c-4 0-7-2-7-4s1-3 3-4l1 3c1-1 2-3 3-4 1 1 2 3 3 4l1-3c2 1 3 2 3 4s-3 4-7 4z"/>
  </svg>
);

/* ─── Layout primitives ─────────────────────────────────────────────────────── */
const Card = ({ children, style={}, className="" }) => (
  <div className={`card-hover ${className}`} style={{
    background:"var(--surface)", border:"1px solid var(--border)",
    borderRadius:8, padding:20, marginBottom:16, ...style
  }}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, letterSpacing:"0.18em",
    textTransform:"uppercase", color:"var(--textMuted)", fontWeight:600, marginBottom:16 }}>
    {children}
  </div>
);

const Th = ({ children, right }) => (
  <th style={{ textAlign: right ? "right" : "left", padding:"8px 12px", fontSize:9,
    letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--textMuted)",
    borderBottom:"1px solid var(--border)", fontFamily:"'Jost',sans-serif", fontWeight:600,
    whiteSpace:"nowrap" }}>
    {children}
  </th>
);
const Td = ({ children, right, muted, style={} }) => (
  <td style={{ padding:"10px 12px", borderBottom:"1px solid var(--border)",
    color: muted ? "var(--textMuted)" : "var(--text)",
    textAlign: right ? "right" : "left", fontSize:13, ...style }}>
    {children}
  </td>
);

const Btn = ({ children, onClick, variant="ghost", small, disabled, style={} }) => {
  const bg = variant==="primary" ? "var(--ember)" : variant==="danger" ? "var(--red)" : variant==="gold" ? "var(--gold)" : "var(--surfaceHi)";
  const col = (variant==="ghost") ? "var(--text)" : "#fff";
  return (
    <button className="btn-hover" onClick={onClick} disabled={disabled} style={{
      padding: small ? "5px 12px" : "9px 18px",
      borderRadius:4, fontSize: small ? 11 : 12, fontWeight:600,
      letterSpacing:"0.05em", cursor:"pointer", border:"1px solid var(--borderLt)",
      background: bg, color: col, fontFamily:"'Jost',sans-serif",
      opacity: disabled ? 0.5 : 1, ...style
    }}>{children}</button>
  );
};

const Input = ({ style={}, ...props }) => (
  <input style={{ background:"var(--surfaceHi)", border:"1px solid var(--border)",
    borderRadius:4, padding:"9px 12px", color:"var(--text)", fontSize:13,
    width:"100%", fontFamily:"'DM Mono',monospace", ...style }} {...props} />
);
const Select = ({ children, style={}, ...props }) => (
  <select style={{ background:"var(--surfaceHi)", border:"1px solid var(--border)",
    borderRadius:4, padding:"9px 12px", color:"var(--text)", fontSize:13,
    width:"100%", fontFamily:"'Jost',sans-serif", cursor:"pointer", ...style }} {...props}>
    {children}
  </select>
);
const Label = ({ children }) => (
  <label style={{ display:"block", marginBottom:6, fontSize:10, letterSpacing:"0.12em",
    textTransform:"uppercase", color:"var(--textMuted)", fontFamily:"'Jost',sans-serif", fontWeight:600 }}>
    {children}
  </label>
);
const FG = ({ children, half }) => (
  <div style={{ marginBottom:14, ...(half ? {} : {}) }}>{children}</div>
);

/* ─── Modal ──────────────────────────────────────────────────────────────────── */
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} className="fade-up" style={{
        background:"var(--deep)", border:"1px solid var(--borderLt)",
        borderRadius:10, padding:28, width:"100%", maxWidth:520, maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"var(--shell)" }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--textMuted)",
            cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ─── Header ─────────────────────────────────────────────────────────────────── */
const Header = ({ onSync, syncing, lastSync, onLogout }) => (
  <div style={{ background:"var(--ocean)", borderBottom:"1px solid var(--border)",
    padding:"0 28px", display:"flex", alignItems:"center", height:60, gap:16, flexShrink:0,
    position:"sticky", top:0, zIndex:100, backdropFilter:"blur(8px)" }}>

    {/* Flame decoration */}
    <div style={{ display:"flex", alignItems:"center", gap:2 }}>
      <Flame size={20} color="var(--ember)" />
    </div>

    {/* Brand */}
    <div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:600,
        color:"var(--shell)", letterSpacing:"0.02em", lineHeight:1 }}>
        Bonfire Oyster Co.
      </div>
      <div style={{ fontFamily:"'Jost',sans-serif", fontSize:9, letterSpacing:"0.2em",
        textTransform:"uppercase", color:"var(--textMuted)", marginTop:1 }}>
        Inventory & Ordering
      </div>
    </div>

    <div style={{ width:1, height:28, background:"var(--border)", marginLeft:8 }} />

    {/* Square sync */}
    <div style={{ display:"flex", alignItems:"center", gap:12, marginLeft:"auto" }}>
      {lastSync && (
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textMuted)" }}>
          Synced {lastSync}
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--teal)",
          animation:"pulse 2s infinite" }} />
        <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:"var(--teal)", fontWeight:500 }}>
          Square Live
        </span>
      </div>
      <button className="btn-hover" onClick={onSync} disabled={syncing} style={{
        background: syncing ? "var(--surfaceHi)" : "var(--ember)",
        border:"none", borderRadius:5, padding:"7px 16px", color:"#fff",
        fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:600,
        letterSpacing:"0.05em", cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
        {syncing ? "⟳ Syncing…" : "⬇ Pull Square Sales"}
      </button>
      <button className="btn-hover" onClick={onLogout} style={{
        background:"none", border:"1px solid var(--borderLt)", borderRadius:5,
        padding:"7px 14px", color:"var(--textMuted)", fontFamily:"'Jost',sans-serif",
        fontSize:11, fontWeight:600, letterSpacing:"0.05em", cursor:"pointer" }}>
        Log out
      </button>
    </div>
  </div>
);

/* ─── Nav ────────────────────────────────────────────────────────────────────── */
const NAV = [
  { id:"dashboard", icon:"◈", label:"Dashboard" },
  { id:"inventory",  icon:"◻", label:"Inventory"  },
  { id:"receive",    icon:"⬇", label:"Receive"     },
  { id:"recipes",    icon:"◆", label:"Recipes"     },
  { id:"shrink",     icon:"△", label:"Shrink"      },
  { id:"orders",     icon:"◎", label:"Orders"      },
  { id:"suppliers",  icon:"◉", label:"Suppliers"   },
  { id:"sales",      icon:"◐", label:"Sales Sync"  },
];

const Nav = ({ active, setActive }) => (
  <div style={{ background:"var(--ocean)", borderBottom:"1px solid var(--border)",
    display:"flex", padding:"0 20px", overflowX:"auto", flexShrink:0 }}>
    {NAV.map(t => (
      <button key={t.id} className="tab-btn" onClick={() => setActive(t.id)} style={{
        padding:"11px 16px", fontSize:10, letterSpacing:"0.12em", fontWeight:600,
        textTransform:"uppercase", cursor:"pointer", fontFamily:"'Jost',sans-serif",
        color: active===t.id ? "var(--emberLt)" : "var(--textMuted)",
        borderBottom: active===t.id ? "2px solid var(--ember)" : "2px solid transparent",
        background:"none", border:"none",
        borderBottom: active===t.id ? "2px solid var(--ember)" : "2px solid transparent",
        whiteSpace:"nowrap", gap:6, display:"flex", alignItems:"center",
      }}>
        <span style={{ fontSize:12 }}>{t.icon}</span> {t.label}
      </button>
    ))}
  </div>
);

/* ─── Stat Card ──────────────────────────────────────────────────────────────── */
const Stat = ({ label, value, color, sub, className="" }) => (
  <div className={`card-hover ${className}`} style={{
    background:"var(--surface)", border:"1px solid var(--border)",
    borderLeft:`3px solid ${color}`, borderRadius:8, padding:"18px 20px" }}>
    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700,
      color: color, lineHeight:1, marginBottom:4 }}>{value}</div>
    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:9, letterSpacing:"0.15em",
      textTransform:"uppercase", color:"var(--textMuted)", fontWeight:600 }}>{label}</div>
    {sub && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textFaint)", marginTop:4 }}>{sub}</div>}
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
const SETUP_STEPS = [
  { tab:"suppliers", icon:"◉", label:"Add your suppliers", sub:"The farms, distributors, and vendors you order from." },
  { tab:"inventory", icon:"◻", label:"Add your ingredients", sub:"Everything you stock and reorder — oysters, proteins, sauces, garnishes." },
  { tab:"recipes",   icon:"◆", label:"Map recipes to menu items", sub:"Link each Square item to the ingredients it uses so sales auto-deduct stock." },
];

export {
  status, STATUS_COLOR, STATUS_BG, STATUS_LABEL,
  fc, fmtn,
  Badge, Bar, Flame, Shell,
  Card, SectionTitle, Th, Td,
  Btn, Input, Select, Label, FG,
  Modal, Header, Nav, Stat,
  SETUP_STEPS,
};
