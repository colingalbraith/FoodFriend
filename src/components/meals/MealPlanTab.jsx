import { useState, useRef, useEffect } from "react";
import { DAY_NAMES } from "../../constants/categories";
import { getWeekDates } from "../../utils/dateHelpers";
import Card from "../ui/Card";
import Modal from "../ui/Modal";

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

export default function MealPlanTab({ meals, saveMeals, items }) {
  const weekDates = getWeekDates();
  const today = new Date().toISOString().split("T")[0];
  const [editing, setEditing] = useState(null); // { date, type }
  const [mealInput, setMealInput] = useState("");
  const inputRef = useRef(null);

  const planned = Object.values(meals).filter(Boolean).length;

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
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [editing]);

  // Sort: today first, then remaining days in order
  const todayIdx = weekDates.indexOf(today);
  const sortedDates = todayIdx >= 0
    ? [weekDates[todayIdx], ...weekDates.slice(todayIdx + 1), ...weekDates.slice(0, todayIdx)]
    : weekDates;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>This Week</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{planned}/21 planned</div>
      </div>

      {/* Day cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sortedDates.map((date, di) => {
          const d = new Date(date);
          const dow = weekDates.indexOf(date);
          const isToday = date === today;
          const dayMeals = MEAL_TYPES.map(mt => ({
            ...mt,
            key: `${date}-${mt.id}`,
            value: meals[`${date}-${mt.id}`] || null,
          }));
          const filledCount = dayMeals.filter(m => m.value).length;

          return (
            <Card key={date} style={{
              padding: 0, overflow: "hidden",
              animation: `fadeIn 0.3s ease-out ${di * 40}ms both`,
              border: isToday ? "2px solid var(--accent)" : undefined,
            }}>
              {/* Day header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px",
                background: isToday ? "linear-gradient(135deg, rgba(196,149,106,0.12), rgba(196,149,106,0.06))" : undefined,
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: isToday ? "var(--accent)" : "var(--text)" }}>
                    {isToday ? "Today" : DAY_NAMES[dow]}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                    {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: filledCount === 3 ? "#6b8e6b" : "var(--muted)" }}>
                  {filledCount}/3
                </span>
              </div>

              {/* Meal rows */}
              {dayMeals.map((meal, mi) => (
                <div
                  key={meal.key}
                  onClick={() => openEdit(date, meal.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px",
                    borderTop: "1px solid #f0e6d6",
                    cursor: "pointer",
                    minHeight: 52,
                    transition: "background 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "var(--muted)",
                    width: 56, flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.3,
                  }}>
                    {meal.label}
                  </span>
                  {meal.value ? (
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                      {meal.value}
                    </span>
                  ) : (
                    <span style={{ flex: 1, fontSize: 13, color: "#ccc", fontWeight: 600 }}>
                      Tap to plan...
                    </span>
                  )}
                </div>
              ))}
            </Card>
          );
        })}
      </div>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={
        editing ? `${editing.date === today ? "Today" : DAY_NAMES[weekDates.indexOf(editing.date)]} — ${MEAL_TYPES.find(m => m.id === editing.type)?.label}` : ""
      }>
        {editing && (
          <div>
            <input
              ref={inputRef}
              className="cozy-input"
              placeholder="What's cooking?"
              value={mealInput}
              onChange={e => setMealInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveMeal(); }}
              style={{ marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveMeal}>
                {meals[`${editing.date}-${editing.type}`] ? "Update" : "Save"}
              </button>
              {meals[`${editing.date}-${editing.type}`] && (
                <button className="cozy-btn danger" onClick={clearMeal}>
                  Clear
                </button>
              )}
              <button className="cozy-btn secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
