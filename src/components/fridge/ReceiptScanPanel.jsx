import { useState, useRef } from "react";
import Tesseract from "tesseract.js";

// Words that are definitely not food items
const SKIP_WORDS = new Set([
  "total", "subtotal", "tax", "change", "cash", "credit", "debit", "visa",
  "mastercard", "balance", "payment", "receipt", "store", "thank", "thanks",
  "welcome", "date", "time", "cashier", "register", "transaction", "savings",
  "discount", "coupon", "member", "loyalty", "points", "card", "refund",
  "qty", "quantity", "price", "amount", "sale", "reg", "tel", "phone",
  "address", "www", "http", "com", "org",
]);

function parseReceiptText(raw) {
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l.length > 2);
  const items = [];

  for (const line of lines) {
    // Skip lines that are mostly numbers/prices (e.g. "$4.99", "2.50")
    const stripped = line.replace(/[\$\d\.,\-\s]/g, "");
    if (stripped.length < 3) continue;

    // Skip lines with common non-food words
    const lower = line.toLowerCase();
    if ([...SKIP_WORDS].some(w => lower.includes(w))) continue;

    // Skip lines that look like dates, times, phone numbers, addresses
    if (/^\d{1,2}[\/\-]\d{1,2}/.test(line)) continue;
    if (/\d{3}[\-\s]\d{3,4}/.test(line)) continue;
    if (/^\d+\s+(st|nd|rd|th|ave|blvd|dr|rd)\b/i.test(line)) continue;

    // Clean up the line — remove trailing prices, codes
    let name = line
      .replace(/\$?\d+\.\d{2}\s*[A-Z]?$/, "") // trailing price like "4.99" or "4.99 F"
      .replace(/\s+\d+\.\d{2}$/, "")           // trailing price with space
      .replace(/^\d+\s*[xX×]\s*/, "")          // leading qty like "2x "
      .replace(/^\d+\s+/, "")                   // leading numbers
      .replace(/[#@*]+/g, "")                   // receipt symbols
      .trim();

    if (name.length < 2 || name.length > 50) continue;

    // Extract quantity if present
    const qtyMatch = line.match(/^(\d+)\s*[xX×]/);
    const qty = qtyMatch ? qtyMatch[1] : "1";

    items.push({ name, qty });
  }

  return items;
}

export default function ReceiptScanPanel({ onAdd, onClose }) {
  const [status, setStatus] = useState("idle");
  const [imageData, setImageData] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [removed, setRemoved] = useState(new Set());
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result);
      processReceipt(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function processReceipt(dataUrl) {
    setStatus("processing");
    setError(null);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(dataUrl, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const items = parseReceiptText(result.data.text);
      if (items.length === 0) {
        setError("Couldn't find any food items. Try a clearer photo or add items manually.");
        setStatus("idle");
        setImageData(null);
      } else {
        setParsed(items);
        setRemoved(new Set());
        setStatus("done");
      }
    } catch {
      setError("Couldn't read the receipt. Try a clearer photo.");
      setStatus("idle");
      setImageData(null);
    }
  }

  function toggleItem(idx) {
    const next = new Set(removed);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setRemoved(next);
  }

  function submit() {
    const items = parsed.filter((_, i) => !removed.has(i));
    if (items.length === 0) return;
    onAdd(items);
    onClose();
  }

  return (
    <div>
      {status === "idle" && (
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
            Take a photo of your grocery receipt. OCR will extract the text and find food items.
          </p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
          <button className="cozy-btn primary full" onClick={() => fileRef.current?.click()}>
            Take Photo or Upload
          </button>
          {error && (
            <div style={{ fontSize: 13, color: "#c0392b", marginTop: 14, textAlign: "center" }}>{error}</div>
          )}
        </div>
      )}

      {status === "processing" && (
        <div style={{ textAlign: "center", padding: 20, animation: "fadeIn 0.3s ease-out" }}>
          <div style={{
            width: "100%", height: 6, borderRadius: 3, background: "#e8dcc8",
            overflow: "hidden", marginBottom: 14,
          }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${progress}%`,
              background: "var(--accent)",
              transition: "width 0.3s ease",
            }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>
            Reading receipt... {progress}%
          </div>
        </div>
      )}

      {status === "done" && (
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          {imageData && (
            <img src={imageData} alt="Receipt" style={{
              width: "100%", borderRadius: 12, maxHeight: 150, objectFit: "cover", marginBottom: 12,
            }} />
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>
            Found {parsed.length - removed.size} items — tap to remove any that aren't food:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {parsed.map((p, i) => {
              const isRemoved = removed.has(i);
              return (
                <button key={i} className="quick-chip" onClick={() => toggleItem(i)} style={{
                  opacity: isRemoved ? 0.4 : 1,
                  textDecoration: isRemoved ? "line-through" : "none",
                }}>
                  {p.qty !== "1" ? `${p.qty}x ` : ""}{p.name}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={submit}
              disabled={parsed.length - removed.size === 0}>
              Add {parsed.length - removed.size} Items
            </button>
            <button className="cozy-btn secondary" onClick={() => { setStatus("idle"); setImageData(null); setParsed([]); }}>
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
