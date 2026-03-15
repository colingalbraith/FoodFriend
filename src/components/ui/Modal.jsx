export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", inset: 0, background: "rgba(90,62,34,0.3)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      }} onClick={onClose} />
      <div style={{
        position: "relative", background: "var(--card)", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 500, maxHeight: "85vh", overflow: "auto",
        padding: 24, animation: "slideUp 0.3s ease-out",
        boxShadow: "0 -4px 30px rgba(139,109,71,0.15)",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd", margin: "0 auto 16px" }} />
        {title && (
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
