import { useState } from "react";
import { makeId } from "../../utils/itemHelpers";
import Card from "../ui/Card";
import Modal from "../ui/Modal";

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateLabel(dateStr) {
  const today = todayKey();
  if (dateStr === today) return "Today";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function MacrosTab({ macroLog, saveMacroLog, macroGoals, saveMacroGoals, recipes }) {
  const goals = macroGoals || DEFAULT_GOALS;
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalCal, setGoalCal] = useState(String(goals.calories));
  const [goalPro, setGoalPro] = useState(String(goals.protein));
  const [goalCarb, setGoalCarb] = useState(String(goals.carbs));
  const [goalFat, setGoalFat] = useState(String(goals.fat));
  const [adding, setAdding] = useState(false);
  const [logName, setLogName] = useState("");
  const [logCal, setLogCal] = useState("");
  const [logPro, setLogPro] = useState("");
  const [logCarb, setLogCarb] = useState("");
  const [logFat, setLogFat] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const today = todayKey();

  // Get entries for selected date
  const dayEntries = macroLog.filter(e => e.date === selectedDate);
  const totals = dayEntries.reduce((acc, e) => ({
    calories: acc.calories + (Number(e.calories) || 0),
    protein: acc.protein + (Number(e.protein) || 0),
    carbs: acc.carbs + (Number(e.carbs) || 0),
    fat: acc.fat + (Number(e.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Last 7 days for date picker
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  function logEntry() {
    if (!logName.trim()) return;
    const entry = {
      id: makeId(),
      date: selectedDate,
      name: logName.trim(),
      calories: logCal || "0",
      protein: logPro || "0",
      carbs: logCarb || "0",
      fat: logFat || "0",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    saveMacroLog([entry, ...macroLog]);
    setAdding(false);
    setLogName(""); setLogCal(""); setLogPro(""); setLogCarb(""); setLogFat("");
  }

  function logRecipe(r) {
    const entry = {
      id: makeId(),
      date: selectedDate,
      name: r.name,
      calories: r.calories || "0",
      protein: r.protein || "0",
      carbs: "0",
      fat: "0",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    saveMacroLog([entry, ...macroLog]);
  }

  function removeEntry(id) {
    saveMacroLog(macroLog.filter(e => e.id !== id));
  }

  function saveGoals() {
    saveMacroGoals({
      calories: Number(goalCal) || 2000,
      protein: Number(goalPro) || 150,
      carbs: Number(goalCarb) || 250,
      fat: Number(goalFat) || 65,
    });
    setEditingGoals(false);
  }

  function openAddFromRecipe() {
    setAdding("recipe");
  }

  function pct(val, goal) {
    return goal > 0 ? Math.min(Math.round((val / goal) * 100), 100) : 0;
  }

  function barColor(p) {
    if (p >= 100) return "#d48a7b";
    if (p >= 75) return "#c4a86a";
    return "#6b8e6b";
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>Macros</div>
        <button className="filter-chip" onClick={() => {
          setGoalCal(String(goals.calories)); setGoalPro(String(goals.protein));
          setGoalCarb(String(goals.carbs)); setGoalFat(String(goals.fat));
          setEditingGoals(true);
        }} style={{ fontSize: 11, padding: "4px 10px", minHeight: 28 }}>
          Goals
        </button>
      </div>

      {/* Day picker */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {days.map(d => (
          <button key={d} className={`filter-chip ${selectedDate === d ? "active" : ""}`}
            onClick={() => setSelectedDate(d)}
            style={{ fontSize: 11, padding: "6px 10px", minHeight: 32, flexShrink: 0 }}>
            {d === today ? "Today" : new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
          </button>
        ))}
      </div>

      {/* Progress rings */}
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          {[
            { label: "Cal", val: totals.calories, goal: goals.calories, unit: "" },
            { label: "Protein", val: totals.protein, goal: goals.protein, unit: "g" },
            { label: "Carbs", val: totals.carbs, goal: goals.carbs, unit: "g" },
            { label: "Fat", val: totals.fat, goal: goals.fat, unit: "g" },
          ].map(m => {
            const p = pct(m.val, m.goal);
            return (
              <div key={m.label}>
                <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 6px" }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#e8dcc8" strokeWidth="5" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke={barColor(p)} strokeWidth="5"
                      strokeDasharray={`${p * 1.508} 150.8`}
                      strokeLinecap="round" transform="rotate(-90 28 28)"
                      style={{ transition: "stroke-dasharray 0.5s ease" }} />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, color: "var(--text)",
                  }}>
                    {p}%
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                  {Math.round(m.val)}<span style={{ color: "var(--muted)", fontWeight: 600 }}>/{m.goal}{m.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className="cozy-btn primary" style={{ flex: 1 }} onClick={() => { setAdding("manual"); setLogName(""); setLogCal(""); setLogPro(""); setLogCarb(""); setLogFat(""); }}>
          Log Food
        </button>
        <button className="cozy-btn secondary" style={{ flex: 1 }} onClick={openAddFromRecipe}>
          From Recipe
        </button>
      </div>

      {/* Today's log */}
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {getDateLabel(selectedDate)} — {dayEntries.length} entries
      </div>

      {dayEntries.length === 0 ? (
        <Card style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>No food logged yet. Tap "Log Food" to start tracking.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {dayEntries.map((entry, i) => (
            <Card key={entry.id} style={{ padding: 0, overflow: "hidden", animation: `fadeIn 0.2s ease-out ${i * 30}ms both` }}>
              <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{entry.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 8, marginTop: 2 }}>
                    <span>{entry.calories} cal</span>
                    <span>{entry.protein}g P</span>
                    {Number(entry.carbs) > 0 && <span>{entry.carbs}g C</span>}
                    {Number(entry.fat) > 0 && <span>{entry.fat}g F</span>}
                    {entry.time && <span>· {entry.time}</span>}
                  </div>
                </div>
                <button onClick={() => removeEntry(entry.id)} style={{
                  background: "none", border: "none", color: "var(--muted)", fontSize: 16,
                  cursor: "pointer", padding: 4, WebkitTapHighlightColor: "transparent",
                }}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Log food modal */}
      <Modal open={adding === "manual"} onClose={() => setAdding(false)} title="Log Food">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="cozy-input" placeholder="What did you eat?" value={logName} onChange={e => setLogName(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label>
              <input className="cozy-input" placeholder="0" value={logCal} onChange={e => setLogCal(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label>
              <input className="cozy-input" placeholder="0" value={logPro} onChange={e => setLogPro(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Carbs (g)</label>
              <input className="cozy-input" placeholder="0" value={logCarb} onChange={e => setLogCarb(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Fat (g)</label>
              <input className="cozy-input" placeholder="0" value={logFat} onChange={e => setLogFat(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <button className="cozy-btn primary full" onClick={logEntry} disabled={!logName.trim()}>Log</button>
        </div>
      </Modal>

      {/* Log from recipe modal */}
      <Modal open={adding === "recipe"} onClose={() => setAdding(false)} title="Log a Recipe">
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {recipes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--muted)", fontSize: 13 }}>
              No recipes saved yet. Add some in the Cook tab.
            </div>
          ) : recipes.map(r => (
            <button key={r.id} onClick={() => { logRecipe(r); setAdding(false); }} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "12px 14px", borderRadius: 12, border: "none",
              background: "transparent", cursor: "pointer", textAlign: "left",
              fontFamily: "var(--body)", WebkitTapHighlightColor: "transparent",
              borderBottom: "1px solid #f0e6d6",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                  {r.calories || 0} cal · {r.protein || 0}g protein
                </div>
              </div>
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>+ Log</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Edit goals modal */}
      <Modal open={editingGoals} onClose={() => setEditingGoals(false)} title="Daily Goals">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label>
              <input className="cozy-input" value={goalCal} onChange={e => setGoalCal(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label>
              <input className="cozy-input" value={goalPro} onChange={e => setGoalPro(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Carbs (g)</label>
              <input className="cozy-input" value={goalCarb} onChange={e => setGoalCarb(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Fat (g)</label>
              <input className="cozy-input" value={goalFat} onChange={e => setGoalFat(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <button className="cozy-btn primary full" onClick={saveGoals}>Save Goals</button>
        </div>
      </Modal>
    </div>
  );
}
