import { useState, useEffect, useCallback } from "react";
import { TABS } from "./constants/categories";
import { STORAGE_KEYS } from "./constants/storage";
import { daysUntil } from "./utils/dateHelpers";
import { globalStyles } from "./styles/global";
import FridgeTab from "./components/fridge/FridgeTab";
import MealPlanTab from "./components/meals/MealPlanTab";
import ShoppingTab from "./components/shopping/ShoppingTab";
import ChefTab from "./components/chef/ChefTab";

export default function FridgeFriend() {
  const [tab, setTab] = useState("fridge");
  const [items, setItems] = useState([]);
  const [meals, setMeals] = useState({});
  const [shopping, setShopping] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [staples, setStaples] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [a, b, c, d, e] = await Promise.all([
          window.storage.get(STORAGE_KEYS.items).catch(() => null),
          window.storage.get(STORAGE_KEYS.meals).catch(() => null),
          window.storage.get(STORAGE_KEYS.shopping).catch(() => null),
          window.storage.get(STORAGE_KEYS.lowStock).catch(() => null),
          window.storage.get(STORAGE_KEYS.staples).catch(() => null),
        ]);
        if (a?.value) setItems(JSON.parse(a.value));
        if (b?.value) setMeals(JSON.parse(b.value));
        if (c?.value) setShopping(JSON.parse(c.value));
        if (d?.value) setLowStockItems(JSON.parse(d.value));
        if (e?.value) setStaples(JSON.parse(e.value));
      } catch (e) { console.error(e); }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback((key, setter) => async (val) => {
    setter(val);
    try { await window.storage.set(key, JSON.stringify(val)); } catch {}
  }, []);

  const saveItems = save(STORAGE_KEYS.items, setItems);
  const saveMeals = save(STORAGE_KEYS.meals, setMeals);
  const saveShopping = save(STORAGE_KEYS.shopping, setShopping);
  const saveLowStock = save(STORAGE_KEYS.lowStock, setLowStockItems);
  const saveStaples = save(STORAGE_KEYS.staples, setStaples);

  const expiringSoon = items.filter(i => { const d = daysUntil(i.expiry); return d >= 0 && d <= 3; }).length;
  const expired = items.filter(i => daysUntil(i.expiry) < 0).length;

  if (!loaded) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", fontFamily: "var(--body)", color: "var(--text)", fontSize: 18,
      }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: "center" }}>
          <div className="loading-dots" style={{ marginBottom: 16 }}>
            <span /><span /><span />
          </div>
          Opening your fridge...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--body)", color: "var(--text)" }}>
      <style>{globalStyles}</style>

      {/* Header */}
      <header style={{ padding: "20px 20px 0", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Fridge Friend
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              {items.length} items{expiringSoon > 0 && ` · ${expiringSoon} expiring soon`}{expired > 0 && ` · ${expired} expired`}
            </p>
          </div>
        </div>

        {/* Expiry alert */}
        {(expiringSoon > 0 || expired > 0) && tab === "fridge" && (
          <div style={{
            marginTop: 12, background: expired > 0 ? "linear-gradient(135deg,#fde8e8,#fdd)" : "linear-gradient(135deg,#fef3e2,#fde8c8)",
            border: `2px solid ${expired > 0 ? "#f0a0a0" : "#f0c78a"}`, borderRadius: 14,
            padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
            animation: "popIn 0.4s ease-out",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: expired > 0 ? "#c0392b" : "#e67e22", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: expired > 0 ? "#8b3030" : "#8b6d30" }}>
              {expired > 0 && `${expired} expired · `}{expiringSoon > 0 && `${expiringSoon} expiring soon`}
              {" — "}use them or lose them!
            </span>
          </div>
        )}

        {/* Low stock alerts */}
        {lowStockItems.length > 0 && tab === "fridge" && (
          <div style={{
            marginTop: 8, background: "linear-gradient(135deg,#e8f0fe,#dde8fa)",
            border: "2px solid #a8c4e8", borderRadius: 14,
            padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
            animation: "fadeIn 0.4s ease-out",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3a6090", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3a6090" }}>
              Running low: {lowStockItems.join(", ")}
            </span>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginTop: 14, background: "rgba(228,213,183,0.3)", borderRadius: 16, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: "16px 20px 120px", maxWidth: 520, margin: "0 auto" }}>
        {tab === "fridge" && <FridgeTab items={items} saveItems={saveItems} lowStockItems={lowStockItems} saveLowStock={saveLowStock} staples={staples} saveStaples={saveStaples} />}
        {tab === "meals" && <MealPlanTab meals={meals} saveMeals={saveMeals} items={items} />}
        {tab === "shopping" && <ShoppingTab list={shopping} saveList={saveShopping} items={items} />}
        {tab === "chef" && <ChefTab items={items} saveMeals={saveMeals} meals={meals} />}
      </main>
    </div>
  );
}
