export default function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "var(--card)", borderRadius: 16, border: "2px solid var(--border)",
      boxShadow: "0 2px 12px rgba(139,109,71,0.07)", padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}
