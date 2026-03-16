import { useState, useRef, useEffect } from "react";
import { getWeekDates } from "../../utils/dateHelpers";
import { makeId } from "../../utils/itemHelpers";
import { recipePassesDiet } from "../../constants/dietaryFilters";
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

export default function MealPlanTab({
  meals, saveMeals, items, saveItems, recurring, saveRecurring,
  recipes, saveRecipes, macroLog, saveMacroLog, macroGoals, saveMacroGoals,
  userProfile, shopping, saveShopping, showToast,
}) {
  const weekDates = getWeekDates();
  const today = weekDates[0];
  const [section, setSection] = useState("plan");
  const goals = macroGoals || DEFAULT_GOALS;

  // ─── Shared helpers ───
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
  function getDayMacros(date) {
    const entries = (macroLog || []).filter(e => e.date === date);
    if (entries.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
    return {
      calories: entries.reduce((s, e) => s + (Number(e.calories) || 0), 0),
      protein: entries.reduce((s, e) => s + (Number(e.protein) || 0), 0),
      carbs: entries.reduce((s, e) => s + (Number(e.carbs) || 0), 0),
      fat: entries.reduce((s, e) => s + (Number(e.fat) || 0), 0),
      count: entries.length,
    };
  }
  function isLogged(date, mealName) {
    if (!macroLog || !mealName) return false;
    return macroLog.some(e => e.date === date && e.name.toLowerCase() === mealName.toLowerCase());
  }
  const fridgeNames = new Set((items || []).map(i => i.name.toLowerCase()));
  function pct(val, goal) { return goal > 0 ? Math.min(Math.round((val / goal) * 100), 100) : 0; }
  function ringColor(p) { return p >= 100 ? "#d48a7b" : p >= 75 ? "#c4a86a" : "#6b8e6b"; }

  // ─── Plan state ───
  const [editing, setEditing] = useState(null);
  const [mealInput, setMealInput] = useState("");
  const [showRecurring, setShowRecurring] = useState(false);
  const [addingRecurring, setAddingRecurring] = useState(false);
  const [recName, setRecName] = useState("");
  const [recType, setRecType] = useState("breakfast");
  const [recDays, setRecDays] = useState("weekdays");
  const [recCustomDays, setRecCustomDays] = useState([]);
  const [editingRecId, setEditingRecId] = useState(null);
  const inputRef = useRef(null);

  // ─── Track state ───
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

  // ─── Recipe state ───
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
  const [dietFilter, setDietFilter] = useState(false);
  const [canMakeFilter, setCanMakeFilter] = useState(false);

  // ─── Shopping state ───
  const [shopInput, setShopInput] = useState("");

  // ─── Computed ───
  const todayMacros = getDayMacros(today);
  const todayEntries = (macroLog || []).filter(e => e.date === today);

  // ─── Actions ───
  function cookMeal(date, mealName) {
    const recipe = findRecipe(mealName);
    saveMacroLog([{
      id: makeId(), date, name: mealName,
      calories: recipe?.calories || "0", protein: recipe?.protein || "0", carbs: "0", fat: "0",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }, ...(macroLog || [])]);
    if (recipe?.ingredients?.length > 0 && saveItems && items) {
      const remaining = [...items]; const deducted = [];
      for (const ing of recipe.ingredients) {
        const idx = remaining.findIndex(item => item.name.toLowerCase() === ing.toLowerCase());
        if (idx !== -1) { deducted.push(remaining[idx].name); remaining.splice(idx, 1); }
      }
      if (deducted.length > 0) {
        saveItems(remaining);
        showToast?.(`Cooked ${mealName} — removed ${deducted.length} item${deducted.length > 1 ? "s" : ""} from fridge`, () => { saveItems(items); saveMacroLog(macroLog || []); });
        return;
      }
    }
    showToast?.(`Logged ${mealName}`);
  }
  function logEntry() {
    if (!logName.trim()) return;
    saveMacroLog([{ id: makeId(), date: today, name: logName.trim(), calories: logCal || "0", protein: logPro || "0", carbs: logCarb || "0", fat: logFat || "0", time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }, ...(macroLog || [])]);
    setAdding(false); setLogName(""); setLogCal(""); setLogPro(""); setLogCarb(""); setLogFat("");
  }
  function logRecipe(recipeName) {
    const recipe = findRecipe(recipeName);
    saveMacroLog([{ id: makeId(), date: today, name: recipeName, calories: recipe?.calories || "0", protein: recipe?.protein || "0", carbs: "0", fat: "0", time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }, ...(macroLog || [])]);
    if (recipe?.ingredients?.length > 0 && saveItems && items) {
      const remaining = [...items]; const deducted = [];
      for (const ing of recipe.ingredients) { const idx = remaining.findIndex(item => item.name.toLowerCase() === ing.toLowerCase()); if (idx !== -1) { deducted.push(remaining[idx].name); remaining.splice(idx, 1); } }
      if (deducted.length > 0) { saveItems(remaining); showToast?.(`Logged ${recipeName} — removed ${deducted.length} item${deducted.length > 1 ? "s" : ""} from fridge`); return; }
    }
    setAdding(false);
  }
  function removeEntry(id) { saveMacroLog((macroLog || []).filter(e => e.id !== id)); }
  function openEdit(date, type) { setMealInput(meals[`${date}-${type}`] || ""); setEditing({ date, type }); }
  function saveMeal() { if (!editing) return; const key = `${editing.date}-${editing.type}`; const n = { ...meals }; if (mealInput.trim()) n[key] = mealInput.trim(); else delete n[key]; saveMeals(n); setEditing(null); setMealInput(""); }
  function clearMeal() { if (!editing) return; const n = { ...meals }; delete n[`${editing.date}-${editing.type}`]; saveMeals(n); setEditing(null); setMealInput(""); }
  useEffect(() => { if (editing) setTimeout(() => inputRef.current?.focus(), 100); }, [editing]);
  function generateShoppingList() {
    const missing = new Set();
    for (const date of weekDates) { for (const mt of MEAL_TYPES) { const mn = meals[`${date}-${mt.id}`] || getRecurringMeal(date, mt.id); if (!mn) continue; const r = findRecipe(mn); if (!r?.ingredients) continue; for (const ing of r.ingredients) { if (!fridgeNames.has(ing.toLowerCase())) missing.add(ing); } } }
    if (missing.size === 0) { showToast?.("All ingredients in your fridge!"); return; }
    const existing = new Set((shopping || []).map(i => i.name.toLowerCase()));
    const toAdd = [...missing].filter(n => !existing.has(n.toLowerCase()));
    if (toAdd.length === 0) { showToast?.("Already on your shopping list"); return; }
    saveShopping([...(shopping || []), ...toAdd.map(n => ({ id: makeId(), name: n, checked: false }))]); showToast?.(`Added ${toAdd.length} item${toAdd.length > 1 ? "s" : ""} to shopping list`);
  }
  // Recurring
  function openAddRecurring() { setRecName(""); setRecType("breakfast"); setRecDays("weekdays"); setRecCustomDays([]); setEditingRecId(null); setAddingRecurring(true); }
  function openEditRecurring(r) { setRecName(r.name); setRecType(r.type); const d = r.days.join(","); if (d === WEEKDAYS.join(",")) setRecDays("weekdays"); else if (d === WEEKEND.join(",")) setRecDays("weekend"); else if (d === EVERYDAY.join(",")) setRecDays("everyday"); else { setRecDays("custom"); setRecCustomDays(r.days); } setEditingRecId(r.id); setAddingRecurring(true); }
  function saveRecurringMeal() { if (!recName.trim()) return; const days = recDays === "weekdays" ? WEEKDAYS : recDays === "weekend" ? WEEKEND : recDays === "everyday" ? EVERYDAY : recCustomDays; if (days.length === 0) return; const entry = { id: editingRecId || makeId(), name: recName.trim(), type: recType, days }; const list = editingRecId ? recurringList.map(r => r.id === editingRecId ? entry : r) : [...recurringList, entry]; saveRecurring({ list }); setAddingRecurring(false); }
  function deleteRecurring(id) { saveRecurring({ list: recurringList.filter(r => r.id !== id) }); }
  function toggleCustomDay(day) { setRecCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]); }
  // Recipes
  const restrictions = userProfile?.restrictions || [];
  const hasDiet = restrictions.length > 0 && !restrictions.includes("None");
  let filteredRecipes = recipes || [];
  if (recipeSearch) { const q = recipeSearch.toLowerCase(); filteredRecipes = filteredRecipes.filter(r => r.name.toLowerCase().includes(q)); }
  if (dietFilter && hasDiet) filteredRecipes = filteredRecipes.filter(r => recipePassesDiet(r, restrictions));
  if (canMakeFilter) filteredRecipes = filteredRecipes.filter(r => r.ingredients?.length > 0 && r.ingredients.every(ing => fridgeNames.has(ing.toLowerCase())));
  function openAddRecipe() { setRecipeName(""); setRecipeIngredients(""); setRecipeNotes(""); setRecipeCalories(""); setRecipeProtein(""); setRecipeTime(""); setEditingRecipe(null); setAddingRecipe(true); }
  function openEditRecipe(r) { setRecipeName(r.name); setRecipeIngredients(r.ingredients.join(", ")); setRecipeNotes(r.notes || ""); setRecipeCalories(r.calories || ""); setRecipeProtein(r.protein || ""); setRecipeTime(r.time || ""); setEditingRecipe(r.id); setAddingRecipe(true); }
  function saveRecipe() { if (!recipeName.trim()) return; const ingredients = recipeIngredients.split(",").map(s => s.trim()).filter(Boolean); const recipe = { id: editingRecipe || makeId(), name: recipeName.trim(), ingredients, notes: recipeNotes.trim(), calories: recipeCalories.trim(), protein: recipeProtein.trim(), time: recipeTime.trim(), createdAt: editingRecipe ? (recipes || []).find(r => r.id === editingRecipe)?.createdAt : new Date().toISOString() }; const isDefault = editingRecipe && editingRecipe.startsWith("dr-") || editingRecipe?.startsWith("r1-") || editingRecipe?.startsWith("r2-") || editingRecipe?.startsWith("r3-"); if (editingRecipe && !isDefault) { const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]"); saveRecipes(current.map(r => r.id === editingRecipe ? recipe : r)); } else { recipe.id = makeId(); const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]"); saveRecipes([recipe, ...current]); } setAddingRecipe(false); }
  function deleteRecipe(id) { const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]"); saveRecipes(current.filter(r => r.id !== id)); }
  // Shopping
  function shopAdd(e) { e?.preventDefault(); if (!shopInput.trim()) return; saveShopping([...(shopping || []), { id: makeId(), name: shopInput.trim(), checked: false }]); setShopInput(""); }
  function shopToggle(id) { saveShopping((shopping || []).map(i => i.id === id ? { ...i, checked: !i.checked } : i)); }
  function shopRemove(id) { saveShopping((shopping || []).filter(i => i.id !== id)); }
  function shopClearChecked() { saveShopping((shopping || []).filter(i => !i.checked)); }
  const shopUnchecked = (shopping || []).filter(i => !i.checked);
  const shopChecked = (shopping || []).filter(i => i.checked);

  function saveGoals() { if (saveMacroGoals) saveMacroGoals({ calories: Number(goalCal) || 2000, protein: Number(goalPro) || 150, carbs: Number(goalCarb) || 250, fat: Number(goalFat) || 65 }); setEditingGoals(false); }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Section toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ id: "plan", label: "Plan" }, { id: "recipes", label: "Recipes" }, { id: "shop", label: "Shop" }].map(s => (
          <button key={s.id} className={`filter-chip ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>
            {s.label}{s.id === "shop" && shopUnchecked.length > 0 ? ` (${shopUnchecked.length})` : ""}
          </button>
        ))}
      </div>

      {/* ═══ PLAN ═══ */}
      {section === "plan" && (
        <>
          {/* Today macro summary */}
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Today</span>
              <button className="filter-chip" onClick={() => { setGoalCal(String(goals.calories)); setGoalPro(String(goals.protein)); setGoalCarb(String(goals.carbs)); setGoalFat(String(goals.fat)); setEditingGoals(true); }} style={{ fontSize: 10, padding: "3px 8px", minHeight: 24 }}>Goals</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, textAlign: "center" }}>
              {[{ label: "Cal", val: todayMacros.calories, goal: goals.calories, unit: "" }, { label: "Protein", val: todayMacros.protein, goal: goals.protein, unit: "g" }, { label: "Carbs", val: todayMacros.carbs, goal: goals.carbs, unit: "g" }, { label: "Fat", val: todayMacros.fat, goal: goals.fat, unit: "g" }].map(m => {
                const p = pct(m.val, m.goal);
                return (
                  <div key={m.label}>
                    <div style={{ position: "relative", width: 44, height: 44, margin: "0 auto 3px" }}>
                      <svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="#e8dcc8" strokeWidth="4" /><circle cx="22" cy="22" r="18" fill="none" stroke={ringColor(p)} strokeWidth="4" strokeDasharray={`${p * 1.131} 113.1`} strokeLinecap="round" transform="rotate(-90 22 22)" style={{ transition: "stroke-dasharray 0.5s ease" }} /></svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{p}%</div>
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>{m.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{Math.round(m.val)}<span style={{ color: "var(--muted)", fontSize: 8 }}>/{m.goal}{m.unit}</span></div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <button className="cozy-btn primary" style={{ flex: 1, fontSize: 12, padding: "8px 12px", minHeight: 36 }} onClick={() => { setAdding("manual"); setLogName(""); setLogCal(""); setLogPro(""); setLogCarb(""); setLogFat(""); }}>Log Food</button>
              <button className="cozy-btn secondary" style={{ flex: 1, fontSize: 12, padding: "8px 12px", minHeight: 36 }} onClick={() => setAdding("recipe")}>From Recipe</button>
            </div>
          </Card>

          {/* Generate shopping list */}
          <button className="cozy-btn secondary full" onClick={generateShoppingList} style={{ marginBottom: 14, fontSize: 12 }}>Add missing ingredients to shopping list</button>

          {/* Day cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {weekDates.map((date, di) => {
              const d = new Date(date + "T12:00:00");
              const isToday = date === today;
              const dayMeals = MEAL_TYPES.map(mt => { const key = `${date}-${mt.id}`; return { ...mt, key, value: meals[key] || null, recurring: !meals[key] ? getRecurringMeal(date, mt.id) : null }; });
              const filledCount = dayMeals.filter(m => m.value || m.recurring).length;
              const dm = getDayMacros(date);

              return (
                <Card key={date} style={{ padding: 0, overflow: "hidden", animation: `fadeIn 0.3s ease-out ${di * 40}ms both`, border: isToday ? "2px solid var(--accent)" : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: isToday ? "linear-gradient(135deg, rgba(196,149,106,0.12), rgba(196,149,106,0.06))" : undefined }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: isToday ? "var(--accent)" : "var(--text)" }}>{isToday ? "Today" : DAYS_OF_WEEK[d.getDay()]}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {dm.calories > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: dm.calories > goals.calories ? "#d48a7b" : "var(--muted)" }}>{dm.calories}cal</span>}
                      <span style={{ fontSize: 11, fontWeight: 700, color: filledCount === 3 ? "#6b8e6b" : "var(--muted)" }}>{filledCount}/3</span>
                    </div>
                  </div>
                  {/* Calorie progress bar */}
                  {dm.calories > 0 && (
                    <div style={{ height: 3, background: "#e8dcc8", margin: "0 16px" }}>
                      <div style={{ height: "100%", width: `${Math.min((dm.calories / goals.calories) * 100, 100)}%`, background: dm.calories > goals.calories ? "#d48a7b" : "#6b8e6b", borderRadius: 2, transition: "width 0.4s ease" }} />
                    </div>
                  )}
                  {dayMeals.map(meal => {
                    const mealName = meal.value || meal.recurring;
                    const recipe = findRecipe(mealName);
                    const logged = isLogged(date, mealName);
                    return (
                      <div key={meal.key} style={{ padding: "12px 16px", borderTop: "1px solid #f0e6d6", minHeight: 48 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => openEdit(date, meal.id)}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{meal.label}</div>
                            {meal.value ? <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{meal.value}</div>
                              : meal.recurring ? <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", fontStyle: "italic", marginTop: 2 }}>{meal.recurring} <span style={{ fontSize: 9, color: "var(--accent)" }}>recurring</span></div>
                              : <div style={{ fontSize: 13, color: "#ccc", fontWeight: 600, marginTop: 2 }}>Tap to plan...</div>}
                            {recipe?.calories && <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{recipe.calories} cal · {recipe.protein || 0}g protein</div>}
                          </div>
                          {mealName && <button onClick={() => { if (!logged) cookMeal(date, mealName); }} disabled={logged} style={{ background: logged ? "#edf5ed" : "var(--card)", border: `1.5px solid ${logged ? "#b8d4b8" : "#e0cdb5"}`, borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 700, flexShrink: 0, color: logged ? "#4a7a4a" : "var(--muted)", fontFamily: "var(--body)", cursor: logged ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}>{logged ? "Logged" : "Cook"}</button>}
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
                {recurringList.map(r => (<Card key={r.id} style={{ padding: 0, marginBottom: 6 }}><div onClick={() => openEditRecurring(r)} style={{ padding: "12px 16px", cursor: "pointer" }}><div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{MEAL_TYPES.find(m => m.id === r.type)?.label} · {r.days.join(", ")}</div></div></Card>))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ RECIPES ═══ */}
      {section === "recipes" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>Recipes</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {hasDiet && <button className={`filter-chip ${dietFilter ? "active" : ""}`} onClick={() => setDietFilter(!dietFilter)} style={{ fontSize: 10, padding: "4px 10px", minHeight: 26 }}>{restrictions.filter(r => r !== "None").join(", ")}</button>}
              <button className={`filter-chip ${canMakeFilter ? "active" : ""}`} onClick={() => setCanMakeFilter(!canMakeFilter)} style={{ fontSize: 10, padding: "4px 10px", minHeight: 26 }}>Can make now</button>
            </div>
          </div>
          <input className="cozy-input" placeholder="Search recipes..." value={recipeSearch} onChange={e => { setRecipeSearch(e.target.value); setRecipeLimit(20); }} style={{ marginBottom: 10 }} />
          <button className="cozy-btn primary full" onClick={openAddRecipe} style={{ marginBottom: 14 }}>Add Recipe</button>
          {filteredRecipes.length === 0 ? <Card style={{ padding: 20, textAlign: "center" }}><div style={{ fontSize: 13, color: "var(--muted)" }}>{recipeSearch || dietFilter || canMakeFilter ? "No matching recipes" : "No recipes yet"}</div></Card> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredRecipes.slice(0, recipeLimit).map((r, i) => { const haveCount = r.ingredients.filter(ing => fridgeNames.has(ing.toLowerCase())).length; const total = r.ingredients.length; const canMake = total > 0 && haveCount === total; return (
                <Card key={r.id} style={{ padding: 0, overflow: "hidden", animation: `fadeIn 0.3s ease-out ${i * 40}ms both` }}>
                  <div onClick={() => openEditRecipe(r)} style={{ padding: 16, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}><div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700 }}>{r.name}</div>{r.time && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, flexShrink: 0 }}>{r.time}</span>}</div>
                    {(r.calories || r.protein) && <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>{r.calories && <div><span style={{ fontSize: 15, fontWeight: 800 }}>{r.calories}</span><span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 2 }}>cal</span></div>}{r.protein && <div><span style={{ fontSize: 15, fontWeight: 800 }}>{r.protein}g</span><span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 2 }}>protein</span></div>}</div>}
                    {total > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{r.ingredients.map((ing, j) => { const have = fridgeNames.has(ing.toLowerCase()); return <span key={j} style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, background: have ? "#edf5ed" : "#fef3e2", color: have ? "#4a7a4a" : "#8b6d30", border: `1px solid ${have ? "#b8d4b8" : "#e8d0a8"}` }}>{ing}</span>; })}</div>}
                    {total > 0 && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><div style={{ fontSize: 11, fontWeight: 700, color: canMake ? "#4a7a4a" : "var(--muted)" }}>{canMake ? "Ready to cook" : `${haveCount}/${total} in fridge`}</div>{!canMake && saveShopping && <button className="cozy-btn secondary" style={{ fontSize: 10, padding: "4px 10px", minHeight: 28, borderRadius: 8, flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); const miss = r.ingredients.filter(ing => !fridgeNames.has(ing.toLowerCase())); const ex = new Set((shopping || []).map(i => i.name.toLowerCase())); const add = miss.filter(n => !ex.has(n.toLowerCase())); if (add.length > 0) saveShopping([...(shopping || []), ...add.map(n => ({ id: makeId(), name: n, checked: false }))]); }}>+ Shop</button>}</div>}
                    {r.notes && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>{r.notes}</div>}
                  </div>
                </Card>); })}
              {filteredRecipes.length > recipeLimit && <button className="cozy-btn secondary full" onClick={() => setRecipeLimit(l => l + 20)} style={{ marginTop: 4 }}>Show More ({filteredRecipes.length - recipeLimit} remaining)</button>}
            </div>
          )}
        </>
      )}

      {/* ═══ SHOP ═══ */}
      {section === "shop" && (
        <>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Shopping List</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input className="cozy-input" placeholder="Add an item..." value={shopInput} onChange={e => setShopInput(e.target.value)} onKeyDown={e => e.key === "Enter" && shopAdd(e)} />
            <button className="cozy-btn primary" onClick={shopAdd}>+</button>
          </div>
          <Card style={{ padding: 6 }}>
            {(shopping || []).length === 0 ? <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>Nothing to buy yet!</div> : (
              <>
                {shopUnchecked.map((item, idx) => (<div key={item.id} className="shopping-item" style={{ borderBottom: idx < shopUnchecked.length - 1 ? "1px solid #f0e6d6" : "none" }}><div onClick={() => shopToggle(item.id)} style={{ width: 26, height: 26, borderRadius: 8, border: "2px solid #d4b896", cursor: "pointer", flexShrink: 0, WebkitTapHighlightColor: "transparent" }} /><span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{item.name}</span><button className="cozy-btn danger" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, minHeight: 36 }} onClick={() => shopRemove(item.id)}>✕</button></div>))}
                {shopChecked.length > 0 && (<><div style={{ padding: "10px 14px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Done ({shopChecked.length})</span><button className="cozy-btn secondary" style={{ fontSize: 10, padding: "3px 8px" }} onClick={shopClearChecked}>Clear</button></div>{shopChecked.map(item => (<div key={item.id} className="shopping-item" style={{ opacity: 0.4 }}><div onClick={() => shopToggle(item.id)} style={{ width: 26, height: 26, borderRadius: 8, border: "2px solid #6b8e6b", background: "#6b8e6b", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800, WebkitTapHighlightColor: "transparent" }}>✓</div><span style={{ flex: 1, fontSize: 14, textDecoration: "line-through" }}>{item.name}</span></div>))}</>)}
              </>
            )}
          </Card>
        </>
      )}

      {/* ═══ MODALS ═══ */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `${editing.date === today ? "Today" : DAYS_OF_WEEK[new Date(editing.date + "T12:00:00").getDay()]} — ${MEAL_TYPES.find(m => m.id === editing.type)?.label}` : ""}>
        {editing && (<div>
          {!meals[`${editing.date}-${editing.type}`] && getRecurringMeal(editing.date, editing.type) && <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 10 }}>Recurring: {getRecurringMeal(editing.date, editing.type)} — type below to override</div>}
          <input ref={inputRef} className="cozy-input" placeholder="What's cooking?" value={mealInput} onChange={e => setMealInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveMeal(); }} style={{ marginBottom: 10 }} />
          {recipes && recipes.length > 0 && !mealInput && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Quick pick</div><div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxHeight: 100, overflowY: "auto" }}>{recipes.map(r => (<button key={r.id} className="quick-chip" onClick={() => setMealInput(r.name)} style={{ fontSize: 12, padding: "5px 10px" }}>{r.name}</button>))}</div></div>}
          {mealInput && findRecipe(mealInput) && <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, padding: "6px 10px", background: "#f5f0e8", borderRadius: 8 }}>{findRecipe(mealInput).calories} cal · {findRecipe(mealInput).protein || 0}g protein</div>}
          <div style={{ display: "flex", gap: 8 }}><button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveMeal}>{meals[`${editing.date}-${editing.type}`] ? "Update" : "Save"}</button>{meals[`${editing.date}-${editing.type}`] && <button className="cozy-btn danger" onClick={clearMeal}>Clear</button>}<button className="cozy-btn secondary" onClick={() => setEditing(null)}>Cancel</button></div>
        </div>)}
      </Modal>
      <Modal open={addingRecurring} onClose={() => setAddingRecurring(false)} title={editingRecId ? "Edit Recurring" : "Add Recurring Meal"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="cozy-input" placeholder="Meal name" value={recName} onChange={e => setRecName(e.target.value)} />
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Meal</label><div style={{ display: "flex", gap: 6 }}>{MEAL_TYPES.map(mt => (<button key={mt.id} className={`filter-chip ${recType === mt.id ? "active" : ""}`} onClick={() => setRecType(mt.id)}>{mt.label}</button>))}</div></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Repeats on</label><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{[{ id: "weekdays", label: "Weekdays" }, { id: "weekend", label: "Weekend" }, { id: "everyday", label: "Everyday" }, { id: "custom", label: "Custom" }].map(opt => (<button key={opt.id} className={`filter-chip ${recDays === opt.id ? "active" : ""}`} onClick={() => setRecDays(opt.id)}>{opt.label}</button>))}</div>{recDays === "custom" && <div style={{ display: "flex", gap: 6 }}>{DAYS_OF_WEEK.map(day => (<button key={day} className={`filter-chip ${recCustomDays.includes(day) ? "active" : ""}`} onClick={() => toggleCustomDay(day)} style={{ minWidth: 44, justifyContent: "center" }}>{day}</button>))}</div>}</div>
          <div style={{ display: "flex", gap: 8 }}><button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveRecurringMeal}>{editingRecId ? "Update" : "Save"}</button>{editingRecId && <button className="cozy-btn danger" onClick={() => { deleteRecurring(editingRecId); setAddingRecurring(false); }}>Delete</button>}</div>
        </div>
      </Modal>
      <Modal open={adding === "manual"} onClose={() => setAdding(false)} title="Log Food">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="cozy-input" placeholder="What did you eat?" value={logName} onChange={e => setLogName(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label><input className="cozy-input" placeholder="0" value={logCal} onChange={e => setLogCal(e.target.value)} inputMode="numeric" /></div><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label><input className="cozy-input" placeholder="0" value={logPro} onChange={e => setLogPro(e.target.value)} inputMode="numeric" /></div><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Carbs (g)</label><input className="cozy-input" placeholder="0" value={logCarb} onChange={e => setLogCarb(e.target.value)} inputMode="numeric" /></div><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Fat (g)</label><input className="cozy-input" placeholder="0" value={logFat} onChange={e => setLogFat(e.target.value)} inputMode="numeric" /></div></div>
          <button className="cozy-btn primary full" onClick={logEntry} disabled={!logName.trim()}>Log</button>
        </div>
      </Modal>
      <Modal open={adding === "recipe"} onClose={() => setAdding(false)} title="Log a Recipe">
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>{(recipes || []).map(r => (<button key={r.id} onClick={() => { logRecipe(r.name); setAdding(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 14px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--body)", borderBottom: "1px solid #f0e6d6" }}><div><div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{r.calories || 0} cal · {r.protein || 0}g protein</div></div><span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>+ Log</span></button>))}</div>
      </Modal>
      <Modal open={editingGoals} onClose={() => setEditingGoals(false)} title="Daily Goals">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label><input className="cozy-input" value={goalCal} onChange={e => setGoalCal(e.target.value)} inputMode="numeric" /></div><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label><input className="cozy-input" value={goalPro} onChange={e => setGoalPro(e.target.value)} inputMode="numeric" /></div><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Carbs (g)</label><input className="cozy-input" value={goalCarb} onChange={e => setGoalCarb(e.target.value)} inputMode="numeric" /></div><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Fat (g)</label><input className="cozy-input" value={goalFat} onChange={e => setGoalFat(e.target.value)} inputMode="numeric" /></div></div><button className="cozy-btn primary full" onClick={saveGoals}>Save Goals</button></div>
      </Modal>
      <Modal open={addingRecipe} onClose={() => setAddingRecipe(false)} title={editingRecipe ? "Edit Recipe" : "Add Recipe"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="cozy-input" placeholder="Recipe name" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Ingredients (comma separated)</label><textarea className="cozy-input" rows={3} placeholder="Chicken, Rice, Soy Sauce..." value={recipeIngredients} onChange={e => setRecipeIngredients(e.target.value)} style={{ resize: "vertical", fontFamily: "var(--body)" }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label><input className="cozy-input" placeholder="450" value={recipeCalories} onChange={e => setRecipeCalories(e.target.value)} inputMode="numeric" /></div><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label><input className="cozy-input" placeholder="35" value={recipeProtein} onChange={e => setRecipeProtein(e.target.value)} inputMode="numeric" /></div><div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Time</label><input className="cozy-input" placeholder="30 min" value={recipeTime} onChange={e => setRecipeTime(e.target.value)} /></div></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Notes</label><textarea className="cozy-input" rows={2} placeholder="Tips, variations..." value={recipeNotes} onChange={e => setRecipeNotes(e.target.value)} style={{ resize: "vertical", fontFamily: "var(--body)" }} /></div>
          <div style={{ display: "flex", gap: 8 }}><button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveRecipe}>{editingRecipe ? "Update" : "Save Recipe"}</button>{editingRecipe && <button className="cozy-btn danger" onClick={() => { deleteRecipe(editingRecipe); setAddingRecipe(false); }}>Delete</button>}</div>
        </div>
      </Modal>
    </div>
  );
}
