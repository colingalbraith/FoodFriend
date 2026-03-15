import { useState, useEffect, useRef, useCallback } from "react";
import { CATEGORY_EMOJI } from "../../constants/categories";

export default function QuickAddPanel({ onAdd, onClose, existingItems }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [popular, setPopular] = useState([]);
  const [justAdded, setJustAdded] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load popular items on mount
  useEffect(() => {
    fetch("/api/foods?q=")
      .then(r => r.json())
      .then(setPopular)
      .catch(() => {});
    inputRef.current?.focus();
  }, []);

  const search = useCallback((term) => {
    if (!term.trim()) { setResults([]); return; }
    setLoading(true);
    fetch(`/api/foods?q=${encodeURIComponent(term)}`)
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleInput(val) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 150);
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

  const displayList = query.trim() ? results : popular;
  const recentNames = [...new Set(existingItems.map(i => i.name))].slice(0, 6);

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input
          ref={inputRef}
          className="cozy-input"
          placeholder="Search 500+ foods... (e.g. chicken, yogurt, avocado)"
          value={query}
          onChange={e => handleInput(e.target.value)}
          style={{ paddingLeft: 36 }}
          autoFocus
        />
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.4 }}>🔍</span>
        {loading && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)" }}>...</span>
        )}
      </div>

      {/* Recently added from fridge */}
      {!query && recentNames.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Add again
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {recentNames.map(name => {
              const added = justAdded.includes(name);
              return (
                <button key={`r-${name}`} className={`quick-chip ${added ? "added" : ""}`}
                  disabled={added}
                  onClick={() => {
                    // Search and add the first match
                    fetch(`/api/foods?q=${encodeURIComponent(name)}`)
                      .then(r => r.json())
                      .then(data => { if (data[0]) handleAdd(data[0]); })
                      .catch(() => {});
                  }}
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
      <div style={{ maxHeight: 340, overflowY: "auto", margin: "0 -4px", padding: "0 4px" }}>
        {displayList.length === 0 && query.trim() && !loading && (
          <div style={{ textAlign: "center", padding: 24, color: "#b8a080" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🤔</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>No matches for "{query}"</div>
            <div style={{ fontSize: 11, marginTop: 4, color: "var(--muted)" }}>Try a different spelling or shorter term</div>
          </div>
        )}
        {displayList.map(food => {
          const added = justAdded.includes(food.name);
          return (
            <button
              key={food.id}
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
              onMouseEnter={e => { if (!added) e.currentTarget.style.background = "rgba(228,213,183,0.25)"; }}
              onMouseLeave={e => { if (!added) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 22, width: 32, textAlign: "center", flexShrink: 0 }}>
                {CATEGORY_EMOJI[food.category] || "🛒"}
              </span>
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

      {/* Added summary + done button */}
      {justAdded.length > 0 && (
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6b8e6b", textAlign: "center", margin: "12px 0 4px" }}>
          ✓ Added {justAdded.length} item{justAdded.length > 1 ? "s" : ""} with expiry dates & nutrition data
        </div>
      )}
      <button className="cozy-btn primary full" style={{ marginTop: 10 }} onClick={onClose}>Done</button>
    </div>
  );
}
