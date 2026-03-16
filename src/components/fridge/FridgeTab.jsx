import { useState, useRef, useCallback } from "react";
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
import PantryView from "./PantryView";

export default function FridgeTab({ items, saveItems, lowStockItems, saveLowStock, staples, saveStaples, shopping, saveShopping, showToast }) {
  const [addMode, setAddMode] = useState(null);
  const [view, setView] = useState("fridge"); // "fridge" | "pantry"
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0, locked: null });
  const [filter, setFilter] = useState("All");

  const onTouchStart = useCallback((e) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, locked: null };
    setDragging(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - touchRef.current.startX;
    const dy = e.touches[0].clientY - touchRef.current.startY;
    // Lock direction on first significant move
    if (touchRef.current.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (touchRef.current.locked !== "h") return;
    e.preventDefault();
    // Clamp: don't let user drag past edges (add rubber-band feel)
    let clamped = dx;
    if (view === "fridge" && dx > 0) clamped = dx * 0.3; // resist right on fridge
    if (view === "pantry" && dx < 0) clamped = dx * 0.3;  // resist left on pantry
    setDragX(clamped);
  }, [view]);

  const onTouchEnd = useCallback(() => {
    setDragging(false);
    if (touchRef.current.locked === "h") {
      if (dragX < -50 && view === "fridge") setView("pantry");
      else if (dragX > 50 && view === "pantry") setView("fridge");
    }
    setDragX(0);
    touchRef.current.locked = null;
  }, [dragX, view]);
  const [swipedId, setSwipedId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editCategory, setEditCategory] = useState("");

  function addItemObj(obj) {
    const { expiry: autoExp, category: autoCat } = autoExpiry(obj.name);
    const newItem = {
      id: makeId(), name: obj.name, category: obj.category || autoCat,
      expiry: obj.expiry || autoExp, qty: obj.qty || "1",
      nutrition: obj.nutrition || null,
      addedAt: new Date().toISOString(),
    };
    saveItems([...items, newItem]);
    // Remove from low stock if re-added
    if (lowStockItems.includes(obj.name)) {
      saveLowStock(lowStockItems.filter(n => n !== obj.name));
    }
  }

  function removeItem(id) { saveItems(items.filter(i => i.id !== id)); }
  function useUpItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const prevItems = items;
    const prevLow = lowStockItems;
    if (!lowStockItems.includes(item.name)) {
      saveLowStock([...lowStockItems, item.name]);
    }
    removeItem(id);
    showToast?.(`Marked "${item.name}" as used`, () => {
      saveItems(prevItems);
      saveLowStock(prevLow);
    });
  }
  function tossItem(id) {
    const item = items.find(i => i.id === id);
    const prevItems = items;
    removeItem(id);
    showToast?.(`Tossed "${item?.name || "item"}"`, () => {
      saveItems(prevItems);
    });
  }

  function openEditItem(item) {
    setEditingItem(item.id);
    setEditName(item.name);
    setEditQty(item.qty || "1");
    setEditExpiry(item.expiry || "");
    setEditCategory(item.category || "Other");
    setSwipedId(null);
  }

  function saveEditItem() {
    if (!editingItem || !editName.trim()) return;
    saveItems(items.map(i => i.id === editingItem ? {
      ...i, name: editName.trim(), qty: editQty, expiry: editExpiry || null, category: editCategory,
    } : i));
    setEditingItem(null);
  }

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
      {/* Swipeable pane — ONLY the cabinet visuals */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ overflow: "hidden" }}
      >
        <div style={{
          display: "flex",
          width: "200%",
          transform: `translateX(calc(${view === "pantry" ? "-50%" : "0%"} + ${dragX}px))`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}>
          <div style={{ width: "50%", flexShrink: 0 }}>
            <FridgeView items={items} />
          </div>
          <div style={{ width: "50%", flexShrink: 0 }}>
            <PantryView staples={staples} />
          </div>
        </div>
      </div>

      {/* Swipe indicator dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10, marginBottom: 14 }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: view === "fridge" ? "var(--accent)" : "#ddd", transition: "background 0.25s" }} />
        <div style={{ width: 6, height: 6, borderRadius: 3, background: view === "pantry" ? "var(--accent)" : "#ddd", transition: "background 0.25s" }} />
      </div>

      {/* ═══ FRIDGE CONTENT (always visible, not inside swipe) ═══ */}
      {view === "fridge" && (
        <>
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
          </Card>}
          {items.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
              Tap an item to reveal actions · {items.length} total
            </div>
          )}
        </>
      )}

      {/* ═══ PANTRY CONTENT (staples list with pill toggles) ═══ */}
      {view === "pantry" && (
        <PantryList staples={staples} saveStaples={saveStaples} shopping={shopping} saveShopping={saveShopping} />
      )}

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

/* ─── Pantry staples list with pill-style toggles (green check / strikethrough) ─── */
function PantryList({ staples, saveStaples, shopping, saveShopping }) {
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState("");
  const stapleState = staples || Object.fromEntries(DEFAULT_STAPLES.map(s => [s, true]));

  function toggle(name) { saveStaples({ ...stapleState, [name]: !stapleState[name] }); }
  function addStaple() { const name = newItem.trim(); if (!name || stapleState[name] !== undefined) return; saveStaples({ ...stapleState, [name]: true }); setNewItem(""); }
  function removeStaple(name) { const next = { ...stapleState }; delete next[name]; saveStaples(next); }

  const allNames = [...new Set([...DEFAULT_STAPLES, ...Object.keys(stapleState)])].filter(n => stapleState[n] !== undefined);
  const allItems = allNames.map(name => ({ name, inStock: stapleState[name] ?? true }));
  const inStockCount = allItems.filter(s => s.inStock).length;
  const outCount = allItems.filter(s => !s.inStock).length;

  const filtered = filter === "stocked" ? allItems.filter(s => s.inStock)
    : filter === "needed" ? allItems.filter(s => !s.inStock) : allItems;

  return (
    <div style={{ animation: "fadeIn 0.25s ease-out" }}>
      {/* Filter + Edit row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
        {[
          { id: "all", label: `All (${allItems.length})` },
          { id: "stocked", label: `Stocked (${inStockCount})` },
          { id: "needed", label: `Need (${outCount})` },
        ].map(f => (
          <button key={f.id} className={`filter-chip ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)} style={{ fontSize: 11, padding: "5px 10px", minHeight: 30 }}>{f.label}</button>
        ))}
        <button className={`filter-chip ${editing ? "active" : ""}`}
          onClick={() => setEditing(!editing)}
          style={{ marginLeft: "auto", fontSize: 11, padding: "5px 10px", minHeight: 30 }}>
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {/* Add new staple */}
      {editing && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: 10, background: "rgba(196,149,106,0.06)", borderRadius: 12 }}>
          <input className="cozy-input" placeholder="Add a staple..." value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addStaple(); }}
            style={{ flex: 1, background: "white" }} />
          <button className="cozy-btn primary" onClick={addStaple} disabled={!newItem.trim()}>Add</button>
        </div>
      )}

      {/* Pill-style toggles */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {filtered.map((s, i) => (
          <button key={s.name}
            onClick={() => editing ? null : toggle(s.name)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: editing ? "8px 10px 8px 14px" : "9px 14px", borderRadius: 20, border: "none",
              background: editing ? "var(--card)" : s.inStock ? "linear-gradient(135deg, #e4f2e4, #edf5ed)" : "#f5f0e8",
              color: editing ? "var(--text)" : s.inStock ? "#3d6e3d" : "var(--muted)",
              fontFamily: "var(--body)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s ease",
              opacity: editing ? 1 : s.inStock ? 1 : 0.55,
              WebkitTapHighlightColor: "transparent",
              boxShadow: !editing && s.inStock ? "0 1px 4px rgba(107,142,107,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
              animation: `popIn 0.2s ease-out ${i * 15}ms both`,
            }}>
            {!editing && (
              <div style={{
                width: 18, height: 18, borderRadius: 6,
                border: `2px solid ${s.inStock ? "#6b8e6b" : "#ccc"}`,
                background: s.inStock ? "#6b8e6b" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease", flexShrink: 0,
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
                }}>✕</span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ width: "100%", textAlign: "center", padding: 20, fontSize: 13, color: "var(--muted)" }}>
            {filter === "needed" ? "All stocked up!" : "No staples yet"}
          </div>
        )}
      </div>

      {/* Add needed to shopping list */}
      {outCount > 0 && saveShopping && (
        <button className="cozy-btn secondary full" style={{ marginTop: 12 }} onClick={() => {
          const needed = allItems.filter(s => !s.inStock).map(s => s.name);
          const existingNames = new Set((shopping || []).map(i => i.name.toLowerCase()));
          const toAdd = needed.filter(n => !existingNames.has(n.toLowerCase()));
          if (toAdd.length > 0) {
            saveShopping([...(shopping || []), ...toAdd.map(n => ({ id: makeId(), name: n, checked: false }))]);
          }
        }}>
          Add {outCount} needed to shopping list
        </button>
      )}
    </div>
  );
}

