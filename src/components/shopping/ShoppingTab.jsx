import { useState } from "react";
import { makeId } from "../../utils/itemHelpers";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";

export default function ShoppingTab({ list, saveList }) {
  const [input, setInput] = useState("");

  function add(e) {
    e?.preventDefault();
    if (!input.trim()) return;
    saveList([...list, { id: makeId(), name: input.trim(), checked: false }]);
    setInput("");
  }

  function toggle(id) { saveList(list.map(i => i.id === id ? { ...i, checked: !i.checked } : i)); }
  function remove(id) { saveList(list.filter(i => i.id !== id)); }
  function clearChecked() { saveList(list.filter(i => !i.checked)); }

  const unchecked = list.filter(i => !i.checked);
  const checked = list.filter(i => i.checked);

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>
        Shopping List
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input className="cozy-input" placeholder="Add an item..." value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add(e)} />
        <button className="cozy-btn primary" onClick={add}>+</button>
      </div>

      <Card style={{ padding: 6 }}>
        {list.length === 0 ? (
          <EmptyState title="Nothing to buy yet!" sub="Add items or let AI Chef suggest a grocery run" />
        ) : (
          <>
            {unchecked.map((item, idx) => (
              <div key={item.id} className="shopping-item" style={{ borderBottom: idx < unchecked.length - 1 ? "1px solid #f0e6d6" : "none" }}>
                <div onClick={() => toggle(item.id)} style={{
                  width: 26, height: 26, borderRadius: 8, border: "2px solid #d4b896",
                  cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
                  WebkitTapHighlightColor: "transparent",
                }} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                <button className="cozy-btn danger" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, minHeight: 36 }} onClick={() => remove(item.id)}>✕</button>
              </div>
            ))}
            {checked.length > 0 && (
              <>
                <div style={{ padding: "10px 14px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Done ({checked.length})</span>
                  <button className="cozy-btn secondary" style={{ fontSize: 10, padding: "3px 8px" }} onClick={clearChecked}>Clear</button>
                </div>
                {checked.map(item => (
                  <div key={item.id} className="shopping-item" style={{ opacity: 0.4 }}>
                    <div onClick={() => toggle(item.id)} style={{
                      width: 26, height: 26, borderRadius: 8, border: "2px solid #6b8e6b",
                      background: "#6b8e6b", cursor: "pointer", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontSize: 12, fontWeight: 800,
                      WebkitTapHighlightColor: "transparent",
                    }}>✓</div>
                    <span style={{ flex: 1, fontSize: 14, textDecoration: "line-through" }}>{item.name}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
