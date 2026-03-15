import { useState } from "react";
import { DAY_NAMES } from "../../constants/categories";
import { getWeekDates } from "../../utils/dateHelpers";

const MEAL_TYPES = [
  { id: "breakfast", label: "Brekky" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

export default function MealPlanTab({ meals, saveMeals, items }) {
  const weekDates = getWeekDates();
  const [editing, setEditing] = useState(null);
  const [mealInput, setMealInput] = useState("");

  function setMeal(date, type, value) {
    const key = `${date}-${type}`;
    const n = { ...meals };
    if (value) n[key] = value; else delete n[key];
    saveMeals(n);
    setEditing(null);
    setMealInput("");
  }

  function startEdit(date, type) {
    const key = `${date}-${type}`;
    setEditing(key);
    setMealInput(meals[key] || "");
  }

  const planned = Object.values(meals).filter(Boolean).length;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>This Week</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{planned}/21 planned</div>
      </div>

      <div style={{ overflowX: "auto", marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: `64px repeat(7, minmax(80px, 1fr))`, gap: 6, minWidth: 640 }}>
          <div />
          {weekDates.map((date, i) => {
            const d = new Date(date);
            const isToday = date === new Date().toISOString().split("T")[0];
            return (
              <div key={date} style={{
                textAlign: "center", padding: "6px 2px", borderRadius: 10,
                background: isToday ? "linear-gradient(135deg, #c4956a, #a8784e)" : "transparent",
                color: isToday ? "white" : "var(--muted)",
              }}>
                <div style={{ fontWeight: 800, fontSize: 12 }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize: 10 }}>{d.getDate()}</div>
              </div>
            );
          })}
          {MEAL_TYPES.map(mt => (
            <>
              <div key={mt.id} style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1, fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
                {mt.label}
              </div>
              {weekDates.map(date => {
                const key = `${date}-${mt.id}`;
                const val = meals[key];
                const isEditing = editing === key;
                return (
                  <div key={key}>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <input className="cozy-input" style={{ fontSize: 11, padding: "5px 8px" }}
                          value={mealInput} onChange={e => setMealInput(e.target.value)} autoFocus placeholder="What's cooking?"
                          onKeyDown={e => { if (e.key === "Enter") setMeal(date, mt.id, mealInput); if (e.key === "Escape") setEditing(null); }}
                        />
                        <div style={{ display: "flex", gap: 3 }}>
                          <button className="cozy-btn primary" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 8 }} onClick={() => setMeal(date, mt.id, mealInput)}>✓</button>
                          <button className="cozy-btn secondary" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 8 }} onClick={() => setEditing(null)}>✕</button>
                          {val && <button className="cozy-btn danger" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 8 }} onClick={() => setMeal(date, mt.id, "")}>🗑</button>}
                        </div>
                      </div>
                    ) : (
                      <div className={`meal-cell ${val ? "filled" : ""}`} onClick={() => startEdit(date, mt.id)}>
                        {val ? <span style={{ fontWeight: 600, fontSize: 11 }}>{val}</span> : <span style={{ color: "#ccc", fontSize: 11 }}>+</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
