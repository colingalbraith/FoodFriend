import { useState, useEffect, useCallback } from "react";
import { TABS } from "./constants/categories";
import { STORAGE_KEYS } from "./constants/storage";
import { daysUntil } from "./utils/dateHelpers";
import { globalStyles } from "./styles/global";
import FridgeTab from "./components/fridge/FridgeTab";
import MealPlanTab from "./components/meals/MealPlanTab";
import ShoppingTab from "./components/shopping/ShoppingTab";
import ChefTab from "./components/chef/ChefTab";

const TAB_ICONS = {
  fridge: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="4" y1="10" x2="20" y2="10" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="15" y1="14" x2="15" y2="14.01" />
    </svg>
  ),
  meals: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="9" y1="4" x2="9" y2="10" /><line x1="15" y1="4" x2="15" y2="10" />
    </svg>
  ),
  shopping: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  chef: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a4 4 0 0 0-4 4c0 .5.1 1 .3 1.4A3.5 3.5 0 0 0 5 12a3.5 3.5 0 0 0 3 3.5V20h8v-4.5a3.5 3.5 0 0 0 3-3.5 3.5 3.5 0 0 0-3.3-3.6c.2-.4.3-.9.3-1.4a4 4 0 0 0-4-4z" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  ),
};

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
      <div className="app-shell" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: "center" }}>
          <div className="loading-dots" style={{ marginBottom: 16 }}>
            <span /><span /><span />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Opening your fridge...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{globalStyles}</style>

      {/* Scrollable content area */}
      <div className="app-content">
        {/* Header */}
        <header className="app-header">
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Fridge Friend
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              {items.length} items{expiringSoon > 0 && ` · ${expiringSoon} expiring soon`}{expired > 0 && ` · ${expired} expired`}
            </p>
          </div>
        </header>

        {/* Alerts */}
        <div className="app-alerts">
          {(expiringSoon > 0 || expired > 0) && tab === "fridge" && (
            <div className="alert-banner" style={{
              background: expired > 0 ? "linear-gradient(135deg,#fde8e8,#fdd)" : "linear-gradient(135deg,#fef3e2,#fde8c8)",
              borderColor: expired > 0 ? "#f0a0a0" : "#f0c78a",
            }}>
              <div className="alert-dot" style={{ background: expired > 0 ? "#c0392b" : "#e67e22" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: expired > 0 ? "#8b3030" : "#8b6d30" }}>
                {expired > 0 && `${expired} expired · `}{expiringSoon > 0 && `${expiringSoon} expiring soon`}
                {" — "}use them or lose them!
              </span>
            </div>
          )}

          {lowStockItems.length > 0 && tab === "fridge" && (
            <div className="alert-banner" style={{
              background: "linear-gradient(135deg,#e8f0fe,#dde8fa)",
              borderColor: "#a8c4e8",
            }}>
              <div className="alert-dot" style={{ background: "#3a6090" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#3a6090" }}>
                Running low: {lowStockItems.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Tab content */}
        <main className="app-main">
          {tab === "fridge" && <FridgeTab items={items} saveItems={saveItems} lowStockItems={lowStockItems} saveLowStock={saveLowStock} staples={staples} saveStaples={saveStaples} />}
          {tab === "meals" && <MealPlanTab meals={meals} saveMeals={saveMeals} items={items} />}
          {tab === "shopping" && <ShoppingTab list={shopping} saveList={saveShopping} items={items} />}
          {tab === "chef" && <ChefTab items={items} saveMeals={saveMeals} meals={meals} />}
        </main>
      </div>

      {/* Bottom tab bar */}
      <nav className="bottom-nav">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              className={`bottom-nav-btn ${active ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <div className="bottom-nav-icon">
                {TAB_ICONS[t.id](active)}
              </div>
              <span className="bottom-nav-label">{t.label}</span>
              {active && <div className="bottom-nav-indicator" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
