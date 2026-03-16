import { useState, useRef, useCallback } from "react";
import { DEFAULT_STAPLES } from "../../constants/storage";
import { autoExpiry, makeId } from "../../utils/itemHelpers";
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
    // Rubber-band at edges
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

  const paneCount = VIEWS.length;
  const offset = -(viewIdx * (100 / paneCount));

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Swipeable pane */}
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ overflow: "hidden" }}>
        <div style={{
          display: "flex", width: `${paneCount * 100}%`,
          transform: `translateX(calc(${offset}% + ${dragX}px))`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}>
          <div style={{ width: `${100 / paneCount}%`, flexShrink: 0 }}><FridgeView items={items} /></div>
          <div style={{ width: `${100 / paneCount}%`, flexShrink: 0 }}><PantryView staples={staples} /></div>
          <div style={{ width: `${100 / paneCount}%`, flexShrink: 0, padding: "0 4px" }}>
            <OverviewTab items={items} saveItems={saveItems} lowStockItems={lowStockItems} saveLowStock={saveLowStock}
              staples={staples} saveStaples={saveStaples} shopping={shopping} saveShopping={saveShopping} showToast={showToast} />
          </div>
        </div>
      </div>

      {/* Swipe indicator dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6, marginBottom: 10 }}>
        {VIEWS.map((v, i) => (
          <div key={v} onClick={() => setViewIdx(i)} style={{
            width: 6, height: 6, borderRadius: 3, cursor: "pointer",
            background: viewIdx === i ? "var(--accent)" : "#ddd", transition: "background 0.25s",
            WebkitTapHighlightColor: "transparent",
          }} />
        ))}
      </div>

      {/* Add buttons — only on fridge/pantry views */}
      {view !== "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 10 }}>
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
    </div>
  );
}
