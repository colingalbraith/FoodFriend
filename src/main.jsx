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

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FridgeFriend />
  </StrictMode>
);
