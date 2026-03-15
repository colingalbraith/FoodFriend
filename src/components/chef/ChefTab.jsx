import { useState } from "react";
import { daysUntil } from "../../utils/dateHelpers";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";

export default function ChefTab({ items, saveMeals, meals }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("quick");

  const expiring = items.filter(i => { const d = daysUntil(i.expiry); return d >= 0 && d <= 5; })
    .sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry));

  async function getSuggestions() {
    setLoading(true); setError(null); setSuggestions(null);
    const list = items.map(i => {
      const d = daysUntil(i.expiry);
      const u = d <= 2 ? " (USE NOW!)" : d <= 5 ? " (soon)" : "";
      return `${i.name} (${i.category})${u}`;
    }).join(", ");

    const prompt = mode === "quick"
      ? `My fridge: ${list}\n\nSuggest 3 meals prioritizing expiring items. Return ONLY JSON array: [{name, description, ingredients: [], time, difficulty}]`
      : `My fridge: ${list}\n\n3-day meal plan prioritizing expiring items. ONLY JSON array: [{day, breakfast: {name, ingredients: []}, lunch: {name, ingredients: []}, dinner: {name, ingredients: []}}]`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: "Helpful home cooking assistant. ONLY valid JSON, no markdown/backticks.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      setSuggestions(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch { setError("Couldn't cook up ideas. Try again!"); }
    setLoading(false);
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>AI Chef</div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        Smart meal ideas based on what's in your fridge, prioritizing what expires soonest.
      </p>

      {items.length === 0 ? (
        <Card><EmptyState title="Fridge is empty!" sub="Add items first, then I can help" /></Card>
      ) : (
        <>
          {expiring.length > 0 && (
            <Card style={{ marginBottom: 14, background: "linear-gradient(135deg,#fef3e2,#fde8c8)", border: "2px solid #f0c78a", padding: 14, animation: "fadeIn 0.3s ease-out" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#8b6d30", marginBottom: 6 }}>Prioritizing:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {expiring.map(i => (
                  <span key={i.id} style={{ background: "#fffdf8", border: "1px solid #e8d0a8", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                    {i.name} · {daysUntil(i.expiry)}d
                  </span>
                ))}
              </div>
            </Card>
          )}

          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <button className={`cozy-btn ${mode === "quick" ? "primary" : "secondary"}`} onClick={() => setMode("quick")}>Quick</button>
            <button className={`cozy-btn ${mode === "plan" ? "primary" : "secondary"}`} onClick={() => setMode("plan")}>3-Day</button>
            <button className="cozy-btn primary" onClick={getSuggestions} disabled={loading} style={{ marginLeft: "auto" }}>
              {loading ? "Thinking..." : "Go"}
            </button>
          </div>

          {loading && (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <div className="loading-dots" style={{ marginBottom: 14 }}>
                <span /><span /><span />
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 20, color: "var(--muted)" }}>
                Cooking up something good...
              </div>
            </Card>
          )}

          {error && <Card style={{ borderColor: "#e8a0a0", background: "#fef5f5" }}><p style={{ color: "#c0392b", fontSize: 13 }}>{error}</p></Card>}

          {suggestions && mode === "quick" && Array.isArray(suggestions) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.map((s, i) => (
                <Card key={i} style={{ animation: `slideUp 0.4s ease-out ${i * 80}ms both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700 }}>{s.name}</div>
                      <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>{s.description}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {(s.ingredients || []).map((ing, j) => (
                          <span key={j} style={{ background: "#edf5ed", color: "#4a7a4a", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>{ing}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{s.time}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3,
                        color: s.difficulty === "Easy" ? "#6b8e6b" : s.difficulty === "Hard" ? "#c0392b" : "#b8860b"
                      }}>{s.difficulty}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {suggestions && mode === "plan" && Array.isArray(suggestions) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.map((day, i) => (
                <Card key={i} style={{ animation: `slideUp 0.4s ease-out ${i * 80}ms both` }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Day {day.day}</div>
                  {["breakfast", "lunch", "dinner"].map(mt => {
                    const m = day[mt]; if (!m) return null;
                    return (
                      <div key={mt} style={{ marginBottom: 8, paddingLeft: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)" }}>{mt.charAt(0).toUpperCase() + mt.slice(1)}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
                          {(m.ingredients || []).map((ing, j) => (
                            <span key={j} style={{ background: "#f0e6d6", borderRadius: 5, padding: "1px 5px", fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{ing}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
