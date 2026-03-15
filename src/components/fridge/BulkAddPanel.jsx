import { useState } from "react";
import { CATEGORY_EMOJI } from "../../constants/categories";
import { autoExpiry } from "../../utils/itemHelpers";

export default function BulkAddPanel({ onAdd, onClose }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState([]);

  function parseItems(raw) {
    const lines = raw.split(/[\n,]+/).map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      const qtyMatch = line.match(/^(\d+)\s*[x×]?\s*(.+)/i) || line.match(/(.+?)\s*[x×]\s*(\d+)$/i);
      if (qtyMatch) {
        const isReverse = line.match(/(.+?)\s*[x×]\s*(\d+)$/i);
        const qty = isReverse ? qtyMatch[2] : qtyMatch[1];
        const name = isReverse ? qtyMatch[1].trim() : qtyMatch[2].trim();
        return { name, qty: String(qty) };
      }
      return { name: line, qty: "1" };
    });
  }

  function handleChange(val) {
    setText(val);
    setParsed(parseItems(val));
  }

  function submit() {
    if (parsed.length === 0) return;
    onAdd(parsed);
    onClose();
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
        Type or paste items, one per line. Expiry dates will be auto-estimated. You can include quantities like "2x milk" or "3 bananas".
      </p>
      <textarea className="cozy-input" rows={8} placeholder={"Milk\n2x Eggs\nChicken breast\nSpinach\nGreek yogurt\nBread"}
        value={text} onChange={e => handleChange(e.target.value)}
        style={{ resize: "vertical", fontFamily: "var(--body)" }}
      />
      {parsed.length > 0 && (
        <div style={{ margin: "12px 0", fontSize: 12 }}>
          <span style={{ fontWeight: 700, color: "var(--muted)" }}>Preview ({parsed.length} items):</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {parsed.map((p, i) => (
              <span key={i} className="quick-chip" style={{ cursor: "default" }}>
                {CATEGORY_EMOJI[autoExpiry(p.name).category] || "🛒"} {p.qty !== "1" ? `${p.qty}× ` : ""}{p.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className="cozy-btn primary" style={{ flex: 1 }} onClick={submit} disabled={parsed.length === 0}>
          Add {parsed.length} Items
        </button>
        <button className="cozy-btn secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
