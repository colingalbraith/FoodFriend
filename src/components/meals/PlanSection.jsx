import { useState, useRef, useEffect } from "react";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import { makeId } from "../../utils/itemHelpers";

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKEND = ["Sat", "Sun"];
const EVERYDAY = [...DAYS_OF_WEEK];

export default function PlanSection({
  meals, saveMeals, weekDates, today, recurring, saveRecurring,
  recipes, macroLog, saveMacroLog, goals, todayTotals, todayEntries,
  items, saveItems, shopping, saveShopping, showToast,
}) {
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

  const fridgeNames = new Set((items || []).map(i => i.name.toLowerCase()));

  function cookMeal(date, mealName) {
    const recipe = findRecipe(mealName);
    // Log to macros
    saveMacroLog([{
      id: makeId(), date, name: mealName,
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
        saveItems(remaining);
        showToast?.(`Cooked ${mealName} — removed ${deducted.length} item${deducted.length > 1 ? "s" : ""} from fridge`, () => {
          saveItems(items); // undo: restore original items
          saveMacroLog((macroLog || [])); // undo: restore original log
        });
        return;
      }
    }
    showToast?.(`Logged ${mealName}`);
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

  // Generate shopping list from this week's meals
  function generateShoppingList() {
    const missingIngredients = new Set();
    for (const date of weekDates) {
      for (const mt of MEAL_TYPES) {
        const mealName = meals[`${date}-${mt.id}`] || getRecurringMeal(date, mt.id);
        if (!mealName) continue;
        const recipe = findRecipe(mealName);
        if (!recipe?.ingredients) continue;
        for (const ing of recipe.ingredients) {
          if (!fridgeNames.has(ing.toLowerCase())) {
            missingIngredients.add(ing);
          }
        }
      }
    }
    if (missingIngredients.size === 0) {
      showToast?.("All ingredients are in your fridge!");
      return;
    }
    const existingNames = new Set((shopping || []).map(i => i.name.toLowerCase()));
    const toAdd = [...missingIngredients].filter(n => !existingNames.has(n.toLowerCase()));
    if (toAdd.length === 0) {
      showToast?.("Missing items already on your shopping list");
      return;
    }
    saveShopping([...(shopping || []), ...toAdd.map(n => ({ id: makeId(), name: n, checked: false }))]);
    showToast?.(`Added ${toAdd.length} missing ingredient${toAdd.length > 1 ? "s" : ""} to shopping list`);
  }

  return (
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

      {/* Generate shopping list button */}
      {planned > 0 && (
        <button className="cozy-btn secondary full" onClick={generateShoppingList} style={{ marginBottom: 14, fontSize: 12 }}>
          Add missing ingredients to shopping list
        </button>
      )}

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
                // Ingredient availability
                const ingCount = recipe?.ingredients?.length || 0;
                const haveCount = ingCount > 0 ? recipe.ingredients.filter(ing => fridgeNames.has(ing.toLowerCase())).length : 0;
                const allHave = ingCount > 0 && haveCount === ingCount;
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
                        {mealName && ingCount > 0 && (
                          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3, color: allHave ? "#4a7a4a" : "#b8860b" }}>
                            {allHave ? "All ingredients in fridge" : `${haveCount}/${ingCount} ingredients available`}
                          </div>
                        )}
                      </div>
                      {mealName && (
                        <button onClick={() => { if (!logged) cookMeal(date, mealName); }} disabled={logged}
                          style={{ background: logged ? "#edf5ed" : "var(--card)", border: `1.5px solid ${logged ? "#b8d4b8" : "#e0cdb5"}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 14, color: logged ? "#4a7a4a" : "var(--muted)", fontFamily: "var(--body)", cursor: logged ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}>
                          {logged ? "Logged" : "Cook"}
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

      {/* Edit meal modal */}
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

      {/* Recurring meal modal */}
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
    </>
  );
}
