import { useState, useRef } from "react";
import Card from "../ui/Card";

export default function BarcodeScanPanel({ onAdd, onClose }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [scannedItem, setScannedItem] = useState(null);
  const [error, setError] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => detectBarcode(reader.result);
    reader.readAsDataURL(file);
  }

  async function detectBarcode(dataUrl) {
    setStatus("detecting");
    setError(null);

    // Try BarcodeDetector API (Chrome Android)
    if ("BarcodeDetector" in window) {
      try {
        const img = new Image();
        img.src = dataUrl;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"] });
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          await lookupBarcode(barcodes[0].rawValue);
          return;
        }
      } catch {}
    }

    // Fallback: send image to API for barcode reading
    try {
      const base64 = dataUrl.split(",")[1];
      const mediaType = dataUrl.split(";")[0].split(":")[1];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 500,
          system: "Read the barcode number from this image. Return ONLY the barcode number as plain text, nothing else. If you can't read a barcode, return 'NONE'.",
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "What barcode number is shown?" },
            ],
          }],
        }),
      });
      const data = await res.json();
      const code = data.content?.map(i => i.text || "").join("").trim();
      if (code && code !== "NONE") {
        await lookupBarcode(code);
        return;
      }
    } catch {}

    setError("Couldn't detect a barcode. Try a clearer photo.");
    setStatus("idle");
  }

  async function lookupBarcode(code) {
    setStatus("looking-up");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: "Look up this barcode and return ONLY a JSON object with 'name' (product name), 'category' (one of: Produce, Dairy, Meat, Seafood, Grains, Frozen, Condiments, Beverages, Snacks, Bakery, Leftovers, Other). No markdown.",
          messages: [{ role: "user", content: `What product has barcode/UPC: ${code}?` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.filter(i => i.type === "text").map(i => i.text).join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const product = JSON.parse(clean);
      setScannedItem(product);
      setStatus("found");
    } catch {
      setScannedItem({ name: `Product (${code})`, category: "Other" });
      setStatus("found");
    }
  }

  function addAndReset() {
    if (scannedItem) onAdd(scannedItem);
    setScannedItem(null);
    setStatus("idle");
    setError(null);
  }

  return (
    <div>
      {status === "idle" && (
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
            Take a photo of a barcode to identify the product automatically.
          </p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
          <button className="cozy-btn primary full" onClick={() => fileRef.current?.click()}>
            Take Photo
          </button>
          {error && (
            <div style={{ fontSize: 13, color: "#c0392b", marginTop: 14, textAlign: "center" }}>
              {error}
            </div>
          )}
        </div>
      )}

      {(status === "detecting" || status === "looking-up") && (
        <div style={{ textAlign: "center", padding: 20, animation: "fadeIn 0.3s ease-out" }}>
          <div className="loading-dots" style={{ marginBottom: 12 }}>
            <span /><span /><span />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>
            {status === "detecting" ? "Reading barcode..." : "Looking up product..."}
          </div>
        </div>
      )}

      {status === "found" && scannedItem && (
        <div style={{ animation: "popIn 0.3s ease-out" }}>
          <Card style={{ padding: 16, background: "#edf5ed", border: "2px solid #b8d4b8" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4a7a4a", marginBottom: 4 }}>Found!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {scannedItem.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{scannedItem.category}</div>
          </Card>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={addAndReset}>Add & Scan Next</button>
            <button className="cozy-btn secondary" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
