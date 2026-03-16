import { useEffect } from "react";

export default function Toast({ message, onUndo, onDismiss, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div style={{
      position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)",
      zIndex: 900, width: "calc(100% - 40px)", maxWidth: 480,
      animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
    }}>
      <div style={{
        background: "#3a3024", color: "#fff", borderRadius: 14,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 6px 24px rgba(58,48,36,0.35)",
        fontFamily: "var(--body)", fontSize: 13, fontWeight: 600,
      }}>
        <span style={{ flex: 1 }}>{message}</span>
        {onUndo && (
          <button onClick={onUndo} style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            color: "#f0c87a", fontFamily: "var(--body)", fontWeight: 800, fontSize: 12,
            padding: "6px 14px", cursor: "pointer", whiteSpace: "nowrap",
            WebkitTapHighlightColor: "transparent",
          }}>
            Undo
          </button>
        )}
        <button onClick={onDismiss} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.4)",
          fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1,
          WebkitTapHighlightColor: "transparent",
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}
