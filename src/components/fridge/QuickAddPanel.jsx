import { useState, useEffect, useRef } from "react";

let _foodsCache = null;

async function loadFoods() {
  if (_foodsCache) return _foodsCache;
  try {
    const res = await fetch("/foods.json");
    _foodsCache = await res.json();
  } catch {
    _foodsCache = [];
  }
  return _foodsCache;
}

function searchFoods(foods, term) {
  if (!term.trim()) return foods.slice(0, 30);
  const q = term.toLowerCase().trim();
  // Prefix match first, then substring
  const prefix = foods.filter(f => f.name.toLowerCase().startsWith(q));
  const substring = foods.filter(f => !f.name.toLowerCase().startsWith(q) && f.name.toLowerCase().includes(q));
  return [...prefix, ...substring].slice(0, 30);
}

export default function QuickAddPanel({ onAdd, onClose, existingItems }) {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState([]);
  const [results, setResults] = useState([]);
  const [justAdded, setJustAdded] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadFoods().then(data => { setFoods(data); setResults(data.slice(0, 30)); setLoading(false); });
  }, []);

  function handleInput(val) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setResults(searchFoods(foods, val));
    }, 80);
  }

  function handleAdd(food) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + food.expiry_days);
    onAdd({
      name: food.name,
      category: food.category,
      expiry: expiryDate.toISOString().split("T")[0],
      qty: "1",
      nutrition: { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, serving: food.serving },
    });
    setJustAdded(prev => [...prev, food.name]);
  }

  const recentNames = [...new Set(existingItems.map(i => i.name))].slice(0, 6);

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 10, flexShrink: 0 }}>
        <input
          ref={inputRef}
          className="cozy-input"
          placeholder="Search 500+ foods..."
          value={query}
          onChange={e => handleInput(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.4 }}>🔍</span>
        {loading && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)" }}>...</span>
        )}
      </div>

      {/* Scrollable results */}
      <div style={{ maxHeight: "40vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {/* Recently added from fridge */}
        {!query && recentNames.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Add again
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {recentNames.map(name => {
                const added = justAdded.includes(name);
                const food = foods.find(f => f.name.toLowerCase() === name.toLowerCase());
                return (
                  <button key={`r-${name}`} className={`quick-chip ${added ? "added" : ""}`}
                    disabled={added}
                    onClick={() => { if (food) handleAdd(food); }}
                  >
                    {added ? "✓ " : ""}{name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section label */}
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {query.trim() ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Popular items"}
        </div>

        {/* Results list */}
        {results.length === 0 && query.trim() && !loading && (
          <div style={{ textAlign: "center", padding: 24, color: "#b8a080" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>No matches for "{query}"</div>
            <div style={{ fontSize: 11, marginTop: 4, color: "var(--muted)" }}>Try a different spelling or shorter term</div>
          </div>
        )}
        {results.map(food => {
          const added = justAdded.includes(food.name);
          return (
            <button
              key={food.name}
              disabled={added}
              onClick={() => handleAdd(food)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 12, border: "none",
                background: added ? "#edf5ed" : "transparent",
                cursor: added ? "default" : "pointer",
                transition: "background 0.15s",
                textAlign: "left", fontFamily: "var(--body)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: added ? "#4a7a4a" : "var(--text)" }}>
                  {added && "✓ "}{food.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 8, marginTop: 1 }}>
                  <span>{food.category}</span>
                  <span>·</span>
                  <span>{food.expiry_days}d shelf life</span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: added ? "#4a7a4a" : "var(--accent)" }}>
                  {food.calories}
                </div>
                <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 600 }}>cal</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Done button */}
      <div style={{ paddingTop: 10 }}>
        {justAdded.length > 0 && (
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b8e6b", textAlign: "center", marginBottom: 6 }}>
            Added {justAdded.length} item{justAdded.length > 1 ? "s" : ""}
          </div>
        )}
        <button className="cozy-btn primary full" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
