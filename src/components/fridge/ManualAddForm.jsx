import { useState } from "react";
import { CATEGORIES, CATEGORY_EMOJI } from "../../constants/categories";
import { autoExpiry } from "../../utils/itemHelpers";

export default function ManualAddForm({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Produce");
  const [expiry, setExpiry] = useState("");
  const [qty, setQty] = useState("1");
  const [autoFilled, setAutoFilled] = useState(false);

  function handleNameChange(val) {
    setName(val);
    if (val.length > 2) {
      const auto = autoExpiry(val);
      if (auto.category !== "Other") {
        setCategory(auto.category);
        if (auto.expiry) setExpiry(auto.expiry);
        setAutoFilled(true);
      }
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), category, expiry: expiry || null, qty });
    onClose();
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="cozy-input" placeholder="Item name" value={name}
          onChange={e => handleNameChange(e.target.value)} autoFocus />
        {autoFilled && (
          <div style={{ fontSize: 11, color: "#6b8e6b", fontWeight: 600, marginTop: -6 }}>
            ✨ Auto-filled category & expiry estimate
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <select className="cozy-input" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
          </select>
          <input className="cozy-input" placeholder="Qty" value={qty} onChange={e => setQty(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>
            Expires {autoFilled && expiry ? "(auto-estimated)" : ""}
          </label>
          <input className="cozy-input" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button className="cozy-btn primary" style={{ flex: 1 }} onClick={submit}>Add</button>
          <button className="cozy-btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
