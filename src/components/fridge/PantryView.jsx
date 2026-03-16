import { DEFAULT_STAPLES } from "../../constants/storage";
import { getFoodEmoji } from "../../constants/foodEmoji";

export default function PantryView({ staples }) {
  const stapleState = staples || Object.fromEntries(DEFAULT_STAPLES.map(s => [s, true]));
  const allNames = [...new Set([...DEFAULT_STAPLES, ...Object.keys(stapleState)])].filter(n => stapleState[n] !== undefined);
  const allItems = allNames.map(name => ({ name, inStock: stapleState[name] ?? true }));
  const inStockCount = allItems.filter(s => s.inStock).length;
  const totalCount = allItems.length;
  const fullness = totalCount > 0 ? inStockCount / totalCount : 0;

  const shelves = [[], [], [], []];
  allItems.forEach((item, i) => { shelves[i % 4].push(item); });

  return (
    <div style={{ marginBottom: 10, animation: "popIn 0.5s ease-out" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 200, margin: "0 auto", aspectRatio: "5 / 7" }}>
        <div style={{ position: "absolute", bottom: -6, left: "10%", right: "10%", height: 12, background: "radial-gradient(ellipse, rgba(101,67,33,0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg, #8B6914 0%, #6B4F12 40%, #5A3E10 100%)", borderRadius: 22, boxShadow: "0 6px 24px rgba(101,67,33,0.25), inset 0 1px 0 rgba(255,255,255,0.15)" }} />
        <div style={{ position: "absolute", top: 7, left: 7, right: 7, bottom: 7, background: "linear-gradient(180deg, #f5e6d0 0%, #efe0c8 50%, #e8d4b8 100%)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {shelves.map((shelfItems, shelfIdx) => (
            <div key={shelfIdx} style={{ flex: 1, borderBottom: shelfIdx < 3 ? "3px solid #8B6914" : "none", position: "relative", display: "flex", flexWrap: "wrap", alignItems: "flex-end", alignContent: "flex-end", justifyContent: "center", gap: 2, padding: "2px 4px" }}>
              {shelfItems.map((item, i) => (
                <div key={item.name} style={{ fontSize: 20, lineHeight: 1, opacity: item.inStock ? 1 : 0.25, filter: item.inStock ? "none" : "grayscale(0.8)", transition: "opacity 0.3s ease", position: "relative", animation: `popIn 0.3s ease-out ${(shelfIdx * 5 + i) * 40}ms both` }}>
                  {getFoodEmoji(item.name)}
                  {!item.inStock && <div style={{ position: "absolute", inset: -1, border: "1.5px dashed #b0a090", borderRadius: 6, pointerEvents: "none" }} />}
                </div>
              ))}
              {shelfItems.length === 0 && <div style={{ fontSize: 9, fontWeight: 700, color: "#b0a090", opacity: 0.3 }}>empty</div>}
            </div>
          ))}
          <div style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", width: "80%", height: 35, background: "radial-gradient(ellipse, rgba(255,240,210,0.7) 0%, transparent 70%)", pointerEvents: "none" }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
        <div style={{ width: 60, height: 5, borderRadius: 3, background: "#d4c4a8", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, width: `${fullness * 100}%`, background: fullness > 0.8 ? "#6b8e6b" : fullness > 0.5 ? "#c4a86a" : "#d48a7b", transition: "width 0.6s ease-out" }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{inStockCount}/{totalCount} stocked</span>
      </div>
    </div>
  );
}
