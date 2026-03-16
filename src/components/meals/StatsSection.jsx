import Card from "../ui/Card";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StatsSection({ today, macroLog, goals }) {
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

  return (
    <>
      <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Weekly Stats</div>

      {/* Calorie bar chart */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Goal: {goals.calories} cal/day</span>
      </div>
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Calories</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
          {weekData.map(d => {
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
  );
}
