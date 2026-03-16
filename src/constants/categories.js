export const CATEGORY_COLORS = {
  Produce: "#7cb87c", Dairy: "#e8c86a", Meat: "#d48a7b", Seafood: "#7ba8c4",
  Grains: "#c4a86a", Frozen: "#8ab4d4", Condiments: "#b89878", Beverages: "#8ac4a8",
  Snacks: "#d4a87b", Bakery: "#c49a6a", Leftovers: "#a89080", Other: "#b0a090",
};

export const CATEGORY_EMOJI = {
  Produce: "🥬", Dairy: "🧀", Meat: "🥩", Seafood: "🐟", Grains: "🌾",
  Frozen: "🧊", Condiments: "🫙", Beverages: "🥤", Snacks: "🍪",
  Bakery: "🍞", Leftovers: "🍲", Other: "🛒",
};

export const CATEGORIES = Object.keys(CATEGORY_EMOJI);

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const TABS = [
  { id: "fridge", label: "Food" },
  { id: "overview", label: "Overview" },
  { id: "meals", label: "Nutrition" },
  { id: "gym", label: "Gym" },
  { id: "settings", label: "Settings" },
];
