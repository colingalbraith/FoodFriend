import { daysUntil } from "../../utils/dateHelpers";

const SHELF_MAP = {
  Frozen: 0,
  Dairy: 1, Beverages: 1, Condiments: 1,
  Meat: 2, Seafood: 2, Leftovers: 2, Grains: 2,
  Produce: 3, Bakery: 3, Snacks: 3, Other: 2,
};

// Food name → emoji mapping (keyword match)
const FOOD_EMOJI = {
  apple: "🍎", banana: "🍌", orange: "🍊", lemon: "🍋", lime: "🍋",
  grape: "🍇", strawberry: "🍓", blueberry: "🫐", raspberry: "🫐",
  cherry: "🍒", peach: "🍑", pear: "🍐", watermelon: "🍉", melon: "🍈",
  mango: "🥭", kiwi: "🥝", pineapple: "🍍", coconut: "🥥", avocado: "🥑",
  tomato: "🍅", corn: "🌽", pepper: "🌶️", "bell pepper": "🫑",
  broccoli: "🥦", lettuce: "🥬", spinach: "🥬", kale: "🥬", arugula: "🥬",
  cucumber: "🥒", carrot: "🥕", potato: "🥔", "sweet potato": "🍠",
  onion: "🧅", garlic: "🧄", mushroom: "🍄", ginger: "🫚",
  egg: "🥚", eggs: "🥚",
  milk: "🥛", "oat milk": "🥛", "almond milk": "🥛",
  cheese: "🧀", butter: "🧈", yogurt: "🥛",
  chicken: "🍗", turkey: "🍗", steak: "🥩", beef: "🥩",
  pork: "🥩", bacon: "🥓", ham: "🍖", sausage: "🌭",
  fish: "🐟", salmon: "🐟", tuna: "🐟", shrimp: "🦐", crab: "🦀",
  lobster: "🦞",
  bread: "🍞", bagel: "🥯", croissant: "🥐", pretzel: "🥨",
  rice: "🍚", pasta: "🍝", noodle: "🍜", spaghetti: "🍝",
  pizza: "🍕", burger: "🍔", sandwich: "🥪", taco: "🌮", burrito: "🌯",
  "hot dog": "🌭", fries: "🍟",
  cake: "🍰", cookie: "🍪", donut: "🍩", chocolate: "🍫",
  candy: "🍬", "ice cream": "🍦", pie: "🥧", cupcake: "🧁",
  coffee: "☕", tea: "🍵", juice: "🧃", water: "💧",
  wine: "🍷", beer: "🍺", soda: "🥤",
  honey: "🍯", jam: "🫙", "peanut butter": "🥜", nut: "🥜", almond: "🥜",
  bean: "🫘", "black bean": "🫘", lentil: "🫘", chickpea: "🫘",
  tofu: "🧊", "soy sauce": "🫙",
  salt: "🧂", oil: "🫒", "olive oil": "🫒", vinegar: "🫙",
  flour: "🌾", oat: "🌾", cereal: "🥣",
  "protein powder": "🥛", creatine: "💊", supplement: "💊",
  soup: "🍲", stew: "🍲", curry: "🍛", salad: "🥗",
  sushi: "🍣", dumpling: "🥟", "spring roll": "🥟",
  waffle: "🧇", pancake: "🥞",
  popcorn: "🍿", chip: "🍿",
  "tomato paste": "🍅", "cream cheese": "🧀", "sour cream": "🥛",
  "ground beef": "🥩", "ground turkey": "🍗", "chicken breast": "🍗",
};

const CATEGORY_FALLBACK = {
  Produce: "🥬", Dairy: "🧀", Meat: "🥩", Seafood: "🐟",
  Grains: "🌾", Frozen: "🧊", Condiments: "🫙", Beverages: "🥤",
  Snacks: "🍪", Bakery: "🍞", Leftovers: "🍲", Other: "🍽️",
};

function getFoodEmoji(name, category) {
  const key = name.toLowerCase().trim();
  // Exact match
  if (FOOD_EMOJI[key]) return FOOD_EMOJI[key];
  // Partial match — check if any keyword is in the name or name is in keyword
  for (const [k, v] of Object.entries(FOOD_EMOJI)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  // Singular/plural
  const singular = key.endsWith("s") ? key.slice(0, -1) : key;
  if (FOOD_EMOJI[singular]) return FOOD_EMOJI[singular];
  const plural = key + "s";
  if (FOOD_EMOJI[plural]) return FOOD_EMOJI[plural];
  // Category fallback
  return CATEGORY_FALLBACK[category] || "🍽️";
}

function FoodItem({ item, index }) {
  const days = daysUntil(item.expiry);
  const isExpiring = days >= 0 && days <= 3;
  const isExpired = days < 0;
  const emoji = getFoodEmoji(item.name, item.category);

  return (
    <div style={{
      position: "relative",
      animation: `popIn 0.3s ease-out ${index * 60}ms both`,
      opacity: isExpired ? 0.3 : 1,
      filter: isExpired ? "grayscale(0.5)" : "none",
      transition: "opacity 0.3s ease",
      fontSize: 22,
      lineHeight: 1,
    }}>
      {emoji}
      {isExpiring && (
        <div style={{
          position: "absolute", top: -2, right: -2,
          width: 7, height: 7, borderRadius: "50%",
          background: "#e74c3c", border: "1.5px solid white",
          animation: "gentlePulse 1.5s ease-in-out infinite",
        }} />
      )}
    </div>
  );
}

export default function FridgeView({ items }) {
  const shelves = [[], [], [], []];
  items.forEach(item => {
    const shelf = SHELF_MAP[item.category] ?? 2;
    shelves[shelf].push(item);
  });

  const totalCapacity = 30;
  const fullness = Math.min(items.length / totalCapacity, 1);
  const isEmpty = items.length === 0;

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
          position: "absolute",
          top: 7, left: 7, right: 7, bottom: 7,
          background: "linear-gradient(180deg, #faf8f4 0%, #fffcf7 100%)",
          borderRadius: 16,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Freezer */}
          <div style={{
            flex: "0 0 22%", borderBottom: "3px solid #ddd0bc",
            position: "relative",
            background: "linear-gradient(180deg, #e6eef6 0%, #eef3f8 100%)",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0, opacity: 0.12,
              background: "repeating-linear-gradient(120deg, transparent, transparent 10px, rgba(255,255,255,0.8) 10px, rgba(255,255,255,0.8) 11px)",
            }} />
            <ShelfItems items={shelves[0]} />
          </div>

          {/* Top shelf */}
          <div style={{ flex: 1, borderBottom: "2px solid #e8dcc8", position: "relative" }}>
            <ShelfItems items={shelves[1]} />
          </div>

          {/* Middle shelf */}
          <div style={{ flex: 1, borderBottom: "2px solid #e8dcc8", position: "relative" }}>
            <ShelfItems items={shelves[2]} />
          </div>

          {/* Crisper */}
          <div style={{
            flex: "0 0 26%", position: "relative",
            background: "linear-gradient(180deg, #eef5ee 0%, #f4faf4 100%)",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 12, right: 12, height: 2,
              background: "linear-gradient(90deg, transparent, #c8d8c0, transparent)", borderRadius: 1,
            }} />
            <ShelfItems items={shelves[3]} />
          </div>

          {/* Light glow */}
          <div style={{
            position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)",
            width: "80%", height: 35,
            background: "radial-gradient(ellipse, rgba(255,252,240,0.9) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {isEmpty && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", opacity: 0.35, marginTop: 16 }}>
                Add some food!
              </div>
            </div>
          )}
        </div>

        {/* Handle */}
        <div style={{
          position: "absolute", right: -3, top: "36%",
          width: 5, height: 36,
          background: "linear-gradient(180deg, #c4a882 0%, #b09070 100%)",
          borderRadius: "0 3px 3px 0",
          boxShadow: "1px 1px 4px rgba(0,0,0,0.1)",
        }} />

        {/* Magnets */}
        <div style={{ position: "absolute", top: 14, left: 14, width: 8, height: 8, borderRadius: 2, background: "#d48a7b", opacity: 0.6, transform: "rotate(5deg)" }} />
        <div style={{ position: "absolute", top: 12, left: 26, width: 6, height: 9, borderRadius: 2, background: "#8ab4d4", opacity: 0.5, transform: "rotate(-8deg)" }} />
        <div style={{ position: "absolute", top: 18, right: 16, width: 7, height: 7, borderRadius: "50%", background: "#e8c86a", opacity: 0.5 }} />
      </div>

      {/* Fullness */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
        <div style={{ width: 60, height: 5, borderRadius: 3, background: "#e8dcc8", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${fullness * 100}%`,
            background: fullness > 0.8 ? "#d48a7b" : fullness > 0.5 ? "#e8c86a" : "#7cb87c",
            transition: "width 0.6s ease-out",
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
          {items.length === 0 ? "Empty" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}

function ShelfItems({ items }) {
  if (items.length === 0) return null;
  return (
    <div style={{
      position: "absolute", bottom: 2, left: 4, right: 4, top: 2,
      display: "flex", flexWrap: "wrap", gap: 2,
      alignItems: "flex-end", alignContent: "flex-end",
      justifyContent: "center",
    }}>
      {items.slice(0, 6).map((item, i) => (
        <FoodItem key={item.id} item={item} index={i} />
      ))}
      {items.length > 6 && (
        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--muted)", opacity: 0.4, padding: "0 2px", display: "flex", alignItems: "flex-end" }}>
          +{items.length - 6}
        </div>
      )}
    </div>
  );
}
