import { CATEGORY_COLORS } from "../../constants/categories";
import { daysUntil } from "../../utils/dateHelpers";

// Which shelf each category lives on
const SHELF_MAP = {
  Frozen: 0,
  Dairy: 1, Beverages: 1, Condiments: 1,
  Meat: 2, Seafood: 2, Leftovers: 2, Grains: 2,
  Produce: 3, Bakery: 3, Snacks: 3, Other: 2,
};

const SHELF_LABELS = ["Freezer", "Top Shelf", "Middle", "Crisper"];

export default function FridgeView({ items }) {
  // Distribute items into shelves
  const shelves = [[], [], [], []];
  items.forEach(item => {
    const shelf = SHELF_MAP[item.category] ?? 2;
    shelves[shelf].push(item);
  });

  const totalCapacity = 30;
  const fullness = Math.min(items.length / totalCapacity, 1);

  return (
    <div style={{ marginBottom: 16, animation: "popIn 0.4s ease-out" }}>
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 300,
        margin: "0 auto",
        aspectRatio: "3 / 4",
      }}>
        {/* Fridge body */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #d4b896 0%, #c4a882 100%)",
          borderRadius: 20,
          boxShadow: "0 4px 20px rgba(139,109,71,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
        }} />

        {/* Fridge interior */}
        <div style={{
          position: "absolute",
          top: 8, left: 8, right: 8, bottom: 8,
          background: "linear-gradient(180deg, #f8f4ee 0%, #fffaf3 100%)",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Freezer compartment (shelf 0) */}
          <div style={{
            flex: "0 0 22%",
            borderBottom: "3px solid #e0d0b8",
            position: "relative",
            background: "linear-gradient(180deg, #e8f0f8 0%, #f0f4f8 100%)",
          }}>
            <div style={{
              position: "absolute", top: 4, left: 8,
              fontSize: 8, fontWeight: 700, color: "#8ab4d4", opacity: 0.6,
              letterSpacing: 0.5, textTransform: "uppercase",
            }}>
              {SHELF_LABELS[0]}
            </div>
            <ShelfItems items={shelves[0]} />
          </div>

          {/* Main compartment shelves */}
          {[1, 2, 3].map(shelfIdx => (
            <div key={shelfIdx} style={{
              flex: shelfIdx === 3 ? "0 0 28%" : "1",
              borderBottom: shelfIdx < 3 ? "2px solid #e8dcc8" : "none",
              position: "relative",
              background: shelfIdx === 3
                ? "linear-gradient(180deg, #f0f8f0 0%, #f5faf5 100%)"
                : undefined,
            }}>
              <div style={{
                position: "absolute", top: 3, left: 8,
                fontSize: 7, fontWeight: 700, color: "var(--muted)", opacity: 0.4,
                letterSpacing: 0.5, textTransform: "uppercase",
              }}>
                {SHELF_LABELS[shelfIdx]}
              </div>
              <ShelfItems items={shelves[shelfIdx]} />
            </div>
          ))}

          {/* Fridge light glow */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: "60%", height: 30,
            background: "radial-gradient(ellipse, rgba(255,248,230,0.8) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
        </div>

        {/* Handle */}
        <div style={{
          position: "absolute",
          right: -4, top: "38%",
          width: 6, height: 40,
          background: "linear-gradient(180deg, #b89878 0%, #a8886a 100%)",
          borderRadius: "0 4px 4px 0",
          boxShadow: "1px 1px 3px rgba(0,0,0,0.1)",
        }} />

        {/* Fullness indicator */}
        <div style={{
          position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--card)", borderRadius: 12, padding: "4px 12px",
          boxShadow: "0 2px 8px rgba(139,109,71,0.1)",
          border: "1.5px solid var(--border)",
        }}>
          <div style={{
            width: 50, height: 5, borderRadius: 3,
            background: "#e8dcc8",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${fullness * 100}%`,
              background: fullness > 0.8 ? "#d48a7b" : fullness > 0.5 ? "#e8c86a" : "#7cb87c",
              transition: "width 0.5s ease-out",
            }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>
            {items.length} items
          </span>
        </div>
      </div>
    </div>
  );
}

function ShelfItems({ items }) {
  if (items.length === 0) return null;

  return (
    <div style={{
      position: "absolute", bottom: 6, left: 6, right: 6,
      display: "flex", flexWrap: "wrap", gap: 3,
      alignItems: "flex-end", alignContent: "flex-end",
    }}>
      {items.slice(0, 12).map((item, i) => {
        const days = daysUntil(item.expiry);
        const isExpiring = days >= 0 && days <= 3;
        const isExpired = days < 0;
        const color = CATEGORY_COLORS[item.category] || "#b0a090";

        return (
          <div
            key={item.id}
            title={`${item.name} - ${days}d`}
            style={{
              height: 18,
              padding: "0 6px",
              borderRadius: 5,
              background: color,
              opacity: isExpired ? 0.4 : 0.85,
              display: "flex", alignItems: "center",
              animation: `popIn 0.3s ease-out ${i * 40}ms both`,
              position: "relative",
              maxWidth: 70,
            }}
          >
            <span style={{
              fontSize: 8, fontWeight: 700, color: "white",
              textShadow: "0 0.5px 1px rgba(0,0,0,0.2)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {item.name}
            </span>
            {isExpiring && (
              <div style={{
                position: "absolute", top: -2, right: -2,
                width: 6, height: 6, borderRadius: "50%",
                background: "#e74c3c",
                border: "1px solid white",
                animation: "gentlePulse 1.5s ease-in-out infinite",
              }} />
            )}
          </div>
        );
      })}
      {items.length > 12 && (
        <div style={{
          fontSize: 8, fontWeight: 700, color: "var(--muted)",
          padding: "0 4px", height: 18, display: "flex", alignItems: "center",
        }}>
          +{items.length - 12}
        </div>
      )}
    </div>
  );
}
