import { useState, useEffect, useCallback, useMemo } from "react";
import { TABS } from "./constants/categories";
import { STORAGE_KEYS, DEFAULT_RECIPES } from "./constants/storage";
import { daysUntil } from "./utils/dateHelpers";
import { globalStyles } from "./styles/global";
import FridgeTab from "./components/fridge/FridgeTab";
import MealPlanTab from "./components/meals/MealPlanTab";
import OverviewTab from "./components/overview/OverviewTab";
import GymTab from "./components/gym/GymTab";
import StatsTab from "./components/stats/StatsTab";
import SettingsTab from "./components/settings/SettingsTab";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Toast from "./components/ui/Toast";
import Onboarding from "./components/onboarding/Onboarding";
import Walkthrough from "./components/onboarding/Walkthrough";

const TAB_ICONS = {
  fridge: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="4" y1="10" x2="20" y2="10" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="15" y1="14" x2="15" y2="14.01" />
    </svg>
  ),
  overview: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  meals: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="9" y1="4" x2="9" y2="10" /><line x1="15" y1="4" x2="15" y2="10" />
    </svg>
  ),
  gym: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5a2 2 0 0 1 3 0V17.5a2 2 0 0 1-3 0zM14.5 6.5a2 2 0 0 1 3 0V17.5a2 2 0 0 1-3 0z" />
      <line x1="9.5" y1="12" x2="14.5" y2="12" />
      <line x1="2" y1="10" x2="6.5" y2="10" /><line x1="2" y1="14" x2="6.5" y2="14" />
      <line x1="17.5" y1="10" x2="22" y2="10" /><line x1="17.5" y1="14" x2="22" y2="14" />
    </svg>
  ),
  settings: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--text)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
  const [userRecipes, setUserRecipes] = useState([]);
  const [recurring, setRecurring] = useState({});
  const [macroLog, setMacroLog] = useState([]);
  const [macroGoals, setMacroGoals] = useState(null);
  const [gymLog, setGymLog] = useState([]);
  const [bodyWeight, setBodyWeight] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [toast, setToast] = useState(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showToast = useCallback((message, undoFn) => {
    setToast({ message, undoFn, key: Date.now() });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.all([
          window.storage.get(STORAGE_KEYS.items).catch(() => null),
          window.storage.get(STORAGE_KEYS.meals).catch(() => null),
          window.storage.get(STORAGE_KEYS.shopping).catch(() => null),
          window.storage.get(STORAGE_KEYS.lowStock).catch(() => null),
          window.storage.get(STORAGE_KEYS.staples).catch(() => null),
          window.storage.get(STORAGE_KEYS.recipes).catch(() => null),
          window.storage.get(STORAGE_KEYS.recurring).catch(() => null),
          window.storage.get(STORAGE_KEYS.macroLog).catch(() => null),
          window.storage.get(STORAGE_KEYS.macroGoals).catch(() => null),
        ]);
        const [a, b, c, d, e, f, g, h, i] = results;
        if (a?.value) setItems(JSON.parse(a.value));
        if (b?.value) setMeals(JSON.parse(b.value));
        if (c?.value) setShopping(JSON.parse(c.value));
        if (d?.value) setLowStockItems(JSON.parse(d.value));
        if (e?.value) setStaples(JSON.parse(e.value));
        if (f?.value) {
          const parsed = JSON.parse(f.value);
          // Migrate: if stored recipes are just defaults, clear them to save space
          const isOldFormat = parsed.length > 100 && parsed[0]?.id?.startsWith("dr-");
          setUserRecipes(isOldFormat ? [] : parsed);
          if (isOldFormat) window.storage.set(STORAGE_KEYS.recipes, "[]").catch(() => {});
        }
        if (g?.value) setRecurring(JSON.parse(g.value));
        if (h?.value) setMacroLog(JSON.parse(h.value));
        if (i?.value) setMacroGoals(JSON.parse(i.value));
        const j = await window.storage.get(STORAGE_KEYS.gymLog).catch(() => null);
        if (j?.value) setGymLog(JSON.parse(j.value));
        const k = await window.storage.get(STORAGE_KEYS.bodyWeight).catch(() => null);
        if (k?.value) setBodyWeight(JSON.parse(k.value));
        const l = await window.storage.get(STORAGE_KEYS.userProfile).catch(() => null);
        if (l?.value) setUserProfile(JSON.parse(l.value));
        const m = await window.storage.get(STORAGE_KEYS.workoutTemplates).catch(() => null);
        if (m?.value) setWorkoutTemplates(JSON.parse(m.value));
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
  const saveUserRecipes = save(STORAGE_KEYS.recipes, setUserRecipes);

  // Merge: user recipes first, then defaults (user can override by same name)
  const allRecipes = useMemo(() => {
    const userNames = new Set(userRecipes.map(r => r.name.toLowerCase()));
    const defaults = DEFAULT_RECIPES.filter(r => !userNames.has(r.name.toLowerCase()));
    return [...userRecipes, ...defaults];
  }, [userRecipes]);
  const saveRecurring = save(STORAGE_KEYS.recurring, setRecurring);
  const saveMacroLog = save(STORAGE_KEYS.macroLog, setMacroLog);
  const saveMacroGoals = save(STORAGE_KEYS.macroGoals, setMacroGoals);
  const saveGymLog = save(STORAGE_KEYS.gymLog, setGymLog);
  const saveBodyWeight = save(STORAGE_KEYS.bodyWeight, setBodyWeight);
  const saveUserProfile = save(STORAGE_KEYS.userProfile, setUserProfile);
  const saveWorkoutTemplates = save(STORAGE_KEYS.workoutTemplates, setWorkoutTemplates);

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

  // First-time user — show onboarding
  if (!userProfile) {
    return (
      <>
        <style>{globalStyles}</style>
        <Onboarding onComplete={({ profile, macroGoals: goals }) => {
          saveUserProfile(profile);
          if (goals) saveMacroGoals(goals);
          setShowWalkthrough(true);
        }} />
      </>
    );
  }

  return (
    <ErrorBoundary>
    <div className="app-shell">
      <style>{globalStyles}</style>

      {/* Toast notifications */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          onUndo={toast.undoFn ? () => { toast.undoFn(); dismissToast(); } : null}
          onDismiss={dismissToast}
        />
      )}

      {/* Walkthrough overlay */}
      {showWalkthrough && (
        <Walkthrough
          onComplete={() => setShowWalkthrough(false)}
          onSwitchTab={setTab}
          items={items}
          workoutTemplates={workoutTemplates}
        />
      )}

      {/* Scrollable content area */}
      <div className="app-content">
        {/* Spacer for top padding */}
        <div style={{ height: 16 }} />

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
          {tab === "fridge" && <FridgeTab items={items} saveItems={saveItems} lowStockItems={lowStockItems} saveLowStock={saveLowStock} staples={staples} saveStaples={saveStaples} shopping={shopping} saveShopping={saveShopping} showToast={showToast} />}
          {tab === "overview" && <OverviewTab items={items} saveItems={saveItems} lowStockItems={lowStockItems} saveLowStock={saveLowStock} staples={staples} saveStaples={saveStaples} shopping={shopping} saveShopping={saveShopping} showToast={showToast} />}
          {tab === "meals" && <MealPlanTab meals={meals} saveMeals={saveMeals} items={items} saveItems={saveItems} recurring={recurring} saveRecurring={saveRecurring} recipes={allRecipes} saveRecipes={saveUserRecipes} macroLog={macroLog} saveMacroLog={saveMacroLog} macroGoals={macroGoals} saveMacroGoals={saveMacroGoals} userProfile={userProfile} shopping={shopping} saveShopping={saveShopping} showToast={showToast} />}
          {tab === "gym" && <GymTab gymLog={gymLog} saveGymLog={saveGymLog} bodyWeight={bodyWeight} saveBodyWeight={saveBodyWeight} workoutTemplates={workoutTemplates} saveWorkoutTemplates={saveWorkoutTemplates} />}
          {tab === "settings" && <SettingsTab userProfile={userProfile} saveUserProfile={saveUserProfile} macroGoals={macroGoals} saveMacroGoals={saveMacroGoals} bodyWeight={bodyWeight} showToast={showToast} />}
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
    </ErrorBoundary>
  );
}
