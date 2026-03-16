import { useState, useRef, useCallback } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "../../constants/categories";
import { DEFAULT_STAPLES } from "../../constants/storage";
import { daysUntil, expiryBadge } from "../../utils/dateHelpers";
import { autoExpiry, makeId } from "../../utils/itemHelpers";
import { getFoodEmoji } from "../../constants/foodEmoji";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import QuickAddPanel from "./QuickAddPanel";
import ManualAddForm from "./ManualAddForm";
import BarcodeScanPanel from "./BarcodeScanPanel";
import ReceiptScanPanel from "./ReceiptScanPanel";
import FridgeView from "./FridgeView";
import PantryView from "./PantryView";
import OverviewTab from "../overview/OverviewTab";

const VIEWS = ["fridge", "pantry", "overview"];

export default function FridgeTab({ items, saveItems, lowStockItems, saveLowStock, staples, saveStaples, shopping, saveShopping, showToast }) {
  const [addMode, setAddMode] = useState(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0, locked: null });
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPantryItem, setSelectedPantryItem] = useState(null);

  const view = VIEWS[viewIdx];

  const onTouchStart = useCallback((e) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, locked: null };
    setDragging(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - touchRef.current.startX;
    const dy = e.touches[0].clientY - touchRef.current.startY;
    if (touchRef.current.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (touchRef.current.locked !== "h") return;
    e.preventDefault();
    let clamped = dx;
    if (viewIdx === 0 && dx > 0) clamped = dx * 0.3;
    if (viewIdx === VIEWS.length - 1 && dx < 0) clamped = dx * 0.3;
    setDragX(clamped);
  }, [viewIdx]);

  const onTouchEnd = useCallback(() => {
    setDragging(false);
    if (touchRef.current.locked === "h") {
      if (dragX < -50 && viewIdx < VIEWS.length - 1) setViewIdx(i => i + 1);
      else if (dragX > 50 && viewIdx > 0) setViewIdx(i => i - 1);
    }
    setDragX(0);
    touchRef.current.locked = null;
  }, [dragX, viewIdx]);

  function addItemObj(obj) {
    const { expiry: autoExp, category: autoCat } = autoExpiry(obj.name);
    const newItem = {
      id: makeId(), name: obj.name, category: obj.category || autoCat,
      expiry: obj.expiry || autoExp, qty: obj.qty || "1",
      nutrition: obj.nutrition || null, addedAt: new Date().toISOString(),
    };
    saveItems([...items, newItem]);
    if (lowStockItems.includes(obj.name)) saveLowStock(lowStockItems.filter(n => n !== obj.name));
  }

  function useUpItem(item) {
    const prevItems = items;
    const prevLow = lowStockItems;
    if (!lowStockItems.includes(item.name)) saveLowStock([...lowStockItems, item.name]);
    saveItems(items.filter(i => i.id !== item.id));
    setSelectedItem(null);
    showToast?.(`Marked "${item.name}" as used`, () => { saveItems(prevItems); saveLowStock(prevLow); });
  }

  function tossItem(item) {
    const prevItems = items;
    saveItems(items.filter(i => i.id !== item.id));
    setSelectedItem(null);
    showToast?.(`Tossed "${item.name}"`, () => { saveItems(prevItems); });
  }

  const paneCount = VIEWS.length;
  const offset = -(viewIdx * (100 / paneCount));

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
      {/* Swipeable pane */}
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ overflow: "hidden", flex: view === "overview" ? 1 : "none" }}>
        <div style={{
          display: "flex", width: `${paneCount * 100}%`,
          transform: `translateX(calc(${offset}% + ${dragX}px))`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}>
          <div style={{ width: `${100 / paneCount}%`, flexShrink: 0 }}>
            <FridgeView items={items} onItemTap={setSelectedItem} />
          </div>
          <div style={{ width: `${100 / paneCount}%`, flexShrink: 0 }}>
            <PantryView staples={staples} onItemTap={setSelectedPantryItem} />
          </div>
          <div style={{ width: `${100 / paneCount}%`, flexShrink: 0, padding: "0 4px" }}>
            <OverviewTab items={items} saveItems={saveItems} lowStockItems={lowStockItems} saveLowStock={saveLowStock}
              staples={staples} saveStaples={saveStaples} shopping={shopping} saveShopping={saveShopping} showToast={showToast} />
          </div>
        </div>
      </div>

      {/* Swipe indicator dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6, marginBottom: 8 }}>
        {VIEWS.map((v, i) => (
          <div key={v} onClick={() => setViewIdx(i)} style={{
            width: 6, height: 6, borderRadius: 3, cursor: "pointer",
            background: viewIdx === i ? "var(--accent)" : "#ddd", transition: "background 0.25s",
            WebkitTapHighlightColor: "transparent",
          }} />
        ))}
      </div>

      {/* Spacer pushes buttons to bottom */}
      {view !== "overview" && <div style={{ flex: 1 }} />}

      {/* Add buttons — pinned to bottom, animated in/out */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, paddingBottom: 8,
        opacity: view === "overview" ? 0 : 1,
        transform: view === "overview" ? "translateY(20px)" : "translateY(0)",
        maxHeight: view === "overview" ? 0 : 200,
        overflow: "hidden",
        transition: "opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease",
        pointerEvents: view === "overview" ? "none" : "auto",
      }}>
        {[
          { id: "quick", label: "Quick Add" },
          { id: "manual", label: "Manual" },
          { id: "scan", label: "Scan Barcode" },
          { id: "receipt", label: "Scan Receipt" },
        ].map((m) => (
          <button key={m.id} className="add-method-btn" onClick={() => setAddMode(m.id)}>
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

      {/* Item detail popup */}
      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem?.name || ""}>
        {selectedItem && (() => {
          const days = daysUntil(selectedItem.expiry);
          const label = expiryBadge(days);
          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div className="cat-dot" style={{ background: CATEGORY_COLORS[selectedItem.category] || "#b0a090", width: 14, height: 14 }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{selectedItem.category}</div>
                  {selectedItem.qty && selectedItem.qty !== "1" && <div style={{ fontSize: 11, color: "var(--muted)" }}>Qty: {selectedItem.qty}</div>}
                </div>
                <div style={{ marginLeft: "auto" }}><Badge label={label} /></div>
              </div>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {selectedItem.addedAt && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 2 }}>ADDED</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(selectedItem.addedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                  </div>
                )}
                {selectedItem.expiry && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 2 }}>EXPIRES</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: days < 0 ? "#c0392b" : days <= 3 ? "#e67e22" : "var(--text)" }}>
                      {new Date(selectedItem.expiry).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>({days < 0 ? `${Math.abs(days)}d ago` : `${days}d`})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Nutrition if available */}
              {selectedItem.nutrition && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>NUTRITION</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                    {[
                      { label: "Cal", val: selectedItem.nutrition.calories },
                      { label: "Protein", val: selectedItem.nutrition.protein ? `${selectedItem.nutrition.protein}g` : "-" },
                      { label: "Carbs", val: selectedItem.nutrition.carbs ? `${selectedItem.nutrition.carbs}g` : "-" },
                      { label: "Fat", val: selectedItem.nutrition.fat ? `${selectedItem.nutrition.fat}g` : "-" },
                    ].map(n => (
                      <div key={n.label}>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{n.val || "-"}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>{n.label}</div>
                      </div>
                    ))}
                  </div>
                  {selectedItem.nutrition.serving && (
                    <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>per {selectedItem.nutrition.serving}</div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="cozy-btn primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => useUpItem(selectedItem)}>Used</button>
                <button className="cozy-btn danger" style={{ flex: 1, justifyContent: "center" }} onClick={() => tossItem(selectedItem)}>Toss</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Pantry item detail popup */}
      <Modal open={!!selectedPantryItem} onClose={() => setSelectedPantryItem(null)} title={selectedPantryItem?.name || ""}>
        {selectedPantryItem && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{getFoodEmoji(selectedPantryItem.name)}</div>
            <div style={{
              display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: selectedPantryItem.inStock ? "linear-gradient(135deg, #e4f2e4, #edf5ed)" : "#fef3e2",
              color: selectedPantryItem.inStock ? "#3d6e3d" : "#8b6d30",
              marginBottom: 16,
            }}>
              {selectedPantryItem.inStock ? "In Stock" : "Out of Stock"}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="cozy-btn primary" style={{ flex: 1, justifyContent: "center" }}
                onClick={() => {
                  const s = staples || Object.fromEntries(DEFAULT_STAPLES.map(n => [n, true]));
                  saveStaples({ ...s, [selectedPantryItem.name]: !selectedPantryItem.inStock });
                  setSelectedPantryItem(null);
                }}>
                {selectedPantryItem.inStock ? "Mark Out of Stock" : "Mark In Stock"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
