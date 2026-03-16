import { daysUntil } from "../../utils/dateHelpers";
import { getFoodEmoji } from "../../constants/foodEmoji";

const SHELF_MAP = {
  Frozen: 0,
  Dairy: 1, Beverages: 1, Condiments: 1,
  Meat: 2, Seafood: 2, Leftovers: 2, Grains: 2,
  Produce: 3, Bakery: 3, Snacks: 3, Other: 2,
};

function FoodItem({ item, index, onTap }) {
  const days = daysUntil(item.expiry);
  const isExpiring = days >= 0 && days <= 3;
  const isExpired = days < 0;
  const emoji = getFoodEmoji(item.name, item.category);

  return (
    <div onClick={(e) => { e.stopPropagation(); onTap(item); }} style={{
      position: "relative",
      animation: `popIn 0.3s ease-out ${index * 60}ms both`,
      opacity: isExpired ? 0.3 : 1,
      filter: isExpired ? "grayscale(0.5)" : "none",
      transition: "opacity 0.3s ease",
      fontSize: 28, lineHeight: 1,
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent",
    }}>
      {emoji}
      {isExpiring && (
        <div style={{
          position: "absolute", top: -2, right: -2,
          width: 8, height: 8, borderRadius: "50%",
          background: "#e74c3c", border: "1.5px solid white",
          animation: "gentlePulse 1.5s ease-in-out infinite",
        }} />
      )}
    </div>
  );
}

export default function FridgeView({ items, onItemTap }) {
  const shelves = [[], [], [], []];
  items.forEach(item => {
    const shelf = SHELF_MAP[item.category] ?? 2;
    shelves[shelf].push(item);
  });

  const totalCapacity = 30;
  const fullness = Math.min(items.length / totalCapacity, 1);
  const isEmpty = items.length === 0;

  return (
    <div style={{ animation: "popIn 0.5s ease-out" }}>
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 280,
        margin: "0 auto",
        aspectRatio: "5 / 7",
      }}>
        {/* Shadow */}
        <div style={{
          position: "absolute", bottom: -6, left: "10%", right: "10%", height: 12,
          background: "radial-gradient(ellipse, rgba(139,109,71,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        {/* Fridge body */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(170deg, #e8dcc8 0%, #d4c4a8 40%, #c4b496 100%)",
          borderRadius: 22,
          boxShadow: "0 6px 24px rgba(139,109,71,0.18), inset 0 1px 0 rgba(255,255,255,0.4)",
        }} />

        {/* Interior */}
        <div style={{
          position: "absolute", top: 7, left: 7, right: 7, bottom: 7,
          background: "linear-gradient(180deg, #faf8f4 0%, #fffcf7 100%)",
          borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Freezer */}
          <div style={{ flex: "0 0 22%", borderBottom: "3px solid #ddd0bc", position: "relative", background: "linear-gradient(180deg, #e6eef6 0%, #eef3f8 100%)", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.12, background: "repeating-linear-gradient(120deg, transparent, transparent 10px, rgba(255,255,255,0.8) 10px, rgba(255,255,255,0.8) 11px)" }} />
            <ShelfItems items={shelves[0]} onTap={onItemTap} />
          </div>
          {/* Top shelf */}
          <div style={{ flex: 1, borderBottom: "2px solid #e8dcc8", position: "relative" }}>
            <ShelfItems items={shelves[1]} onTap={onItemTap} />
          </div>
          {/* Middle shelf */}
          <div style={{ flex: 1, borderBottom: "2px solid #e8dcc8", position: "relative" }}>
            <ShelfItems items={shelves[2]} onTap={onItemTap} />
          </div>
          {/* Crisper */}
          <div style={{ flex: "0 0 26%", position: "relative", background: "linear-gradient(180deg, #eef5ee 0%, #f4faf4 100%)" }}>
            <div style={{ position: "absolute", top: 0, left: 12, right: 12, height: 2, background: "linear-gradient(90deg, transparent, #c8d8c0, transparent)", borderRadius: 1 }} />
            <ShelfItems items={shelves[3]} onTap={onItemTap} />
          </div>

          {/* Light glow */}
          <div style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", width: "80%", height: 35, background: "radial-gradient(ellipse, rgba(255,252,240,0.9) 0%, transparent 70%)", pointerEvents: "none" }} />

          {isEmpty && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", opacity: 0.35 }}>Add some food!</div>
            </div>
          )}
        </div>
      </div>

      {/* Fullness */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
        <div style={{ width: 60, height: 5, borderRadius: 3, background: "#e8dcc8", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, width: `${fullness * 100}%`, background: fullness > 0.8 ? "#d48a7b" : fullness > 0.5 ? "#e8c86a" : "#7cb87c", transition: "width 0.6s ease-out" }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
          {items.length === 0 ? "Empty" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}

function ShelfItems({ items, onTap }) {
  if (items.length === 0) return null;
  return (
    <div style={{
      position: "absolute", bottom: 2, left: 4, right: 4, top: 2,
      display: "flex", flexWrap: "wrap", gap: 3,
      alignItems: "flex-end", alignContent: "flex-end", justifyContent: "center",
    }}>
      {items.slice(0, 8).map((item, i) => (
        <FoodItem key={item.id} item={item} index={i} onTap={onTap || (() => {})} />
      ))}
      {items.length > 8 && (
        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", opacity: 0.4, padding: "0 2px", display: "flex", alignItems: "flex-end" }}>
          +{items.length - 8}
        </div>
      )}
    </div>
  );
}
