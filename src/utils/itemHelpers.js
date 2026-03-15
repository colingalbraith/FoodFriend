import { EXPIRY_ESTIMATES } from "../constants/expiryEstimates";

export function autoExpiry(name) {
  const key = name.toLowerCase().trim();
  const match = EXPIRY_ESTIMATES[key];
  if (match) {
    const d = new Date();
    d.setDate(d.getDate() + match.days);
    return { expiry: d.toISOString().split("T")[0], category: match.cat };
  }
  // partial match
  for (const [k, v] of Object.entries(EXPIRY_ESTIMATES)) {
    if (key.includes(k) || k.includes(key)) {
      const d = new Date();
      d.setDate(d.getDate() + v.days);
      return { expiry: d.toISOString().split("T")[0], category: v.cat };
    }
  }
  return { expiry: null, category: "Other" };
}

export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
