import { useState, useEffect, useRef } from "react";
import FontLoader from "./theme.jsx";
import { Flame, Header, Nav } from "./ui.jsx";
import Dashboard   from "./Dashboard.jsx";
import Inventory   from "./Inventory.jsx";
import BulkReceive from "./BulkReceive.jsx";
import Recipes     from "./Recipes.jsx";
import Shrink      from "./Shrink.jsx";
import Orders      from "./Orders.jsx";
import Suppliers   from "./Suppliers.jsx";
import Sales       from "./Sales.jsx";

const SEED_INGREDIENTS = [];
const SEED_MENU        = [];
const SEED_SHRINK      = [];
const SUPPLIERS        = [];

export default function App() {
  const [tab, setTab]               = useState("dashboard");
  const [ingredients, setIngredients] = useState(SEED_INGREDIENTS);
  const [menuItems,   setMenuItems]   = useState(SEED_MENU);
  const [shrinkLog,   setShrinkLog]   = useState(SEED_SHRINK);
  const [suppliers,   setSuppliers]   = useState(SUPPLIERS);
  const [salesLog,    setSalesLog]    = useState([]);
  const [syncing,     setSyncing]     = useState(false);
  const [lastSync,    setLastSync]    = useState(null);
  const [syncRange,   setSyncRange]   = useState(7);
  const [loading,     setLoading]     = useState(true);

  /* ── Load all data on mount ── */
  useEffect(() => {
    Promise.all([
      fetch("/api/ingredients").then(r => r.json()),
      fetch("/api/suppliers").then(r => r.json()),
      fetch("/api/recipes").then(r => r.json()),
      fetch("/api/shrink").then(r => r.json()),
    ]).then(([ings, sups, recipes, shrink]) => {
      setIngredients(ings);
      setSuppliers(sups);
      setMenuItems(recipes);
      setShrinkLog(shrink);
    }).finally(() => setLoading(false));
  }, []);

  const handleSync = (dateRange, deductStock) =>
    squareSync(ingredients, menuItems, setIngredients, setSyncing, setLastSync, setSalesLog, dateRange, deductStock);

  const logout = () =>
    fetch("/api/logout", { method: "POST" }).finally(() => window.location.reload());

  return (
    <div style={{ fontFamily:"'Jost',sans-serif", background:"var(--bg)", color:"var(--text)", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <FontLoader />
      <Header onSync={()=>setTab("sales")} syncing={syncing} lastSync={lastSync} onLogout={logout} />
      <Nav active={tab} setActive={setTab} />

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--textMuted)",
          fontFamily:"'DM Mono',monospace", fontSize:13 }}>
          ⟳ Loading inventory…
        </div>
      ) : (
        <div style={{ flex:1, padding:"24px 28px", maxWidth:1300, width:"100%", margin:"0 auto" }}>
          {tab==="dashboard" && <Dashboard ingredients={ingredients} shrinkLog={shrinkLog} menuItems={menuItems} suppliers={suppliers} onTabChange={setTab} />}
          {tab==="inventory"  && <Inventory  ingredients={ingredients} setIngredients={setIngredients} suppliers={suppliers} />}
          {tab==="receive"    && <BulkReceive ingredients={ingredients} setIngredients={setIngredients} suppliers={suppliers} />}
          {tab==="recipes"    && <Recipes    menuItems={menuItems} setMenuItems={setMenuItems} ingredients={ingredients} setIngredients={setIngredients} />}
          {tab==="shrink"     && <Shrink     shrinkLog={shrinkLog} setShrinkLog={setShrinkLog} ingredients={ingredients} />}
          {tab==="orders"     && <Orders     ingredients={ingredients} suppliers={suppliers} />}
          {tab==="suppliers"  && <Suppliers  suppliers={suppliers} setSuppliers={setSuppliers} ingredients={ingredients} />}
          {tab==="sales"      && <Sales      salesLog={salesLog} menuItems={menuItems} ingredients={ingredients}
                                             onSync={handleSync} syncing={syncing}
                                             syncRange={syncRange} setSyncRange={setSyncRange} />}
        </div>
      )}

      <div style={{ borderTop:"1px solid var(--border)", padding:"12px 28px",
        display:"flex", alignItems:"center", justifyContent:"center", background:"var(--ocean)" }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:12, color:"var(--textMuted)", fontStyle:"italic" }}>
          © Bonfire Oyster Co.
        </span>
      </div>
    </div>
  );
}
