import { useState, useRef } from "react";
import Card from "../ui/Card";

// Map Open Food Facts categories to our categories
function mapCategory(product) {
  const tags = (product.categories_tags || []).join(" ").toLowerCase();
  const name = (product.product_name || "").toLowerCase();
  if (tags.includes("frozen")) return "Frozen";
  if (tags.includes("meat") || tags.includes("poultry")) return "Meat";
  if (tags.includes("fish") || tags.includes("seafood")) return "Seafood";
  if (tags.includes("dairy") || tags.includes("milk") || tags.includes("cheese") || tags.includes("yogurt")) return "Dairy";
  if (tags.includes("bread") || tags.includes("baker")) return "Bakery";
  if (tags.includes("beverage") || tags.includes("drink") || tags.includes("juice") || tags.includes("water")) return "Beverages";
  if (tags.includes("snack") || tags.includes("chip") || tags.includes("cookie")) return "Snacks";
  if (tags.includes("sauce") || tags.includes("condiment") || tags.includes("spice")) return "Condiments";
  if (tags.includes("cereal") || tags.includes("grain") || tags.includes("pasta") || tags.includes("rice")) return "Grains";
  if (tags.includes("fruit") || tags.includes("vegetable") || tags.includes("produce")) return "Produce";
  return "Other";
}

export default function BarcodeScanPanel({ onAdd, onClose }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [scannedItem, setScannedItem] = useState(null);
  const [manualCode, setManualCode] = useState("");
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

    setError("Couldn't read the barcode. Try a clearer photo, or type the number below.");
    setStatus("manual");
  }

  async function lookupBarcode(code) {
    setStatus("looking-up");
    setError(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const nutriments = p.nutriments || {};
        setScannedItem({
          name: p.product_name || p.generic_name || `Product (${code})`,
          category: mapCategory(p),
          nutrition: {
            calories: Math.round(nutriments["energy-kcal_100g"] || 0),
            protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
            carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
            fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
            serving: p.serving_size || "100g",
          },
        });
        setStatus("found");
      } else {
        setError("Product not found in database. Try another barcode.");
        setStatus("manual");
      }
    } catch {
      setError("Couldn't look up the product. Check your connection.");
      setStatus("manual");
    }
  }

  function addAndReset() {
    if (scannedItem) onAdd(scannedItem);
    setScannedItem(null);
    setStatus("idle");
    setError(null);
    setManualCode("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (manualCode.trim()) lookupBarcode(manualCode.trim());
  }

  return (
    <div>
      {status === "idle" && (
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
            Take a photo of a barcode to look it up in the Open Food Facts database.
          </p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
          <button className="cozy-btn primary full" onClick={() => fileRef.current?.click()}>
            Take Photo
          </button>
          <div style={{ margin: "16px 0 8px", fontSize: 11, color: "var(--muted)", fontWeight: 700, textAlign: "center" }}>
            Or type the barcode number
          </div>
          <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: 8 }}>
            <input className="cozy-input" placeholder="e.g. 5901234123457" value={manualCode}
              onChange={e => setManualCode(e.target.value)} inputMode="numeric" />
            <button className="cozy-btn primary" type="submit" disabled={!manualCode.trim()}>Go</button>
          </form>
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

      {status === "manual" && (
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          {error && <div style={{ fontSize: 13, color: "#c0392b", marginBottom: 12, textAlign: "center" }}>{error}</div>}
          <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="cozy-input" placeholder="Type barcode number..." value={manualCode}
              onChange={e => setManualCode(e.target.value)} inputMode="numeric" />
            <button className="cozy-btn primary" type="submit" disabled={!manualCode.trim()}>Go</button>
          </form>
          <button className="cozy-btn secondary full" onClick={() => { setStatus("idle"); setError(null); setManualCode(""); }}>
            Try Another Photo
          </button>
        </div>
      )}

      {status === "found" && scannedItem && (
        <div style={{ animation: "popIn 0.3s ease-out" }}>
          <Card style={{ padding: 16, background: "#edf5ed", border: "2px solid #b8d4b8" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4a7a4a", marginBottom: 4 }}>Found!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{scannedItem.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{scannedItem.category}</div>
            {scannedItem.nutrition && scannedItem.nutrition.calories > 0 && (
              <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                <span><strong>{scannedItem.nutrition.calories}</strong> cal</span>
                <span><strong>{scannedItem.nutrition.protein}g</strong> protein</span>
                <span><strong>{scannedItem.nutrition.carbs}g</strong> carbs</span>
                <span><strong>{scannedItem.nutrition.fat}g</strong> fat</span>
              </div>
            )}
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
