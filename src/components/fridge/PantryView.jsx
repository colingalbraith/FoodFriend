import { useState } from "react";
import { DEFAULT_STAPLES } from "../../constants/storage";

/* Inject pantry door animation once */
if (typeof document !== "undefined" && !document.getElementById("pantry-door-anim")) {
  const style = document.createElement("style");
  style.id = "pantry-door-anim";
  style.textContent = `
    @keyframes pantryDoorOpen {
      0% { transform: perspective(600px) rotateY(0deg); opacity: 0.85; }
      50% { transform: perspective(600px) rotateY(-85deg); opacity: 0.7; }
      65% { transform: perspective(600px) rotateY(-80deg); opacity: 0.3; }
      80% { transform: perspective(600px) rotateY(-90deg); opacity: 0; }
      100% { transform: perspective(600px) rotateY(-90deg); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Map staple names to emojis
const STAPLE_EMOJI = {
  Rice: "🍚", Pasta: "🍝", "Black Beans": "🫘", "Olive Oil": "🫒", Butter: "🧈",
  Flour: "🌾", Sugar: "🍬", Salt: "🧂", Pepper: "🌶️", Garlic: "🧄",
  Onions: "🧅", "Tomato Paste": "🍅", "Soy Sauce": "🫙", Vinegar: "🫙", Eggs: "🥚",
  Milk: "🥛", Bread: "🍞", Coffee: "☕", "Peanut Butter": "🥜", "Protein Powder": "🥛",
  Creatine: "💊",
};

function getStapleEmoji(name) {
  return STAPLE_EMOJI[name] || "🍽️";
}

export default function PantryView({ staples }) {
  const [doorState, setDoorState] = useState("closed"); // "closed" | "opening" | "open"

  function handleTap() {
    if (doorState === "closed") {
      setDoorState("opening");
      setTimeout(() => setDoorState("open"), 700);
    }
  }

  const stapleState = staples || Object.fromEntries(DEFAULT_STAPLES.map(s => [s, true]));
  const allNames = [...new Set([...DEFAULT_STAPLES, ...Object.keys(stapleState)])].filter(n => stapleState[n] !== undefined);
  const allItems = allNames.map(name => ({ name, inStock: stapleState[name] ?? true }));

  const inStockCount = allItems.filter(s => s.inStock).length;
  const totalCount = allItems.length;
  const fullness = totalCount > 0 ? inStockCount / totalCount : 0;

  // Distribute items across 4 shelves
  const shelves = [[], [], [], []];
  allItems.forEach((item, i) => {
    shelves[i % 4].push(item);
  });

  return (
    <div style={{ marginBottom: 20, animation: "popIn 0.5s ease-out" }}>
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 240,
        margin: "0 auto",
        aspectRatio: "5 / 7",
      }}>
        {/* Shadow */}
        <div style={{
          position: "absolute", bottom: -6, left: "10%", right: "10%", height: 12,
          background: "radial-gradient(ellipse, rgba(101,67,33,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        {/* Cabinet body */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(170deg, #8B6914 0%, #6B4F12 40%, #5A3E10 100%)",
          borderRadius: 22,
          boxShadow: "0 6px 24px rgba(101,67,33,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
        }} />

        {/* Interior */}
        <div style={{
          position: "absolute",
          top: 7, left: 7, right: 7, bottom: 7,
          background: "linear-gradient(180deg, #f5e6d0 0%, #efe0c8 50%, #e8d4b8 100%)",
          borderRadius: 16,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Shelves */}
          {shelves.map((shelfItems, shelfIdx) => (
            <div key={shelfIdx} style={{
              flex: 1,
              borderBottom: shelfIdx < 3 ? "3px solid #8B6914" : "none",
              position: "relative",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              alignContent: "flex-end",
              justifyContent: "center",
              gap: 2,
              padding: "2px 4px",
            }}>
              {shelfItems.map((item, i) => (
                <div key={item.name} style={{
                  fontSize: 20,
                  lineHeight: 1,
                  opacity: item.inStock ? 1 : 0.25,
                  filter: item.inStock ? "none" : "grayscale(0.8)",
                  transition: "opacity 0.3s ease",
                  position: "relative",
                  animation: `popIn 0.3s ease-out ${(shelfIdx * 5 + i) * 40}ms both`,
                }}>
                  {getStapleEmoji(item.name)}
                  {!item.inStock && (
                    <div style={{
                      position: "absolute", inset: -1,
                      border: "1.5px dashed #b0a090",
                      borderRadius: 6,
                      pointerEvents: "none",
                    }} />
                  )}
                </div>
              ))}
              {shelfItems.length === 0 && (
                <div style={{ fontSize: 9, fontWeight: 700, color: "#b0a090", opacity: 0.3 }}>
                  empty
                </div>
              )}
            </div>
          ))}

          {/* Warm light glow */}
          <div style={{
            position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)",
            width: "80%", height: 35,
            background: "radial-gradient(ellipse, rgba(255,240,210,0.7) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
        </div>

        {/* Cabinet door */}
        {doorState !== "open" && (
          <div onClick={handleTap} style={{
            position: "absolute", inset: 0,
            transformOrigin: "left center",
            animation: doorState === "opening" ? "pantryDoorOpen 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "none",
            cursor: doorState === "closed" ? "pointer" : "default",
            zIndex: 2,
            WebkitTapHighlightColor: "transparent",
          }}>
            {/* Door surface */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(170deg, #8B6914 0%, #6B4F12 40%, #5A3E10 100%)",
              borderRadius: 22,
              boxShadow: "2px 0 12px rgba(0,0,0,0.2)",
            }} />
            {/* Wood grain effect */}
            <div style={{
              position: "absolute", inset: 8,
              borderRadius: 14,
              border: "2px solid rgba(255,255,255,0.08)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", inset: 16,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.05)",
              pointerEvents: "none",
            }} />
            {/* Door handle */}
            <div style={{
              position: "absolute", right: 12, top: "44%",
              width: 6, height: 32,
              background: "linear-gradient(180deg, #d4a843 0%, #b8922e 100%)",
              borderRadius: 3,
              boxShadow: "1px 1px 3px rgba(0,0,0,0.2)",
            }} />
            {/* Door label + tap hint */}
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "#d4a843", opacity: 0.6 }}>
                Stockd
              </div>
              {doorState === "closed" && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", opacity: 0.4, marginTop: 4 }}>
                  tap to open
                </div>
              )}
            </div>
          </div>
        )}

        {/* Handle (visible after door opens) */}
        <div style={{
          position: "absolute", right: -3, top: "44%",
          width: 5, height: 32,
          background: "linear-gradient(180deg, #d4a843 0%, #b8922e 100%)",
          borderRadius: "0 3px 3px 0",
          boxShadow: "1px 1px 4px rgba(0,0,0,0.15)",
        }} />
      </div>

      {/* Fullness indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
        <div style={{ width: 60, height: 5, borderRadius: 3, background: "#d4c4a8", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${fullness * 100}%`,
            background: fullness > 0.8 ? "#6b8e6b" : fullness > 0.5 ? "#c4a86a" : "#d48a7b",
            transition: "width 0.6s ease-out",
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
          {inStockCount}/{totalCount} stocked
        </span>
      </div>
    </div>
  );
}
