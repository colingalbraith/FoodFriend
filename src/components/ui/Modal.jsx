import { useEffect } from "react";

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: "rgba(90,62,34,0.35)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      }} />

      {/* Card */}
      <div style={{
        position: "relative", background: "var(--card)",
        borderRadius: 20, width: "100%", maxWidth: 420,
        maxHeight: "80vh", display: "flex", flexDirection: "column",
        boxShadow: "0 8px 40px rgba(139,109,71,0.2)",
        animation: "popIn 0.25s ease-out",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          {title ? (
            <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{title}</div>
          ) : <div />}
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            width: 36, height: 36, borderRadius: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "var(--muted)", flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, minHeight: 0,
          overflowY: "auto", WebkitOverflowScrolling: "touch",
          padding: 18,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
