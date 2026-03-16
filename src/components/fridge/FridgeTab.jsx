import { useState } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "../../constants/categories";
import { DEFAULT_STAPLES } from "../../constants/storage";
import { daysUntil, expiryBadge } from "../../utils/dateHelpers";
import { autoExpiry, makeId } from "../../utils/itemHelpers";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import Modal from "../ui/Modal";
import QuickAddPanel from "./QuickAddPanel";
import ManualAddForm from "./ManualAddForm";
import BarcodeScanPanel from "./BarcodeScanPanel";
import ReceiptScanPanel from "./ReceiptScanPanel";
import FridgeView from "./FridgeView";

export default function FridgeTab({ items, saveItems, lowStockItems, saveLowStock, staples, saveStaples }) {
  const [addMode, setAddMode] = useState(null);
  const [filter, setFilter] = useState("All");
  const [swipedId, setSwipedId] = useState(null);

  function addItemObj(obj) {
    const { expiry: autoExp, category: autoCat } = autoExpiry(obj.name);
    const newItem = {
      id: makeId(), name: obj.name, category: obj.category || autoCat,
      expiry: obj.expiry || autoExp, qty: obj.qty || "1",
      nutrition: obj.nutrition || null,
      addedAt: new Date().toISOString(),
    };
    saveItems([...items, newItem]);
  }

  function removeItem(id) { saveItems(items.filter(i => i.id !== id)); }
  function useUpItem(id) {
    const item = items.find(i => i.id === id);
    if (item && !lowStockItems.includes(item.name)) {
      saveLowStock([...lowStockItems, item.name]);
    }
    removeItem(id);
  }
  function tossItem(id) { removeItem(id); }

  const filtered = filter === "All" ? items :
    filter === "Expiring" ? items.filter(i => { const d = daysUntil(i.expiry); return d >= 0 && d <= 3; }) :
    filter === "Expired" ? items.filter(i => daysUntil(i.expiry) < 0) :
    items.filter(i => i.category === filter);

  const sorted = [...filtered].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry) || a.name.localeCompare(b.name));

  const usedCategories = [...new Set(items.map(i => i.category))].sort();
  const hasExpiring = items.some(i => { const d = daysUntil(i.expiry); return d >= 0 && d <= 3; });
  const filterOptions = [
    "All",
    ...(hasExpiring ? ["Expiring"] : []),
    ...(usedCategories.length > 1 ? usedCategories : []),
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Fridge visualization */}
      <FridgeView items={items} />

      {/* Add buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { id: "quick", label: "Quick Add" },
          { id: "manual", label: "Manual" },
          { id: "scan", label: "Scan Barcode" },
          { id: "receipt", label: "Scan Receipt" },
        ].map((m, i) => (
          <button key={m.id} className="add-method-btn" onClick={() => setAddMode(m.id)}
            style={{ animation: `popIn 0.3s ease-out ${i * 50}ms both` }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Add modals */}
      <Modal open={addMode === "quick"} onClose={() => setAddMode(null)} title="Quick Add">
        <QuickAddPanel onAdd={addItemObj} onClose={() => setAddMode(null)} existingItems={items} />
      </Modal>
      <Modal open={addMode === "manual"} onClose={() => setAddMode(null)} title="Add Item">
        <ManualAddForm onAdd={addItemObj} onClose={() => setAddMode(null)} />
      </Modal>
      <Modal open={addMode === "scan"} onClose={() => setAddMode(null)} title="Scan Barcode">
        <BarcodeScanPanel onAdd={addItemObj} onClose={() => setAddMode(null)} />
      </Modal>
      <Modal open={addMode === "receipt"} onClose={() => setAddMode(null)} title="Scan Receipt">
        <ReceiptScanPanel onAdd={(list) => { list.forEach(obj => addItemObj(obj)); }} onClose={() => setAddMode(null)} />
      </Modal>



      {/* Items list */}
      {sorted.length > 0 && <Card style={{ padding: 6 }}>
        {sorted.map((item, idx) => {
          const days = daysUntil(item.expiry);
          const label = expiryBadge(days);
          const isExpired = days < 0;
          const isSwiped = swipedId === item.id;
          return (
            <div key={item.id} style={{
              position: "relative", overflow: "hidden", borderRadius: 12,
              borderBottom: idx < sorted.length - 1 ? "1px solid #f0e6d6" : "none",
              animation: `fadeIn 0.3s ease-out ${idx * 30}ms both`,
            }}>
              {isSwiped && (
                <div style={{
                  position: "absolute", right: 0, top: 0, bottom: 0,
                  display: "flex", gap: 0, animation: "fadeIn 0.2s ease-out",
                }}>
                  <button className="swipe-action use" onClick={() => { useUpItem(item.id); setSwipedId(null); }}>
                    Used
                  </button>
                  <button className="swipe-action toss" onClick={() => { tossItem(item.id); setSwipedId(null); }}>
                    Toss
                  </button>
                </div>
              )}
              <div className="item-row" onClick={() => setSwipedId(isSwiped ? null : item.id)}
                style={{ opacity: isExpired ? 0.6 : 1, transform: isSwiped ? "translateX(-140px)" : "translateX(0)", transition: "transform 0.25s ease-out" }}
              >
                <div className="cat-dot" style={{ background: CATEGORY_COLORS[item.category] || "#b0a090" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 6, marginTop: 2 }}>
                    <span>{item.category}</span>
                    {item.qty && item.qty !== "1" && <span>x{item.qty}</span>}
                  </div>
                </div>
                <Badge label={label} />
              </div>
            </div>
          );
        })}
      </Card>}

      {items.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
          Tap an item to reveal actions · {items.length} total
        </div>
      )}

      {/* Staples section */}
      <StaplesSection staples={staples} saveStaples={saveStaples} />
    </div>
  );
}

function StaplesSection({ staples, saveStaples }) {
  const [collapsed, setCollapsed] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState("");
  const stapleState = staples || Object.fromEntries(DEFAULT_STAPLES.map(s => [s, true]));

  function toggle(name) {
    saveStaples({ ...stapleState, [name]: !stapleState[name] });
  }

  function addStaple() {
    const name = newItem.trim();
    if (!name || stapleState[name] !== undefined) return;
    saveStaples({ ...stapleState, [name]: true });
    setNewItem("");
  }

  function removeStaple(name) {
    const next = { ...stapleState };
    delete next[name];
    saveStaples(next);
  }

  const allNames = [...new Set([...DEFAULT_STAPLES, ...Object.keys(stapleState)])].filter(n => stapleState[n] !== undefined);
  const allItems = allNames.map(name => ({ name, inStock: stapleState[name] ?? true }));

  const inStockCount = allItems.filter(s => s.inStock).length;
  const outCount = allItems.filter(s => !s.inStock).length;

  const filtered = filter === "stocked" ? allItems.filter(s => s.inStock)
    : filter === "needed" ? allItems.filter(s => !s.inStock)
    : allItems;

  const filters = [
    { id: "all", label: `All (${allItems.length})` },
    { id: "stocked", label: `Stocked (${inStockCount})` },
    { id: "needed", label: `Need (${outCount})` },
  ];

  // Progress bar
  const pct = allItems.length > 0 ? Math.round((inStockCount / allItems.length) * 100) : 0;

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 6px",
          fontFamily: "var(--body)", WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Pantry Staples</span>
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
              {inStockCount}/{allItems.length}
            </span>
          </div>
          {/* Mini progress bar */}
          <div style={{
            width: "100%", height: 4, borderRadius: 2, background: "#e8dcc8",
            marginTop: 6, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${pct}%`,
              background: pct === 100 ? "#6b8e6b" : pct > 50 ? "#c4a86a" : "#d48a7b",
              transition: "width 0.4s ease, background 0.4s ease",
            }} />
          </div>
        </div>
        <span style={{
          fontSize: 12, color: "var(--muted)",
          transition: "transform 0.25s ease", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
        }}>▼</span>
      </button>

      {!collapsed && (
        <div style={{ marginTop: 8, animation: "fadeIn 0.25s ease-out" }}>
          {/* Filter + Edit row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
            {filters.map(f => (
              <button key={f.id} className={`filter-chip ${filter === f.id ? "active" : ""}`}
                onClick={() => setFilter(f.id)} style={{ fontSize: 11, padding: "5px 10px", minHeight: 30 }}>
                {f.label}
              </button>
            ))}
            <button className={`filter-chip ${editing ? "active" : ""}`}
              onClick={() => setEditing(!editing)}
              style={{ marginLeft: "auto", fontSize: 11, padding: "5px 10px", minHeight: 30 }}>
              {editing ? "Done" : "Edit"}
            </button>
          </div>

          {/* Add new staple */}
          {editing && (
            <div style={{
              display: "flex", gap: 8, marginBottom: 12,
              padding: 10, background: "rgba(196,149,106,0.06)", borderRadius: 12,
            }}>
              <input className="cozy-input" placeholder="Add a staple..." value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addStaple(); }}
                style={{ flex: 1, background: "white" }}
              />
              <button className="cozy-btn primary" onClick={addStaple} disabled={!newItem.trim()}>Add</button>
            </div>
          )}

          {/* Items */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {filtered.map((s, i) => (
              <button
                key={s.name}
                onClick={() => editing ? null : toggle(s.name)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: editing ? "8px 10px 8px 14px" : "9px 14px", borderRadius: 20,
                  border: "none",
                  background: editing ? "var(--card)" : s.inStock
                    ? "linear-gradient(135deg, #e4f2e4, #edf5ed)"
                    : "#f5f0e8",
                  color: editing ? "var(--text)" : s.inStock ? "#3d6e3d" : "var(--muted)",
                  fontFamily: "var(--body)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  opacity: editing ? 1 : s.inStock ? 1 : 0.55,
                  textDecoration: "none",
                  WebkitTapHighlightColor: "transparent",
                  boxShadow: !editing && s.inStock ? "0 1px 4px rgba(107,142,107,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
                  animation: `popIn 0.2s ease-out ${i * 15}ms both`,
                }}
              >
                {!editing && (
                  <div style={{
                    width: 18, height: 18, borderRadius: 6,
                    border: `2px solid ${s.inStock ? "#6b8e6b" : "#ccc"}`,
                    background: s.inStock ? "#6b8e6b" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}>
                    {s.inStock && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
                <span style={{ textDecoration: !editing && !s.inStock ? "line-through" : "none" }}>{s.name}</span>
                {editing && (
                  <span onClick={(e) => { e.stopPropagation(); removeStaple(s.name); }}
                    style={{
                      width: 20, height: 20, borderRadius: 10,
                      background: "#fde8e8", color: "#c0392b",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, flexShrink: 0,
                    }}>
                    ✕
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ width: "100%", textAlign: "center", padding: 20, fontSize: 13, color: "var(--muted)" }}>
                {filter === "needed" ? "All stocked up!" : "No staples yet"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
