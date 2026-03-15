import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import FridgeFriend from "./App";

// Polyfill window.storage using localStorage
window.storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value !== null ? { value } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FridgeFriend />
  </StrictMode>
);
