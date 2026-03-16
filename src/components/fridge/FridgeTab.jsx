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

      {/* Filters */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {filterOptions.map(f => (
          <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f}
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
  const [filter, setFilter] = useState("all"); // "all" | "stocked" | "needed"
  const stapleState = staples || Object.fromEntries(DEFAULT_STAPLES.map(s => [s, true]));

  function toggle(name) {
    saveStaples({ ...stapleState, [name]: !stapleState[name] });
  }

  const allNames = [...new Set([...DEFAULT_STAPLES, ...Object.keys(stapleState)])];
  const allItems = allNames.map(name => ({
    name,
    inStock: stapleState[name] ?? true,
  }));

  const inStockCount = allItems.filter(s => s.inStock).length;
  const outCount = allItems.filter(s => !s.inStock).length;

  // Filter
  const filtered = filter === "stocked" ? allItems.filter(s => s.inStock)
    : filter === "needed" ? allItems.filter(s => !s.inStock)
    : allItems;

  const filters = [
    { id: "all", label: `All (${allItems.length})` },
    { id: "stocked", label: `Stocked (${inStockCount})` },
    { id: "needed", label: `Need (${outCount})` },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "4px 0",
          fontFamily: "var(--body)", WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Pantry Staples</span>
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
          {inStockCount} stocked{outCount > 0 && ` · ${outCount} needed`}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 10, color: "var(--muted)",
          transition: "transform 0.25s ease", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
        }}>
          ▼
        </span>
      </button>

      {!collapsed && (
        <Card style={{ padding: 12, marginTop: 8, animation: "fadeIn 0.25s ease-out" }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {filters.map(f => (
              <button key={f.id} className={`filter-chip ${filter === f.id ? "active" : ""}`}
                onClick={() => setFilter(f.id)} style={{ fontSize: 11, padding: "5px 10px", minHeight: 30 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Items */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {filtered.map((s, i) => (
              <button
                key={s.name}
                onClick={() => toggle(s.name)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "8px 12px", borderRadius: 10, border: "1.5px solid",
                  borderColor: s.inStock ? "#b8d4b8" : "#e0cdb5",
                  background: s.inStock ? "#edf5ed" : "#fffdf8",
                  color: s.inStock ? "#4a7a4a" : "var(--muted)",
                  fontFamily: "var(--body)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s ease",
                  opacity: s.inStock ? 1 : 0.5,
                  textDecoration: s.inStock ? "none" : "line-through",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {s.inStock && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6b8e6b" }} />}
                {s.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ width: "100%", textAlign: "center", padding: 16, fontSize: 13, color: "var(--muted)" }}>
                {filter === "needed" ? "Everything is stocked!" : "No items"}
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "var(--muted)" }}>
            Tap to toggle in stock / out of stock
          </div>
        </Card>
      )}
    </div>
  );
}
