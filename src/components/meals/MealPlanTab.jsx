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

export default function MealPlanTab({ meals, saveMeals, items, recurring, saveRecurring }) {
  const weekDates = getWeekDates();
  const today = weekDates[0];
  const [editing, setEditing] = useState(null);
  const [mealInput, setMealInput] = useState("");
  const [showRecurring, setShowRecurring] = useState(false);
  const [addingRecurring, setAddingRecurring] = useState(false);
  const [recName, setRecName] = useState("");
  const [recType, setRecType] = useState("breakfast");
  const [recDays, setRecDays] = useState("weekdays"); // "weekdays" | "weekend" | "everyday" | "custom"
  const [recCustomDays, setRecCustomDays] = useState([]);
  const [editingRecId, setEditingRecId] = useState(null);
  const inputRef = useRef(null);

  const recurringList = recurring?.list || [];

  // Get the day name for a date
  function getDayName(dateStr) {
    return DAYS_OF_WEEK[new Date(dateStr).getDay()];
  }

  // Get recurring meal for a date + meal type
  function getRecurringMeal(dateStr, mealType) {
    const dayName = getDayName(dateStr);
    const matches = recurringList.filter(r => r.type === mealType && r.days.includes(dayName));
    return matches.length > 0 ? matches[0].name : null;
  }

  const planned = weekDates.flatMap(d => MEAL_TYPES.map(mt => {
    const key = `${d}-${mt.id}`;
    return meals[key] || getRecurringMeal(d, mt.id) ? key : null;
  })).filter(Boolean).length;

  function openEdit(date, type) {
    const key = `${date}-${type}`;
    setMealInput(meals[key] || "");
    setEditing({ date, type });
  }

  function saveMeal() {
    if (!editing) return;
    const key = `${editing.date}-${editing.type}`;
    const n = { ...meals };
    if (mealInput.trim()) n[key] = mealInput.trim(); else delete n[key];
    saveMeals(n);
    setEditing(null);
    setMealInput("");
  }

  function clearMeal() {
    if (!editing) return;
    const key = `${editing.date}-${editing.type}`;
    const n = { ...meals };
    delete n[key];
    saveMeals(n);
    setEditing(null);
    setMealInput("");
  }

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 100);
  }, [editing]);

  function openAddRecurring() {
    setRecName(""); setRecType("breakfast"); setRecDays("weekdays"); setRecCustomDays([]);
    setEditingRecId(null);
    setAddingRecurring(true);
  }

  function openEditRecurring(r) {
    setRecName(r.name); setRecType(r.type);
    const dStr = r.days.join(",");
    if (dStr === WEEKDAYS.join(",")) setRecDays("weekdays");
    else if (dStr === WEEKEND.join(",")) setRecDays("weekend");
    else if (dStr === EVERYDAY.join(",")) setRecDays("everyday");
    else { setRecDays("custom"); setRecCustomDays(r.days); }
    setEditingRecId(r.id);
    setAddingRecurring(true);
  }

  function saveRecurringMeal() {
    if (!recName.trim()) return;
    const days = recDays === "weekdays" ? WEEKDAYS
      : recDays === "weekend" ? WEEKEND
      : recDays === "everyday" ? EVERYDAY
      : recCustomDays;
    if (days.length === 0) return;

    const entry = { id: editingRecId || makeId(), name: recName.trim(), type: recType, days };
    const list = editingRecId
      ? recurringList.map(r => r.id === editingRecId ? entry : r)
      : [...recurringList, entry];
    saveRecurring({ list });
    setAddingRecurring(false);
  }

  function deleteRecurring(id) {
    saveRecurring({ list: recurringList.filter(r => r.id !== id) });
  }

  function toggleCustomDay(day) {
    setRecCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>This Week</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{planned}/21 planned</div>
      </div>

      {/* Day cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {weekDates.map((date, di) => {
          const d = new Date(date);
          const dow = d.getDay();
          const isToday = date === today;
          const dayMeals = MEAL_TYPES.map(mt => {
            const key = `${date}-${mt.id}`;
            const explicit = meals[key];
            const rec = !explicit ? getRecurringMeal(date, mt.id) : null;
            return { ...mt, key, value: explicit || null, recurring: rec };
          });
          const filledCount = dayMeals.filter(m => m.value || m.recurring).length;

          return (
            <Card key={date} style={{
              padding: 0, overflow: "hidden",
              animation: `fadeIn 0.3s ease-out ${di * 40}ms both`,
              border: isToday ? "2px solid var(--accent)" : undefined,
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px",
                background: isToday ? "linear-gradient(135deg, rgba(196,149,106,0.12), rgba(196,149,106,0.06))" : undefined,
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: isToday ? "var(--accent)" : "var(--text)" }}>
                    {isToday ? "Today" : DAYS_OF_WEEK[dow]}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                    {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: filledCount === 3 ? "#6b8e6b" : "var(--muted)" }}>
                  {filledCount}/3
                </span>
              </div>

              {dayMeals.map(meal => (
                <div key={meal.key} onClick={() => openEdit(date, meal.id)} style={{
                  padding: "14px 16px", borderTop: "1px solid #f0e6d6", cursor: "pointer",
                  minHeight: 56, WebkitTapHighlightColor: "transparent",
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: "var(--muted)",
                    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
                  }}>
                    {meal.label}
                  </div>
                  {meal.value ? (
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{meal.value}</div>
                  ) : meal.recurring ? (
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", fontStyle: "italic" }}>
                      {meal.recurring} <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>recurring</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, color: "#ccc", fontWeight: 600 }}>Tap to plan...</div>
                  )}
                </div>
              ))}
            </Card>
          );
        })}
      </div>

      {/* Recurring meals section */}
      <div style={{ marginTop: 24 }}>
        <button onClick={() => setShowRecurring(!showRecurring)} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "4px 0",
          fontFamily: "var(--body)", WebkitTapHighlightColor: "transparent",
        }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Recurring Meals</span>
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
            {recurringList.length} set
          </span>
          <span style={{
            marginLeft: "auto", fontSize: 10, color: "var(--muted)",
            transition: "transform 0.25s ease", transform: showRecurring ? "rotate(0deg)" : "rotate(-90deg)",
          }}>▼</span>
        </button>

        {showRecurring && (
          <div style={{ marginTop: 8, animation: "fadeIn 0.25s ease-out" }}>
            <button className="cozy-btn primary full" onClick={openAddRecurring} style={{ marginBottom: 10 }}>
              Add Recurring Meal
            </button>

            {recurringList.length === 0 ? (
              <Card style={{ padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  No recurring meals yet. Set meals that repeat every week.
                </div>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recurringList.map(r => (
                  <Card key={r.id} style={{ padding: 0, overflow: "hidden" }}>
                    <div onClick={() => openEditRecurring(r)} style={{
                      padding: "12px 16px", cursor: "pointer", WebkitTapHighlightColor: "transparent",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                            {MEAL_TYPES.find(m => m.id === r.type)?.label} · {r.days.join(", ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit meal modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={
        editing ? `${editing.date === today ? "Today" : DAYS_OF_WEEK[new Date(editing.date).getDay()]} — ${MEAL_TYPES.find(m => m.id === editing.type)?.label}` : ""
      }>
        {editing && (
          <div>
            {!meals[`${editing.date}-${editing.type}`] && getRecurringMeal(editing.date, editing.type) && (
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 10 }}>
                Recurring: {getRecurringMeal(editing.date, editing.type)} — type below to override for this day
              </div>
            )}
            <input ref={inputRef} className="cozy-input" placeholder="What's cooking?"
              value={mealInput} onChange={e => setMealInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveMeal(); }}
              style={{ marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveMeal}>
                {meals[`${editing.date}-${editing.type}`] ? "Update" : "Save"}
              </button>
              {meals[`${editing.date}-${editing.type}`] && (
                <button className="cozy-btn danger" onClick={clearMeal}>Clear</button>
              )}
              <button className="cozy-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit recurring modal */}
      <Modal open={addingRecurring} onClose={() => setAddingRecurring(false)} title={editingRecId ? "Edit Recurring" : "Add Recurring Meal"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="cozy-input" placeholder="Meal name (e.g. Cereal, Eggs & Toast)" value={recName}
            onChange={e => setRecName(e.target.value)} />

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Meal</label>
            <div style={{ display: "flex", gap: 6 }}>
              {MEAL_TYPES.map(mt => (
                <button key={mt.id} className={`filter-chip ${recType === mt.id ? "active" : ""}`}
                  onClick={() => setRecType(mt.id)}>{mt.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Repeats on</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {[
                { id: "weekdays", label: "Weekdays" },
                { id: "weekend", label: "Weekend" },
                { id: "everyday", label: "Everyday" },
                { id: "custom", label: "Custom" },
              ].map(opt => (
                <button key={opt.id} className={`filter-chip ${recDays === opt.id ? "active" : ""}`}
                  onClick={() => setRecDays(opt.id)}>{opt.label}</button>
              ))}
            </div>
            {recDays === "custom" && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAYS_OF_WEEK.map(day => (
                  <button key={day} className={`filter-chip ${recCustomDays.includes(day) ? "active" : ""}`}
                    onClick={() => toggleCustomDay(day)} style={{ minWidth: 44, justifyContent: "center" }}>{day}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveRecurringMeal}>
              {editingRecId ? "Update" : "Save"}
            </button>
            {editingRecId && (
              <button className="cozy-btn danger" onClick={() => { deleteRecurring(editingRecId); setAddingRecurring(false); }}>
                Delete
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
