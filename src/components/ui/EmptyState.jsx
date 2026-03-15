export default function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: 40, color: "#b8a080", animation: "fadeIn 0.4s ease-out" }}>
      {icon && <div style={{ fontSize: 48, marginBottom: 10 }}>{icon}</div>}
      <div style={{ fontFamily: "var(--display)", fontSize: 22 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
