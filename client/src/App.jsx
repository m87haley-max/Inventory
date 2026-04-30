export default function App() {
  const [tab, setTab]             = useState("dashboard");
  const [ingredients, setIngredients] = useState(SEED_INGREDIENTS);
  const [menuItems,   setMenuItems]   = useState(SEED_MENU);
  const [shrinkLog,   setShrinkLog]   = useState(SEED_SHRINK);
  const [suppliers,   setSuppliers]   = useState(SUPPLIERS);
  const [salesLog,    setSalesLog]    = useState([]);
  const [syncing,     setSyncing]     = useState(false);
  const [lastSync,    setLastSync]    = useState(null);
  const [syncRange,   setSyncRange]   = useState(7);
  const [cloudStatus, setCloudStatus] = useState("loading");
  const [confirmReset, setConfirmReset] = useState(false);
  const saveTimer = useRef(null);

  /* ── Load from cloud on mount ── */
  useEffect(() => {
    loadFromCloud().then(saved => {
      if (saved) {
        // Only restore if the saved data actually has content
        if (saved.ingredients?.length > 0) setIngredients(saved.ingredients);
        if (saved.menuItems?.length   > 0) setMenuItems(saved.menuItems);
        if (saved.shrinkLog?.length   > 0) setShrinkLog(saved.shrinkLog);
        if (saved.suppliers?.length   > 0) setSuppliers(saved.suppliers);
        if (saved.salesLog?.length    > 0) setSalesLog(saved.salesLog);
        if (saved.lastSync)                setLastSync(saved.lastSync);
      }
      setCloudStatus("synced");
    }).catch(() => setCloudStatus("error"));
  }, []);

  /* ── Auto-save whenever data changes (debounced 1.5s) ── */
  useEffect(() => {
    if (cloudStatus === "loading") return;
    clearTimeout(saveTimer.current);
    setCloudStatus("saving");
    saveTimer.current = setTimeout(() => {
      saveToCloud({ ingredients, menuItems, shrinkLog, suppliers, salesLog, lastSync })
        .then(() => setCloudStatus("synced"))
        .catch(() => setCloudStatus("error"));
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [ingredients, menuItems, shrinkLog, suppliers, salesLog, lastSync]);

  /* ── Hard reset — wipes cloud and resets all state to empty ── */
  const resetAllData = async () => {
    setIngredients([]);
    setMenuItems(SEED_MENU); // keep Square menu items, just clear ingredients/suppliers/shrink
    setShrinkLog([]);
    setSuppliers([]);
    setSalesLog([]);
    setLastSync(null);
    try { await window.storage.delete(STORE_KEY, true); } catch(_) {}
    setConfirmReset(false);
    setCloudStatus("synced");
    setTab("dashboard");
  };

  const handleSync = (dateRange, deductStock) =>
    squareSync(ingredients, menuItems, setIngredients, setSyncing, setLastSync, setSalesLog, dateRange, deductStock);

  const cloudDot = {
    loading: { color:"var(--textMuted)", label:"Loading…"   },
    saving:  { color:"var(--yellow)",    label:"Saving…"    },
    synced:  { color:"var(--teal)",      label:"Saved"      },
    error:   { color:"var(--red)",       label:"Save error" },
  }[cloudStatus];

  return (
    <div style={{ fontFamily:"'Jost',sans-serif", background:"var(--bg)", color:"var(--text)", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <FontLoader />
      <Header onSync={()=>setTab("sales")} syncing={syncing} lastSync={lastSync} cloudDot={cloudDot} />
      <Nav active={tab} setActive={setTab} />

      {cloudStatus === "loading" && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--textMuted)",
          fontFamily:"'DM Mono',monospace", fontSize:13 }}>
          ⟳ Loading your inventory from the cloud…
        </div>
      )}

      {cloudStatus !== "loading" && (
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
        display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--ocean)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Flame size={14} />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:12, color:"var(--textMuted)", fontStyle:"italic" }}>
            Bonfire Oyster Co. · 970-234-0500 · Events@bonfireoysterco.com
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* Cloud status */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:cloudDot.color }} />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"var(--textMuted)" }}>
              {cloudDot.label}
            </span>
          </div>
          {/* Reset button — two step */}
          {confirmReset ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:"var(--red)" }}>
                Wipe all data?
              </span>
              <button onClick={resetAllData} style={{
                padding:"4px 12px", borderRadius:4, fontSize:11, fontWeight:700,
                cursor:"pointer", border:"1px solid var(--red)",
                background:"var(--red)", color:"#fff", fontFamily:"'Jost',sans-serif" }}>
                Yes, Reset
              </button>
              <button onClick={()=>setConfirmReset(false)} style={{
                padding:"4px 10px", borderRadius:4, fontSize:11,
                cursor:"pointer", border:"1px solid var(--border)",
                background:"var(--surfaceHi)", color:"var(--textMuted)", fontFamily:"'Jost',sans-serif" }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={()=>setConfirmReset(true)} style={{
              padding:"4px 10px", borderRadius:4, fontSize:10,
              cursor:"pointer", border:"1px solid var(--border)",
              background:"none", color:"var(--textFaint)", fontFamily:"'DM Mono',monospace",
              letterSpacing:"0.05em" }}>
              reset data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
