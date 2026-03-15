export function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const e = new Date(dateStr); e.setHours(0, 0, 0, 0);
  return Math.ceil((e - t) / 864e5);
}

export function expiryBadge(days) {
  if (days === Infinity) return null;
  if (days < 0) return { text: "Expired!", color: "#c0392b", bg: "#fde8e8" };
  if (days === 0) return { text: "Today!", color: "#d35400", bg: "#fef3e2" };
  if (days <= 2) return { text: `${days}d`, color: "#e67e22", bg: "#fef3e2" };
  if (days <= 5) return { text: `${days}d`, color: "#b8860b", bg: "#fef9e7" };
  return { text: `${days}d`, color: "#6b8e6b", bg: "#edf5ed" };
}

export function getWeekDates() {
  const t = new Date();
  const dow = t.getDay();
  const mon = new Date(t);
  mon.setDate(t.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}
