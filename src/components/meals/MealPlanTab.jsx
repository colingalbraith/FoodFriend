import { useState, useRef, useEffect } from "react";
import { DAY_NAMES } from "../../constants/categories";
import { getWeekDates } from "../../utils/dateHelpers";
import { makeId } from "../../utils/itemHelpers";
import Card from "../ui/Card";
import Modal from "../ui/Modal";

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKEND = ["Sat", "Sun"];
const EVERYDAY = [...DAYS_OF_WEEK];
const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MealPlanTab({ meals, saveMeals, items, recurring, saveRecurring, recipes, saveRecipes, macroLog, saveMacroLog, macroGoals, saveMacroGoals, bodyWeight, saveBodyWeight, userProfile, shopping, saveShopping }) {
  const weekDates = getWeekDates();
  const today = weekDates[0];
  const [section, setSection] = useState("plan"); // "plan" | "track" | "weight" | "recipes" | "stats"
  const [weightInput, setWeightInput] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeLimit, setRecipeLimit] = useState(20);
  const [addingRecipe, setAddingRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeName, setRecipeName] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState("");
  const [recipeNotes, setRecipeNotes] = useState("");
  const [recipeCalories, setRecipeCalories] = useState("");
  const [recipeProtein, setRecipeProtein] = useState("");
  const [recipeTime, setRecipeTime] = useState("");
  const [editing, setEditing] = useState(null);
  const [mealInput, setMealInput] = useState("");
  const [showRecurring, setShowRecurring] = useState(false);
  const [addingRecurring, setAddingRecurring] = useState(false);
  const [recName, setRecName] = useState("");
  const [recType, setRecType] = useState("breakfast");
  const [recDays, setRecDays] = useState("weekdays");
  const [recCustomDays, setRecCustomDays] = useState([]);
  const [editingRecId, setEditingRecId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [logName, setLogName] = useState("");
  const [logCal, setLogCal] = useState("");
  const [logPro, setLogPro] = useState("");
  const [logCarb, setLogCarb] = useState("");
  const [logFat, setLogFat] = useState("");
  const [editingGoals, setEditingGoals] = useState(false);
  const inputRef = useRef(null);

  const goals = macroGoals || DEFAULT_GOALS;
  const [goalCal, setGoalCal] = useState(String(goals.calories));
  const [goalPro, setGoalPro] = useState(String(goals.protein));
  const [goalCarb, setGoalCarb] = useState(String(goals.carbs));
  const [goalFat, setGoalFat] = useState(String(goals.fat));

  const recurringList = recurring?.list || [];
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

  function getDayName(dateStr) { return DAYS_OF_WEEK[new Date(dateStr + "T12:00:00").getDay()]; }

  function getRecurringMeal(dateStr, mealType) {
    const dayName = getDayName(dateStr);
    const matches = recurringList.filter(r => r.type === mealType && r.days.includes(dayName));
    return matches.length > 0 ? matches[0].name : null;
  }

  function isLogged(date, mealName) {
    if (!macroLog || !mealName) return false;
    return macroLog.some(e => e.date === date && e.name.toLowerCase() === mealName.toLowerCase());
  }

  function logMealToMacros(date, mealName) {
    const recipe = findRecipe(mealName);
    saveMacroLog([{
      id: makeId(), date, name: mealName,
      calories: recipe?.calories || "0", protein: recipe?.protein || "0",
      carbs: "0", fat: "0",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }, ...(macroLog || [])]);
  }

  function getDayMacros(date) {
    if (!macroLog) return null;
    const entries = macroLog.filter(e => e.date === date);
    if (entries.length === 0) return null;
    return {
      calories: entries.reduce((s, e) => s + (Number(e.calories) || 0), 0),
      protein: entries.reduce((s, e) => s + (Number(e.protein) || 0), 0),
    };
  }

  // 7 day macro history for chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const weekData = last7.map(date => {
    const entries = (macroLog || []).filter(e => e.date === date);
    return {
      date,
      label: date === today ? "Today" : DAYS_OF_WEEK[new Date(date + "T12:00:00").getDay()],
      calories: entries.reduce((s, e) => s + (Number(e.calories) || 0), 0),
      protein: entries.reduce((s, e) => s + (Number(e.protein) || 0), 0),
      entries: entries.length,
    };
  });
  const maxCal = Math.max(goals.calories, ...weekData.map(d => d.calories));

  const planned = weekDates.flatMap(d => MEAL_TYPES.map(mt => {
    const key = `${d}-${mt.id}`;
    return meals[key] || getRecurringMeal(d, mt.id) ? key : null;
  })).filter(Boolean).length;

  function openEdit(date, type) {
    setMealInput(meals[`${date}-${type}`] || "");
    setEditing({ date, type });
  }

  function saveMeal() {
    if (!editing) return;
    const key = `${editing.date}-${editing.type}`;
    const n = { ...meals };
    if (mealInput.trim()) n[key] = mealInput.trim(); else delete n[key];
    saveMeals(n);
    setEditing(null); setMealInput("");
  }

  function clearMeal() {
    if (!editing) return;
    const n = { ...meals }; delete n[`${editing.date}-${editing.type}`];
    saveMeals(n); setEditing(null); setMealInput("");
  }

  useEffect(() => { if (editing) setTimeout(() => inputRef.current?.focus(), 100); }, [editing]);

  function openAddRecurring() {
    setRecName(""); setRecType("breakfast"); setRecDays("weekdays"); setRecCustomDays([]);
    setEditingRecId(null); setAddingRecurring(true);
  }

  function openEditRecurring(r) {
    setRecName(r.name); setRecType(r.type);
    const dStr = r.days.join(",");
    if (dStr === WEEKDAYS.join(",")) setRecDays("weekdays");
    else if (dStr === WEEKEND.join(",")) setRecDays("weekend");
    else if (dStr === EVERYDAY.join(",")) setRecDays("everyday");
    else { setRecDays("custom"); setRecCustomDays(r.days); }
    setEditingRecId(r.id); setAddingRecurring(true);
  }

  function saveRecurringMeal() {
    if (!recName.trim()) return;
    const days = recDays === "weekdays" ? WEEKDAYS : recDays === "weekend" ? WEEKEND : recDays === "everyday" ? EVERYDAY : recCustomDays;
    if (days.length === 0) return;
    const entry = { id: editingRecId || makeId(), name: recName.trim(), type: recType, days };
    const list = editingRecId ? recurringList.map(r => r.id === editingRecId ? entry : r) : [...recurringList, entry];
    saveRecurring({ list }); setAddingRecurring(false);
  }

  function deleteRecurring(id) { saveRecurring({ list: recurringList.filter(r => r.id !== id) }); }
  function toggleCustomDay(day) { setRecCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]); }

  function logEntry() {
    if (!logName.trim()) return;
    saveMacroLog([{
      id: makeId(), date: today, name: logName.trim(),
      calories: logCal || "0", protein: logPro || "0", carbs: logCarb || "0", fat: logFat || "0",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }, ...(macroLog || [])]);
    setAdding(false); setLogName(""); setLogCal(""); setLogPro(""); setLogCarb(""); setLogFat("");
  }

  function removeEntry(id) { saveMacroLog((macroLog || []).filter(e => e.id !== id)); }

  function saveGoals() {
    saveMacroGoals({ calories: Number(goalCal) || 2000, protein: Number(goalPro) || 150, carbs: Number(goalCarb) || 250, fat: Number(goalFat) || 65 });
    setEditingGoals(false);
  }

  function pct(val, goal) { return goal > 0 ? Math.min(Math.round((val / goal) * 100), 100) : 0; }
  function ringColor(p) { return p >= 100 ? "#d48a7b" : p >= 75 ? "#c4a86a" : "#6b8e6b"; }

  const todayEntries = (macroLog || []).filter(e => e.date === today);
  const todayTotals = todayEntries.reduce((a, e) => ({
    calories: a.calories + (Number(e.calories) || 0), protein: a.protein + (Number(e.protein) || 0),
    carbs: a.carbs + (Number(e.carbs) || 0), fat: a.fat + (Number(e.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Section toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { id: "plan", label: "Plan" },
          { id: "track", label: "Track" },
          { id: "recipes", label: "Recipes" },
          { id: "weight", label: "Weight" },
          { id: "stats", label: "Stats" },
        ].map(s => (
          <button key={s.id} className={`filter-chip ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── PLAN SECTION ─── */}
      {section === "plan" && (
        <>
          {/* Today's calorie summary */}
          {todayEntries.length > 0 && (
            <Card style={{ padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                  {todayTotals.calories} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>/ {goals.calories} cal today</span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{todayTotals.protein}g protein</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#e8dcc8", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  borderRadius: 3,
                  width: `${Math.min((todayTotals.calories / goals.calories) * 100, 100)}%`,
                  background: todayTotals.calories > goals.calories ? "linear-gradient(90deg, #d48a7b, #c47a6b)" : "linear-gradient(90deg, #6b8e6b, #5a7a5a)",
                  transition: "width 0.5s ease",
                }} />
              </div>
            </Card>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>This Week</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{planned}/21</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {weekDates.map((date, di) => {
              const d = new Date(date + "T12:00:00");
              const isToday = date === today;
              const dayMeals = MEAL_TYPES.map(mt => {
                const key = `${date}-${mt.id}`;
                return { ...mt, key, value: meals[key] || null, recurring: !meals[key] ? getRecurringMeal(date, mt.id) : null };
              });
              const filledCount = dayMeals.filter(m => m.value || m.recurring).length;
              const dayMacros = getDayMacros(date);

              return (
                <Card key={date} style={{ padding: 0, overflow: "hidden", animation: `fadeIn 0.3s ease-out ${di * 40}ms both`, border: isToday ? "2px solid var(--accent)" : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: isToday ? "linear-gradient(135deg, rgba(196,149,106,0.12), rgba(196,149,106,0.06))" : undefined }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: isToday ? "var(--accent)" : "var(--text)" }}>{isToday ? "Today" : DAYS_OF_WEEK[d.getDay()]}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {dayMacros && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>{dayMacros.calories}cal · {dayMacros.protein}gP</span>}
                      <span style={{ fontSize: 11, fontWeight: 700, color: filledCount === 3 ? "#6b8e6b" : "var(--muted)" }}>{filledCount}/3</span>
                    </div>
                  </div>
                  {dayMeals.map(meal => {
                    const mealName = meal.value || meal.recurring;
                    const recipe = findRecipe(mealName);
                    const logged = isLogged(date, mealName);
                    return (
                      <div key={meal.key} style={{ padding: "14px 16px", borderTop: "1px solid #f0e6d6", minHeight: 56 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => openEdit(date, meal.id)}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{meal.label}</div>
                            {meal.value ? (
                              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{meal.value}</div>
                            ) : meal.recurring ? (
                              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", fontStyle: "italic" }}>{meal.recurring} <span style={{ fontSize: 10, color: "var(--accent)" }}>recurring</span></div>
                            ) : (
                              <div style={{ fontSize: 14, color: "#ccc", fontWeight: 600 }}>Tap to plan...</div>
                            )}
                            {recipe && recipe.calories && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{recipe.calories} cal · {recipe.protein || 0}g protein</div>}
                          </div>
                          {mealName && (
                            <button onClick={() => { if (!logged) logMealToMacros(date, mealName); }} disabled={logged}
                              style={{ background: logged ? "#edf5ed" : "var(--card)", border: `1.5px solid ${logged ? "#b8d4b8" : "#e0cdb5"}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 14, color: logged ? "#4a7a4a" : "var(--muted)", fontFamily: "var(--body)", cursor: logged ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}>
                              {logged ? "Logged" : "Log"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </div>

          {/* Recurring meals */}
          <div style={{ marginTop: 24 }}>
            <button onClick={() => setShowRecurring(!showRecurring)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "var(--body)", WebkitTapHighlightColor: "transparent" }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Recurring Meals</span>
              <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{recurringList.length} set</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)", transition: "transform 0.25s ease", transform: showRecurring ? "rotate(0deg)" : "rotate(-90deg)" }}>▼</span>
            </button>
            {showRecurring && (
              <div style={{ marginTop: 8, animation: "fadeIn 0.25s ease-out" }}>
                <button className="cozy-btn primary full" onClick={openAddRecurring} style={{ marginBottom: 10 }}>Add Recurring Meal</button>
                {recurringList.map(r => (
                  <Card key={r.id} style={{ padding: 0, marginBottom: 6 }}>
                    <div onClick={() => openEditRecurring(r)} style={{ padding: "12px 16px", cursor: "pointer" }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{MEAL_TYPES.find(m => m.id === r.type)?.label} · {r.days.join(", ")}</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── TRACK SECTION ─── */}
      {section === "track" && (
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
        </>
      )}

      {/* ─── STATS SECTION ─── */}
      {section === "stats" && (
        <>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Weekly Stats</div>

          {/* Calorie bar chart */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Goal: {goals.calories} cal/day</span>
          </div>
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Calories</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {weekData.map((d, i) => {
                const h = maxCal > 0 ? (d.calories / maxCal) * 100 : 0;
                const overGoal = d.calories > goals.calories;
                return (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>{d.calories > 0 ? d.calories : ""}</div>
                    <div style={{ width: "100%", height: 100, display: "flex", alignItems: "flex-end" }}>
                      <div style={{
                        width: "100%", height: `${h}%`, minHeight: d.calories > 0 ? 4 : 0,
                        borderRadius: "4px 4px 0 0",
                        background: overGoal ? "linear-gradient(180deg, #d48a7b, #c47a6b)" : "linear-gradient(180deg, #6b8e6b, #5a7a5a)",
                        transition: "height 0.5s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Protein bar chart */}
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Protein</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
              {weekData.map(d => {
                const maxP = Math.max(goals.protein, ...weekData.map(x => x.protein));
                const h = maxP > 0 ? (d.protein / maxP) * 100 : 0;
                return (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>{d.protein > 0 ? d.protein + "g" : ""}</div>
                    <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", height: `${h}%`, minHeight: d.protein > 0 ? 4 : 0, borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg, #8ab4d4, #7aa4c4)", transition: "height 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Summary stats */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>7-Day Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Avg Calories", val: Math.round(weekData.reduce((s, d) => s + d.calories, 0) / 7) },
                { label: "Avg Protein", val: Math.round(weekData.reduce((s, d) => s + d.protein, 0) / 7) + "g" },
                { label: "Days Tracked", val: weekData.filter(d => d.entries > 0).length + "/7" },
                { label: "Goal Hit Rate", val: Math.round(weekData.filter(d => d.calories >= goals.calories * 0.9 && d.calories <= goals.calories * 1.1).length / 7 * 100) + "%" },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ─── RECIPES SECTION ─── */}
      {section === "recipes" && (() => {
        const fridgeNames = new Set(items.map(i => i.name.toLowerCase()));
        const filtered = recipeSearch
          ? (recipes || []).filter(r => r.name.toLowerCase().includes(recipeSearch.toLowerCase()))
          : (recipes || []);

        function openAddRecipe() {
          setRecipeName(""); setRecipeIngredients(""); setRecipeNotes("");
          setRecipeCalories(""); setRecipeProtein(""); setRecipeTime("");
          setEditingRecipe(null); setAddingRecipe(true);
        }
        function openEditRecipe(r) {
          setRecipeName(r.name); setRecipeIngredients(r.ingredients.join(", "));
          setRecipeNotes(r.notes || ""); setRecipeCalories(r.calories || "");
          setRecipeProtein(r.protein || ""); setRecipeTime(r.time || "");
          setEditingRecipe(r.id); setAddingRecipe(true);
        }
        function saveRecipe() {
          if (!recipeName.trim()) return;
          const ingredients = recipeIngredients.split(",").map(s => s.trim()).filter(Boolean);
          const recipe = {
            id: editingRecipe || makeId(), name: recipeName.trim(), ingredients,
            notes: recipeNotes.trim(), calories: recipeCalories.trim(),
            protein: recipeProtein.trim(), time: recipeTime.trim(),
            createdAt: editingRecipe ? (recipes || []).find(r => r.id === editingRecipe)?.createdAt : new Date().toISOString(),
          };
          // saveRecipes only persists user-created recipes, not defaults
          const isDefault = editingRecipe && editingRecipe.startsWith("dr-") || editingRecipe?.startsWith("r1-") || editingRecipe?.startsWith("r2-") || editingRecipe?.startsWith("r3-");
          if (editingRecipe && !isDefault) {
            // Editing a user recipe — update it
            const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]");
            saveRecipes(current.map(r => r.id === editingRecipe ? recipe : r));
          } else {
            // Adding new or overriding a default — add as user recipe with new id
            recipe.id = makeId();
            const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]");
            saveRecipes([recipe, ...current]);
          }
          setAddingRecipe(false);
        }
        function deleteRecipe(id) {
          const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]");
          saveRecipes(current.filter(r => r.id !== id));
        }

        return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>My Recipes</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{(recipes || []).length} saved</div>
            </div>

            <input className="cozy-input" placeholder="Search recipes..." value={recipeSearch}
              onChange={e => { setRecipeSearch(e.target.value); setRecipeLimit(20); }} style={{ marginBottom: 10 }} />

            <button className="cozy-btn primary full" onClick={openAddRecipe} style={{ marginBottom: 14 }}>Add Recipe</button>

            {filtered.length === 0 ? (
              <Card style={{ padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{recipeSearch ? "No matching recipes" : "No recipes yet"}</div>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.slice(0, recipeLimit).map((r, i) => {
                  const haveCount = r.ingredients.filter(ing => fridgeNames.has(ing.toLowerCase())).length;
                  const total = r.ingredients.length;
                  const canMake = total > 0 && haveCount === total;
                  return (
                    <Card key={r.id} style={{ padding: 0, overflow: "hidden", animation: `fadeIn 0.3s ease-out ${i * 40}ms both` }}>
                      <div onClick={() => openEditRecipe(r)} style={{ padding: 16, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700 }}>{r.name}</div>
                          {r.time && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, flexShrink: 0 }}>{r.time}</span>}
                        </div>
                        {(r.calories || r.protein) && (
                          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                            {r.calories && <div><span style={{ fontSize: 15, fontWeight: 800 }}>{r.calories}</span><span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 2 }}>cal</span></div>}
                            {r.protein && <div><span style={{ fontSize: 15, fontWeight: 800 }}>{r.protein}g</span><span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 2 }}>protein</span></div>}
                          </div>
                        )}
                        {total > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                            {r.ingredients.map((ing, j) => {
                              const have = fridgeNames.has(ing.toLowerCase());
                              return <span key={j} style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, background: have ? "#edf5ed" : "#fef3e2", color: have ? "#4a7a4a" : "#8b6d30", border: `1px solid ${have ? "#b8d4b8" : "#e8d0a8"}` }}>{ing}</span>;
                            })}
                          </div>
                        )}
                        {total > 0 && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: canMake ? "#4a7a4a" : "var(--muted)" }}>
                              {canMake ? "Ready to cook" : `${haveCount}/${total} in fridge`}
                            </div>
                            {!canMake && saveShopping && (
                              <button className="cozy-btn secondary" style={{ fontSize: 10, padding: "4px 10px", minHeight: 28, borderRadius: 8, flexShrink: 0 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const missing = r.ingredients.filter(ing => !fridgeNames.has(ing.toLowerCase()));
                                  const existingNames = new Set((shopping || []).map(i => i.name.toLowerCase()));
                                  const toAdd = missing.filter(n => !existingNames.has(n.toLowerCase()));
                                  if (toAdd.length > 0) saveShopping([...(shopping || []), ...toAdd.map(n => ({ id: makeId(), name: n, checked: false }))]);
                                }}>+ Shop</button>
                            )}
                          </div>
                        )}
                        {r.notes && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>{r.notes}</div>}
                      </div>
                    </Card>
                  );
                })}
                {filtered.length > recipeLimit && (
                  <button className="cozy-btn secondary full" onClick={() => setRecipeLimit(l => l + 20)} style={{ marginTop: 4 }}>
                    Show More ({filtered.length - recipeLimit} remaining)
                  </button>
                )}
              </div>
            )}

            {/* Add/Edit Recipe Modal */}
            <Modal open={addingRecipe} onClose={() => setAddingRecipe(false)} title={editingRecipe ? "Edit Recipe" : "Add Recipe"}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input className="cozy-input" placeholder="Recipe name" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Ingredients (comma separated)</label>
                  <textarea className="cozy-input" rows={3} placeholder="Chicken, Rice, Soy Sauce..." value={recipeIngredients} onChange={e => setRecipeIngredients(e.target.value)} style={{ resize: "vertical", fontFamily: "var(--body)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label><input className="cozy-input" placeholder="450" value={recipeCalories} onChange={e => setRecipeCalories(e.target.value)} inputMode="numeric" /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label><input className="cozy-input" placeholder="35" value={recipeProtein} onChange={e => setRecipeProtein(e.target.value)} inputMode="numeric" /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Time</label><input className="cozy-input" placeholder="30 min" value={recipeTime} onChange={e => setRecipeTime(e.target.value)} /></div>
                </div>
                <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Notes</label><textarea className="cozy-input" rows={2} placeholder="Tips, variations..." value={recipeNotes} onChange={e => setRecipeNotes(e.target.value)} style={{ resize: "vertical", fontFamily: "var(--body)" }} /></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveRecipe}>{editingRecipe ? "Update" : "Save Recipe"}</button>
                  {editingRecipe && <button className="cozy-btn danger" onClick={() => { deleteRecipe(editingRecipe); setAddingRecipe(false); }}>Delete</button>}
                </div>
              </div>
            </Modal>
          </>
        );
      })()}

      {/* ─── WEIGHT SECTION ─── */}
      {section === "weight" && (() => {
        const entries = (bodyWeight || []).sort((a, b) => a.date.localeCompare(b.date));
        const last30 = entries.slice(-30);
        const todayEntry = entries.find(e => e.date === today);
        const latestWeight = entries.length > 0 ? Number(entries[entries.length - 1].weight) : null;
        const startWeight = last30.length > 0 ? Number(last30[0].weight) : null;
        const change = latestWeight && startWeight ? (latestWeight - startWeight).toFixed(1) : null;
        const avg7 = (() => {
          const recent = entries.slice(-7);
          return recent.length > 0 ? (recent.reduce((s, e) => s + Number(e.weight), 0) / recent.length).toFixed(1) : null;
        })();

        // Chart data
        const chartData = last30.length >= 2 ? last30 : [];
        const minW = chartData.length > 0 ? Math.min(...chartData.map(e => Number(e.weight))) - 3 : 0;
        const maxW = chartData.length > 0 ? Math.max(...chartData.map(e => Number(e.weight))) + 3 : 1;
        const range = maxW - minW || 1;
        const points = chartData.map((e, i) => ({
          x: chartData.length > 1 ? (i / (chartData.length - 1)) * 270 + 15 : 150,
          y: 130 - ((Number(e.weight) - minW) / range) * 110,
          ...e,
        }));

        function logWeight() {
          if (!weightInput) return;
          const entry = { id: makeId(), date: today, weight: weightInput, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) };
          const updated = [...(bodyWeight || []).filter(e => e.date !== today), entry];
          saveBodyWeight(updated);
          setWeightInput("");
        }

        return (
          <>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Body Weight</div>

            {/* Current weight + log */}
            <Card style={{ padding: 20, marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", animation: "countUp 0.4s ease-out" }}>
                {todayEntry ? `${todayEntry.weight}` : latestWeight ? `${latestWeight}` : "--"}
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)", marginLeft: 4 }}>lb</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {todayEntry ? `Logged today at ${todayEntry.time}` : latestWeight ? "Last logged" : "No data yet"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
                <input className="cozy-input" placeholder="Weight (lb)" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                  inputMode="decimal" style={{ width: 120, textAlign: "center" }}
                  onKeyDown={e => { if (e.key === "Enter") logWeight(); }} />
                <button className="cozy-btn primary" onClick={logWeight} disabled={!weightInput}>Log</button>
              </div>
            </Card>

            {/* Weight chart */}
            {chartData.length >= 2 && (
              <Card style={{ padding: 16, marginBottom: 14, animation: "fadeIn 0.4s ease-out" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>30-Day Trend</div>
                <svg viewBox="0 0 300 150" width="100%" style={{ display: "block" }}>
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                    const y = 130 - pct * 110;
                    const val = Math.round(minW + pct * range);
                    return (
                      <g key={pct}>
                        <line x1="15" y1={y} x2="285" y2={y} stroke="#e8dcc8" strokeWidth="0.5" />
                        <text x="5" y={y + 3} fontSize="7" fill="#b0a090">{val}</text>
                      </g>
                    );
                  })}
                  {/* Line */}
                  <polyline points={points.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dots */}
                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" stroke="var(--card)" strokeWidth="2" style={{ animation: `popIn 0.2s ease-out ${i * 30}ms both` }} />
                  ))}
                  {/* Trend line */}
                  {points.length >= 3 && (() => {
                    const n = points.length;
                    const vals = points.map(p => Number(p.weight));
                    const sumX = points.reduce((s, _, i) => s + i, 0);
                    const sumY = vals.reduce((s, v) => s + v, 0);
                    const sumXY = vals.reduce((s, v, i) => s + i * v, 0);
                    const sumX2 = points.reduce((s, _, i) => s + i * i, 0);
                    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                    const intercept = (sumY - slope * sumX) / n;
                    const y1 = 130 - ((intercept - minW) / range) * 110;
                    const y2 = 130 - ((intercept + slope * (n - 1) - minW) / range) * 110;
                    return <line x1={points[0].x} y1={y1} x2={points[n - 1].x} y2={y2} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />;
                  })()}
                </svg>
              </Card>
            )}

            {/* Stats */}
            {entries.length > 0 && (
              <Card style={{ padding: 16, animation: "fadeIn 0.3s ease-out 100ms both" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{latestWeight || "--"} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>lb</span></div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Current</div>
                  </div>
                  {change !== null && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: Number(change) <= 0 ? "#6b8e6b" : "#d48a7b" }}>
                        {Number(change) > 0 ? "+" : ""}{change} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>lb</span>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>30-Day Change</div>
                    </div>
                  )}
                  {avg7 && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{avg7} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>lb</span></div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>7-Day Avg</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{entries.length}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Weigh-ins</div>
                  </div>
                </div>
              </Card>
            )}
          </>
        );
      })()}

      {/* ─── MODALS ─── */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `${editing.date === today ? "Today" : DAYS_OF_WEEK[new Date(editing.date + "T12:00:00").getDay()]} — ${MEAL_TYPES.find(m => m.id === editing.type)?.label}` : ""}>
        {editing && (
          <div>
            {!meals[`${editing.date}-${editing.type}`] && getRecurringMeal(editing.date, editing.type) && (
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 10 }}>Recurring: {getRecurringMeal(editing.date, editing.type)} — type below to override</div>
            )}
            <input ref={inputRef} className="cozy-input" placeholder="What's cooking?" value={mealInput} onChange={e => setMealInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveMeal(); }} style={{ marginBottom: 10 }} />
            {recipes && recipes.length > 0 && !mealInput && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Quick pick</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxHeight: 100, overflowY: "auto" }}>
                  {recipes.map(r => (<button key={r.id} className="quick-chip" onClick={() => setMealInput(r.name)} style={{ fontSize: 12, padding: "5px 10px" }}>{r.name}</button>))}
                </div>
              </div>
            )}
            {mealInput && findRecipe(mealInput) && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, padding: "6px 10px", background: "#f5f0e8", borderRadius: 8 }}>
                {findRecipe(mealInput).calories} cal · {findRecipe(mealInput).protein || 0}g protein
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveMeal}>{meals[`${editing.date}-${editing.type}`] ? "Update" : "Save"}</button>
              {meals[`${editing.date}-${editing.type}`] && <button className="cozy-btn danger" onClick={clearMeal}>Clear</button>}
              <button className="cozy-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={addingRecurring} onClose={() => setAddingRecurring(false)} title={editingRecId ? "Edit Recurring" : "Add Recurring Meal"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="cozy-input" placeholder="Meal name" value={recName} onChange={e => setRecName(e.target.value)} />
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Meal</label>
            <div style={{ display: "flex", gap: 6 }}>{MEAL_TYPES.map(mt => (<button key={mt.id} className={`filter-chip ${recType === mt.id ? "active" : ""}`} onClick={() => setRecType(mt.id)}>{mt.label}</button>))}</div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Repeats on</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {[{ id: "weekdays", label: "Weekdays" }, { id: "weekend", label: "Weekend" }, { id: "everyday", label: "Everyday" }, { id: "custom", label: "Custom" }].map(opt => (<button key={opt.id} className={`filter-chip ${recDays === opt.id ? "active" : ""}`} onClick={() => setRecDays(opt.id)}>{opt.label}</button>))}
            </div>
            {recDays === "custom" && (
              <div style={{ display: "flex", gap: 6 }}>{DAYS_OF_WEEK.map(day => (<button key={day} className={`filter-chip ${recCustomDays.includes(day) ? "active" : ""}`} onClick={() => toggleCustomDay(day)} style={{ minWidth: 44, justifyContent: "center" }}>{day}</button>))}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveRecurringMeal}>{editingRecId ? "Update" : "Save"}</button>
            {editingRecId && <button className="cozy-btn danger" onClick={() => { deleteRecurring(editingRecId); setAddingRecurring(false); }}>Delete</button>}
          </div>
        </div>
      </Modal>

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

      <Modal open={adding === "recipe"} onClose={() => setAdding(false)} title="Log a Recipe">
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {(recipes || []).map(r => (
            <button key={r.id} onClick={() => { logMealToMacros(today, r.name); setAdding(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 14px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--body)", borderBottom: "1px solid #f0e6d6" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{r.calories || 0} cal · {r.protein || 0}g protein</div>
              </div>
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>+ Log</span>
            </button>
          ))}
        </div>
      </Modal>

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
    </div>
  );
}
