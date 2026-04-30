import { useState, useEffect } from "react";
import FontLoader from "./theme.jsx";
import { Header, Nav } from "./ui.jsx";
import Dashboard   from "./Dashboard.jsx";
import Inventory   from "./Inventory.jsx";
import BulkReceive from "./BulkReceive.jsx";
import Recipes     from "./Recipes.jsx";
import Shrink      from "./Shrink.jsx";
import Orders      from "./Orders.jsx";
import Suppliers   from "./Suppliers.jsx";
import Sales       from "./Sales.jsx";

const J = (r) => r.json().then(j => j.data);
const POST  = (url, body) => fetch(url, { method:'POST',   headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
const PUT   = (url, body) => fetch(url, { method:'PUT',    headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
const DEL   = (url)       => fetch(url, { method:'DELETE' });
const PATCH = (url, body) => fetch(url, { method:'PATCH',  headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });

export default function App() {
  const [tab, setTab]               = useState("dashboard");
  const [ingredients, setIngredients] = useState([]);
  const [menuItems,   setMenuItems]   = useState([]);
  const [shrinkLog,   setShrinkLog]   = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [salesLog,    setSalesLog]    = useState([]);
  const [syncing,     setSyncing]     = useState(false);
  const [lastSync,    setLastSync]    = useState(null);
  const [syncRange,   setSyncRange]   = useState(7);
  const [loading,     setLoading]     = useState(true);
  const [apiError,    setApiError]    = useState(null);

  const clearError = () => setApiError(null);
  const withError  = async (fn) => { try { return await fn(); } catch (e) { setApiError(e.message || String(e)); throw e; } };

  /* ── Refetch helpers ── */
  const refetchIngredients = () => fetch('/api/ingredients').then(J).then(setIngredients);
  const refetchSuppliers   = () => fetch('/api/suppliers').then(J).then(setSuppliers);
  const refetchRecipes     = () => fetch('/api/recipes').then(J).then(setMenuItems);
  const refetchShrink      = () => fetch('/api/shrink').then(J).then(setShrinkLog);
  const refetchSalesLatest = () => fetch('/api/square/sync/latest').then(J).then(setSalesLog);

  /* ── Load all data on mount ── */
  useEffect(() => {
    Promise.all([
      refetchIngredients(),
      refetchSuppliers(),
      refetchRecipes(),
      refetchShrink(),
    ]).catch(e => setApiError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, []);

  /* ── Ingredients ── */
  const saveIngredient = (form, id) => withError(async () => {
    await (id ? PUT(`/api/ingredients/${id}`, form) : POST('/api/ingredients', form));
    await refetchIngredients();
  });
  const deleteIngredient = (id) => withError(async () => {
    await DEL(`/api/ingredients/${id}`);
    await refetchIngredients();
  });
  const adjustStock = (id, delta) => withError(async () => {
    await PATCH(`/api/ingredients/${id}/stock`, { delta });
    await refetchIngredients();
  });
  const receiveDelivery = (items) => withError(async () => {
    await Promise.all(items.map(({ id, delta }) => PATCH(`/api/ingredients/${id}/stock`, { delta })));
    await refetchIngredients();
  });

  /* ── Suppliers ── */
  const saveSupplier = (form, id) => withError(async () => {
    await (id ? PUT(`/api/suppliers/${id}`, form) : POST('/api/suppliers', form));
    await refetchSuppliers();
  });
  const deleteSupplier = (id) => withError(async () => {
    await DEL(`/api/suppliers/${id}`);
    await refetchSuppliers();
  });

  /* ── Recipes ── */
  const saveRecipe = (form, id) => withError(async () => {
    await (id ? PUT(`/api/recipes/${id}`, form) : POST('/api/recipes', form));
    await refetchRecipes();
  });
  const deleteRecipe = (id) => withError(async () => {
    await DEL(`/api/recipes/${id}`);
    await refetchRecipes();
  });
  const addIngredientFromRecipes = (ing) => withError(async () => {
    const newIng = await POST('/api/ingredients', ing).then(J);
    await refetchIngredients();
    return newIng;
  });

  /* ── Shrink ── */
  const addShrink = (entry) => withError(async () => {
    await POST('/api/shrink', entry);
    await refetchShrink();
  });

  /* ── Square sync ── */
  const handleSync = async (dateRange, deductStock) => {
    setSyncing(true);
    clearError();
    try {
      const res = await POST('/api/square/sync', {
        start_date:   dateRange.start,
        end_date:     dateRange.end,
        deduct_stock: deductStock,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Square sync failed (${res.status})`);
      setSalesLog(json.data.sales || []);
      const now = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      setLastSync(`${dateRange.start} → ${dateRange.end} @ ${now}`);
      await Promise.all([
        refetchIngredients(),
        refetchSalesLatest(),
      ]);
    } catch (e) {
      setApiError(e.message || String(e));
    }
    setSyncing(false);
  };

  const logout = () =>
    fetch("/api/logout", { method: "POST" }).finally(() => window.location.reload());

  return (
    <div style={{ fontFamily:"'Jost',sans-serif", background:"var(--bg)", color:"var(--text)", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <FontLoader />
      <Header onSync={()=>setTab("sales")} syncing={syncing} lastSync={lastSync} onLogout={logout} />
      <Nav active={tab} setActive={setTab} />

      {/* Global error banner */}
      {apiError && (
        <div style={{
          background:"rgba(217,79,79,0.12)", borderBottom:"1px solid var(--red)",
          padding:"10px 28px", display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"var(--red)" }}>
            ⚠ {apiError}
          </span>
          <button onClick={clearError} style={{
            background:"none", border:"none", color:"var(--red)", cursor:"pointer", fontSize:16, lineHeight:1,
          }}>×</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--textMuted)",
          fontFamily:"'DM Mono',monospace", fontSize:13 }}>
          ⟳ Loading inventory…
        </div>
      ) : (
        <div style={{ flex:1, padding:"24px 28px", maxWidth:1300, width:"100%", margin:"0 auto" }}>
          {tab==="dashboard" && <Dashboard   ingredients={ingredients} shrinkLog={shrinkLog} menuItems={menuItems} suppliers={suppliers} onTabChange={setTab} />}
          {tab==="inventory"  && <Inventory  ingredients={ingredients} suppliers={suppliers}
                                             onSave={saveIngredient} onDelete={deleteIngredient} onAdjust={adjustStock} />}
          {tab==="receive"    && <BulkReceive ingredients={ingredients} suppliers={suppliers} onReceive={receiveDelivery} />}
          {tab==="recipes"    && <Recipes    menuItems={menuItems} ingredients={ingredients}
                                             onSave={saveRecipe} onDelete={deleteRecipe} onAddIngredient={addIngredientFromRecipes} />}
          {tab==="shrink"     && <Shrink     shrinkLog={shrinkLog} ingredients={ingredients} onAdd={addShrink} />}
          {tab==="orders"     && <Orders     ingredients={ingredients} suppliers={suppliers} />}
          {tab==="suppliers"  && <Suppliers  suppliers={suppliers} ingredients={ingredients}
                                             onSave={saveSupplier} onDelete={deleteSupplier} />}
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
