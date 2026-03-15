export default function Badge({ label }) {
  if (!label) return null;
  return (
    <span style={{
      display: "inline-block", padding: "2px 7px", borderRadius: 20,
      fontSize: 10, fontWeight: 800, fontFamily: "var(--body)",
      color: label.color, background: label.bg, border: `1px solid ${label.color}22`,
    }}>
      {label.text}
    </span>
  );
}
