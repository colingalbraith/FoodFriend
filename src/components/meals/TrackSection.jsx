import { useState } from "react";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import { makeId } from "../../utils/itemHelpers";

export default function TrackSection({
  today, macroLog, saveMacroLog, macroGoals, saveMacroGoals,
  goals, todayTotals, todayEntries,
  recipes, items, saveItems, showToast,
}) {
  const [adding, setAdding] = useState(false);
  const [logName, setLogName] = useState("");
  const [logCal, setLogCal] = useState("");
  const [logPro, setLogPro] = useState("");
  const [logCarb, setLogCarb] = useState("");
  const [logFat, setLogFat] = useState("");
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalCal, setGoalCal] = useState(String(goals.calories));
  const [goalPro, setGoalPro] = useState(String(goals.protein));
  const [goalCarb, setGoalCarb] = useState(String(goals.carbs));
  const [goalFat, setGoalFat] = useState(String(goals.fat));

  function saveGoals() {
    if (saveMacroGoals) {
      saveMacroGoals({ calories: Number(goalCal) || 2000, protein: Number(goalPro) || 150, carbs: Number(goalCarb) || 250, fat: Number(goalFat) || 65 });
    }
    setEditingGoals(false);
  }

  function pct(val, goal) { return goal > 0 ? Math.min(Math.round((val / goal) * 100), 100) : 0; }
  function ringColor(p) { return p >= 100 ? "#d48a7b" : p >= 75 ? "#c4a86a" : "#6b8e6b"; }

  const recipeMap = {};
  (recipes || []).forEach(r => { recipeMap[r.name.toLowerCase()] = r; });

  function findRecipe(name) {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    if (recipeMap[key]) return recipeMap[key];
    for (const r of (recipes || [])) {
      if (key.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(key)) return r;
    }
    return null;
  }

  function logEntry() {
    if (!logName.trim()) return;
    saveMacroLog([{
      id: makeId(), date: today, name: logName.trim(),
      calories: logCal || "0", protein: logPro || "0", carbs: logCarb || "0", fat: logFat || "0",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }, ...(macroLog || [])]);
    setAdding(false); setLogName(""); setLogCal(""); setLogPro(""); setLogCarb(""); setLogFat("");
  }

  function logRecipe(recipeName) {
    const recipe = findRecipe(recipeName);

    saveMacroLog([{
      id: makeId(), date: today, name: recipeName,
      calories: recipe?.calories || "0", protein: recipe?.protein || "0",
      carbs: "0", fat: "0",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }, ...(macroLog || [])]);

    // Deduct matching ingredients from fridge
    if (recipe?.ingredients?.length > 0 && saveItems && items) {
      const remaining = [...items];
      const deducted = [];
      for (const ing of recipe.ingredients) {
        const idx = remaining.findIndex(item => item.name.toLowerCase() === ing.toLowerCase());
        if (idx !== -1) {
          deducted.push(remaining[idx].name);
          remaining.splice(idx, 1);
        }
      }
      if (deducted.length > 0) {
        const prevItems = items;
        saveItems(remaining);
        showToast?.(`Logged ${recipeName} — removed ${deducted.length} item${deducted.length > 1 ? "s" : ""} from fridge`);
        return;
      }
    }

    setAdding(false);
  }

  function removeEntry(id) { saveMacroLog((macroLog || []).filter(e => e.id !== id)); }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>Today</div>
        <button className="filter-chip" onClick={() => { setGoalCal(String(goals.calories)); setGoalPro(String(goals.protein)); setGoalCarb(String(goals.carbs)); setGoalFat(String(goals.fat)); setEditingGoals(true); }} style={{ fontSize: 11, padding: "4px 10px", minHeight: 28 }}>Goals</button>
      </div>

      {/* Macro rings */}
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          {[
            { label: "Cal", val: todayTotals.calories, goal: goals.calories, unit: "" },
            { label: "Protein", val: todayTotals.protein, goal: goals.protein, unit: "g" },
            { label: "Carbs", val: todayTotals.carbs, goal: goals.carbs, unit: "g" },
            { label: "Fat", val: todayTotals.fat, goal: goals.fat, unit: "g" },
          ].map(m => {
            const p = pct(m.val, m.goal);
            return (
              <div key={m.label}>
                <div style={{ position: "relative", width: 52, height: 52, margin: "0 auto 4px" }}>
                  <svg width="52" height="52" viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="22" fill="none" stroke="#e8dcc8" strokeWidth="4.5" />
                    <circle cx="26" cy="26" r="22" fill="none" stroke={ringColor(p)} strokeWidth="4.5" strokeDasharray={`${p * 1.382} 138.2`} strokeLinecap="round" transform="rotate(-90 26 26)" style={{ transition: "stroke-dasharray 0.5s ease" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--text)" }}>{p}%</div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>{m.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{Math.round(m.val)}<span style={{ color: "var(--muted)", fontSize: 9 }}>/{m.goal}{m.unit}</span></div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className="cozy-btn primary" style={{ flex: 1 }} onClick={() => { setAdding("manual"); setLogName(""); setLogCal(""); setLogPro(""); setLogCarb(""); setLogFat(""); }}>Log Food</button>
        <button className="cozy-btn secondary" style={{ flex: 1 }} onClick={() => setAdding("recipe")}>From Recipe</button>
      </div>

      {todayEntries.length === 0 ? (
        <Card style={{ padding: 20, textAlign: "center" }}><div style={{ fontSize: 13, color: "var(--muted)" }}>No food logged today.</div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {todayEntries.map((entry, i) => (
            <Card key={entry.id} style={{ padding: 0, animation: `fadeIn 0.2s ease-out ${i * 30}ms both` }}>
              <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{entry.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 8, marginTop: 2 }}>
                    <span>{entry.calories} cal</span><span>{entry.protein}g P</span>
                    {entry.time && <span>· {entry.time}</span>}
                  </div>
                </div>
                <button onClick={() => removeEntry(entry.id)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Manual log modal */}
      <Modal open={adding === "manual"} onClose={() => setAdding(false)} title="Log Food">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="cozy-input" placeholder="What did you eat?" value={logName} onChange={e => setLogName(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label><input className="cozy-input" placeholder="0" value={logCal} onChange={e => setLogCal(e.target.value)} inputMode="numeric" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label><input className="cozy-input" placeholder="0" value={logPro} onChange={e => setLogPro(e.target.value)} inputMode="numeric" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Carbs (g)</label><input className="cozy-input" placeholder="0" value={logCarb} onChange={e => setLogCarb(e.target.value)} inputMode="numeric" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Fat (g)</label><input className="cozy-input" placeholder="0" value={logFat} onChange={e => setLogFat(e.target.value)} inputMode="numeric" /></div>
          </div>
          <button className="cozy-btn primary full" onClick={logEntry} disabled={!logName.trim()}>Log</button>
        </div>
      </Modal>

      {/* Recipe log modal */}
      <Modal open={adding === "recipe"} onClose={() => setAdding(false)} title="Log a Recipe">
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {(recipes || []).map(r => (
            <button key={r.id} onClick={() => { logRecipe(r.name); setAdding(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 14px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--body)", borderBottom: "1px solid #f0e6d6" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{r.calories || 0} cal · {r.protein || 0}g protein</div>
              </div>
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>+ Log</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Goals modal — we need saveMacroGoals passed as prop */}
      <Modal open={editingGoals} onClose={() => setEditingGoals(false)} title="Daily Goals">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label><input className="cozy-input" value={goalCal} onChange={e => setGoalCal(e.target.value)} inputMode="numeric" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label><input className="cozy-input" value={goalPro} onChange={e => setGoalPro(e.target.value)} inputMode="numeric" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Carbs (g)</label><input className="cozy-input" value={goalCarb} onChange={e => setGoalCarb(e.target.value)} inputMode="numeric" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Fat (g)</label><input className="cozy-input" value={goalFat} onChange={e => setGoalFat(e.target.value)} inputMode="numeric" /></div>
          </div>
          <button className="cozy-btn primary full" onClick={saveGoals}>Save Goals</button>
        </div>
      </Modal>
    </>
  );
}
