import { useState, useRef } from "react";

export default function ReceiptScanPanel({ onAdd, onClose }) {
  const [status, setStatus] = useState("idle");
  const [imageData, setImageData] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [error, setError] = useState(null);
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
    try {
      const base64 = dataUrl.split(",")[1];
      const mediaType = dataUrl.split(";")[0].split(":")[1];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: "Extract grocery items from this receipt image. Return ONLY a JSON array of objects with 'name' (clean product name, not the receipt abbreviation) and 'qty' (string, default '1'). No markdown, no backticks.",
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "Extract all grocery/food items from this receipt." },
            ],
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      setParsed(JSON.parse(clean));
      setStatus("done");
    } catch (e) {
      setError("Couldn't read the receipt. Try a clearer photo!");
      setStatus("idle");
    }
  }

  function submit() {
    if (parsed.length === 0) return;
    onAdd(parsed);
    onClose();
  }

  return (
    <div>
      {status === "idle" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
            Take a photo of your grocery receipt and AI will extract all the items automatically.
          </p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
          <button className="cozy-btn primary full" onClick={() => fileRef.current?.click()}>
            Take Photo or Upload
          </button>
          {error && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 10 }}>{error}</div>}
        </div>
      )}

      {status === "processing" && (
        <div style={{ textAlign: "center", padding: 30 }}>
          <div className="loading-dots" style={{ marginBottom: 12 }}>
            <span /><span /><span />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>Reading your receipt...</div>
        </div>
      )}

      {status === "done" && (
        <div>
          {imageData && (
            <img src={imageData} alt="Receipt" style={{ width: "100%", borderRadius: 12, maxHeight: 200, objectFit: "cover", marginBottom: 12 }} />
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>
            Found {parsed.length} items:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
            {parsed.map((p, i) => (
              <span key={i} className="quick-chip">
                {p.qty !== "1" ? `${p.qty}x ` : ""}{p.name}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={submit}>Add All to Fridge</button>
            <button className="cozy-btn secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
