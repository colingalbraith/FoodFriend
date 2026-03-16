import { useState } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "../../constants/categories";
import { DEFAULT_STAPLES } from "../../constants/storage";
import { daysUntil, expiryBadge } from "../../utils/dateHelpers";
import { makeId } from "../../utils/itemHelpers";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Modal from "../ui/Modal";

export default function OverviewTab({ items, saveItems, lowStockItems, saveLowStock, staples, saveStaples, shopping, saveShopping, showToast }) {
  const [section, setSection] = useState("fridge");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [swipedId, setSwipedId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Pantry state
  const [pantryFilter, setPantryFilter] = useState("all");
  const [pantryEditing, setPantryEditing] = useState(false);
  const [newStaple, setNewStaple] = useState("");

  // ─── Fridge logic ───
  function removeItem(id) { saveItems(items.filter(i => i.id !== id)); }
  function useUpItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const prevItems = items;
    const prevLow = lowStockItems;
    if (!lowStockItems.includes(item.name)) saveLowStock([...lowStockItems, item.name]);
    removeItem(id);
    showToast?.(`Marked "${item.name}" as used`, () => { saveItems(prevItems); saveLowStock(prevLow); });
  }
  function tossItem(id) {
    const item = items.find(i => i.id === id);
    const prevItems = items;
    removeItem(id);
    showToast?.(`Tossed "${item?.name || "item"}"`, () => { saveItems(prevItems); });
  }
  function openEditItem(item) {
    setEditingItem(item.id); setEditName(item.name); setEditQty(item.qty || "1");
    setEditExpiry(item.expiry || ""); setEditCategory(item.category || "Other"); setSwipedId(null);
  }
  function saveEditItem() {
    if (!editingItem || !editName.trim()) return;
    saveItems(items.map(i => i.id === editingItem ? { ...i, name: editName.trim(), qty: editQty, expiry: editExpiry || null, category: editCategory } : i));
    setEditingItem(null);
  }

  // Filtering
  let filtered = filter === "All" ? items :
    filter === "Expiring" ? items.filter(i => { const d = daysUntil(i.expiry); return d >= 0 && d <= 3; }) :
    filter === "Expired" ? items.filter(i => daysUntil(i.expiry) < 0) :
    items.filter(i => i.category === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
  }
  const sorted = [...filtered].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry) || a.name.localeCompare(b.name));
  const usedCategories = [...new Set(items.map(i => i.category))].sort();
  const hasExpiring = items.some(i => { const d = daysUntil(i.expiry); return d >= 0 && d <= 3; });
  const hasExpired = items.some(i => daysUntil(i.expiry) < 0);
  const filterOptions = ["All", ...(hasExpiring ? ["Expiring"] : []), ...(hasExpired ? ["Expired"] : []), ...(usedCategories.length > 1 ? usedCategories : [])];

  // ─── Pantry logic ───
  const stapleState = staples || Object.fromEntries(DEFAULT_STAPLES.map(s => [s, true]));
  const allNames = [...new Set([...DEFAULT_STAPLES, ...Object.keys(stapleState)])].filter(n => stapleState[n] !== undefined);
  const allStaples = allNames.map(name => ({ name, inStock: stapleState[name] ?? true }));
  const inStockCount = allStaples.filter(s => s.inStock).length;
  const outCount = allStaples.filter(s => !s.inStock).length;
  const pantryFiltered = pantryFilter === "stocked" ? allStaples.filter(s => s.inStock)
    : pantryFilter === "needed" ? allStaples.filter(s => !s.inStock) : allStaples;

  function toggleStaple(name) { saveStaples({ ...stapleState, [name]: !stapleState[name] }); }
  function addStaple() { const name = newStaple.trim(); if (!name || stapleState[name] !== undefined) return; saveStaples({ ...stapleState, [name]: true }); setNewStaple(""); }
  function removeStaple(name) { const next = { ...stapleState }; delete next[name]; saveStaples(next); }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Section toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button className={`filter-chip ${section === "fridge" ? "active" : ""}`} onClick={() => setSection("fridge")}>
          Fridge ({items.length})
        </button>
        <button className={`filter-chip ${section === "pantry" ? "active" : ""}`} onClick={() => setSection("pantry")}>
          Pantry ({inStockCount}/{allStaples.length})
        </button>
      </div>

      {/* ═══ FRIDGE LIST ═══ */}
      {section === "fridge" && (
        <>
          {/* Search */}
          <input className="cozy-input" placeholder="Search items..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ marginBottom: 10 }} />

          {/* Filter chips */}
          <div style={{ display: "flex", gap: 5, marginBottom: 12, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            {filterOptions.map(f => (
              <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} style={{ fontSize: 11, padding: "5px 10px", minHeight: 28, flexShrink: 0 }}>
                {f}
              </button>
            ))}
          </div>

          {/* Batch actions */}
          {hasExpired && (
            <button className="cozy-btn danger full" style={{ marginBottom: 10, fontSize: 12, padding: "8px 14px", minHeight: 36 }}
              onClick={() => {
                const expired = items.filter(i => daysUntil(i.expiry) < 0);
                const prevItems = items;
                saveItems(items.filter(i => daysUntil(i.expiry) >= 0));
                showToast?.(`Removed ${expired.length} expired item${expired.length > 1 ? "s" : ""}`, () => saveItems(prevItems));
              }}>
              Clear {items.filter(i => daysUntil(i.expiry) < 0).length} Expired
            </button>
          )}

          {/* Items list */}
          {sorted.length > 0 ? (
            <Card style={{ padding: 6 }}>
              {sorted.map((item, idx) => {
                const days = daysUntil(item.expiry);
                const label = expiryBadge(days);
                const isExpired = days < 0;
                const isSwiped = swipedId === item.id;
                return (
                  <div key={item.id} style={{
                    position: "relative", overflow: "hidden", borderRadius: 12,
                    borderBottom: idx < sorted.length - 1 ? "1px solid #f0e6d6" : "none",
                    animation: `fadeIn 0.3s ease-out ${idx * 20}ms both`,
                  }}>
                    {isSwiped && (
                      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", gap: 0, animation: "fadeIn 0.2s ease-out" }}>
                        <button className="swipe-action" style={{ background: "var(--accent)", color: "white" }} onClick={() => openEditItem(item)}>Edit</button>
                        <button className="swipe-action use" onClick={() => { useUpItem(item.id); setSwipedId(null); }}>Used</button>
                        <button className="swipe-action toss" onClick={() => { tossItem(item.id); setSwipedId(null); }}>Toss</button>
                      </div>
                    )}
                    <div className="item-row" onClick={() => setSwipedId(isSwiped ? null : item.id)}
                      style={{ opacity: isExpired ? 0.6 : 1, transform: isSwiped ? "translateX(-140px)" : "translateX(0)", transition: "transform 0.25s ease-out" }}>
                      <div className="cat-dot" style={{ background: CATEGORY_COLORS[item.category] || "#b0a090" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 6, marginTop: 2 }}>
                          <span>{item.category}</span>
                          {item.qty && item.qty !== "1" && <span>x{item.qty}</span>}
                          {item.addedAt && <span>· Added {new Date(item.addedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                        </div>
                      </div>
                      <Badge label={label} />
                    </div>
                  </div>
                );
              })}
            </Card>
          ) : (
            <Card style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{search ? "No matching items" : "Your fridge is empty"}</div>
            </Card>
          )}
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
            Tap an item to reveal actions · {sorted.length} shown
          </div>
        </>
      )}

      {/* ═══ PANTRY LIST ═══ */}
      {section === "pantry" && (
        <>
          {/* Filter + Edit row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
            {[
              { id: "all", label: `All (${allStaples.length})` },
              { id: "stocked", label: `Stocked (${inStockCount})` },
              { id: "needed", label: `Need (${outCount})` },
            ].map(f => (
              <button key={f.id} className={`filter-chip ${pantryFilter === f.id ? "active" : ""}`}
                onClick={() => setPantryFilter(f.id)} style={{ fontSize: 11, padding: "5px 10px", minHeight: 28 }}>{f.label}</button>
            ))}
            <button className={`filter-chip ${pantryEditing ? "active" : ""}`}
              onClick={() => setPantryEditing(!pantryEditing)}
              style={{ marginLeft: "auto", fontSize: 11, padding: "5px 10px", minHeight: 28 }}>
              {pantryEditing ? "Done" : "Edit"}
            </button>
          </div>

          {/* Add new staple */}
          {pantryEditing && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: 10, background: "rgba(196,149,106,0.06)", borderRadius: 12 }}>
              <input className="cozy-input" placeholder="Add a staple..." value={newStaple}
                onChange={e => setNewStaple(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addStaple(); }}
                style={{ flex: 1, background: "white" }} />
              <button className="cozy-btn primary" onClick={addStaple} disabled={!newStaple.trim()}>Add</button>
            </div>
          )}

          {/* Pill toggles */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {pantryFiltered.map((s, i) => (
              <button key={s.name} onClick={() => !pantryEditing && toggleStaple(s.name)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: pantryEditing ? "8px 10px 8px 14px" : "9px 14px", borderRadius: 20, border: "none",
                  background: pantryEditing ? "var(--card)" : s.inStock ? "linear-gradient(135deg, #e4f2e4, #edf5ed)" : "#f5f0e8",
                  color: pantryEditing ? "var(--text)" : s.inStock ? "#3d6e3d" : "var(--muted)",
                  fontFamily: "var(--body)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s ease", opacity: pantryEditing ? 1 : s.inStock ? 1 : 0.55,
                  WebkitTapHighlightColor: "transparent",
                  boxShadow: !pantryEditing && s.inStock ? "0 1px 4px rgba(107,142,107,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
                  animation: `popIn 0.2s ease-out ${i * 15}ms both`,
                }}>
                {!pantryEditing && (
                  <div style={{
                    width: 18, height: 18, borderRadius: 6,
                    border: `2px solid ${s.inStock ? "#6b8e6b" : "#ccc"}`,
                    background: s.inStock ? "#6b8e6b" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease", flexShrink: 0,
                  }}>
                    {s.inStock && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                )}
                <span style={{ textDecoration: !pantryEditing && !s.inStock ? "line-through" : "none" }}>{s.name}</span>
                {pantryEditing && (
                  <span onClick={(e) => { e.stopPropagation(); removeStaple(s.name); }}
                    style={{ width: 20, height: 20, borderRadius: 10, background: "#fde8e8", color: "#c0392b",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✕</span>
                )}
              </button>
            ))}
            {pantryFiltered.length === 0 && (
              <div style={{ width: "100%", textAlign: "center", padding: 20, fontSize: 13, color: "var(--muted)" }}>
                {pantryFilter === "needed" ? "All stocked up!" : "No staples yet"}
              </div>
            )}
          </div>

          {/* Add needed to shopping list */}
          {outCount > 0 && saveShopping && (
            <button className="cozy-btn secondary full" style={{ marginTop: 12 }} onClick={() => {
              const needed = allStaples.filter(s => !s.inStock).map(s => s.name);
              const existingNames = new Set((shopping || []).map(i => i.name.toLowerCase()));
              const toAdd = needed.filter(n => !existingNames.has(n.toLowerCase()));
              if (toAdd.length > 0) saveShopping([...(shopping || []), ...toAdd.map(n => ({ id: makeId(), name: n, checked: false }))]);
            }}>
              Add {outCount} needed to shopping list
            </button>
          )}
        </>
      )}

      {/* Edit item modal */}
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Item">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="cozy-input" placeholder="Name" value={editName} onChange={e => setEditName(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select className="cozy-input" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="cozy-input" placeholder="Qty" value={editQty} onChange={e => setEditQty(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Expires</label>
            <input className="cozy-input" type="date" value={editExpiry} onChange={e => setEditExpiry(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveEditItem}>Save</button>
            <button className="cozy-btn danger" onClick={() => { removeItem(editingItem); setEditingItem(null); }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
