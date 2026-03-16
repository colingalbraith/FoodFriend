import { useState, useMemo } from "react";
import Card from "../ui/Card";
import { getWeekDates } from "../../utils/dateHelpers";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];
const GROUP_COLORS = { Chest: "#d48a7b", Back: "#8ab4d4", Shoulders: "#c4a86a", Arms: "#b89878", Legs: "#7cb87c", Core: "#d4a87b", Cardio: "#8ac4a8" };
const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

function linearRegression(pts) {
  const n = pts.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += pts[i]; sxy += i * pts[i]; sxx += i * i; }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  return { m: (n * sxy - sx * sy) / denom, b: (sy - (n * sxy - sx * sy) / denom * sx) / n };
}

function getOverloadSuggestion(name, gymLog) {
  const sessions = (gymLog || []).filter(e => e.name === name && e.sets?.length > 0).slice(0, 3);
  if (sessions.length === 0) return null;
  const last = sessions[0];
  const maxW = Math.max(...last.sets.map(s => Number(s.weight) || 0));
  const maxR = Math.max(...last.sets.filter(s => Number(s.weight) === maxW).map(s => Number(s.reps) || 0));
  if (maxR >= 8) return { exercise: name, current: maxW, suggested: maxW + 5, reason: `Hit ${maxR} reps at ${maxW}lb — go up!`, up: true };
  if (maxR < 5) return { exercise: name, current: maxW, suggested: maxW, reason: `Build to 8 reps at ${maxW}lb`, up: false };
  return { exercise: name, current: maxW, suggested: maxW, reason: `${maxR} reps at ${maxW}lb — keep pushing`, up: false };
}

export default function StatsTab({ macroLog, macroGoals, gymLog, bodyWeight }) {
  const [section, setSection] = useState("nutrition");
  const [trendExercise, setTrendExercise] = useState(null);
  const goals = macroGoals || DEFAULT_GOALS;
  const weekDates = getWeekDates();
  const today = weekDates[0];

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // ═══ NUTRITION DATA ═══
  const nutritionWeek = last7.map(date => {
    const entries = (macroLog || []).filter(e => e.date === date);
    return {
      date, label: date === today ? "Today" : DAYS_OF_WEEK[new Date(date + "T12:00:00").getDay()],
      calories: entries.reduce((s, e) => s + (Number(e.calories) || 0), 0),
      protein: entries.reduce((s, e) => s + (Number(e.protein) || 0), 0),
      entries: entries.length,
    };
  });
  const maxCal = Math.max(goals.calories, ...nutritionWeek.map(d => d.calories));

  // ═══ GYM DATA ═══
  const gymWeek = last7.map(date => {
    const entries = (gymLog || []).filter(e => e.date === date);
    return {
      date, entries: entries.length,
      totalSets: entries.reduce((s, e) => s + (e.sets?.length || 0), 0),
      totalVolume: entries.reduce((s, e) => s + (e.sets || []).reduce((v, set) => v + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0),
      label: date === today ? "Today" : DAYS_OF_WEEK[new Date(date + "T12:00:00").getDay()],
      groups: [...new Set(entries.map(e => e.group))],
    };
  });
  const maxVol = Math.max(1, ...gymWeek.map(d => d.totalVolume));
  const uniqueExercises = [...new Set((gymLog || []).map(e => e.name))];

  function getPR(name) { let max = 0; (gymLog || []).filter(e => e.name === name).forEach(e => (e.sets || []).forEach(s => { if (Number(s.weight) > max) max = Number(s.weight); })); return max; }
  function getProgress(name) { return (gymLog || []).filter(e => e.name === name && e.sets?.length > 0).slice(0, 5).reverse().map(e => ({ maxWeight: Math.max(...e.sets.map(s => Number(s.weight) || 0)) })); }

  const overloadSuggestions = useMemo(() => {
    const names = [...new Set((gymLog || []).filter(e => last7.includes(e.date) && e.sets?.length > 0).map(e => e.name))];
    return names.map(n => getOverloadSuggestion(n, gymLog)).filter(Boolean);
  }, [gymLog]);

  const groupDistribution = useMemo(() => {
    const counts = {}; MUSCLE_GROUPS.forEach(g => { counts[g] = 0; });
    (gymLog || []).filter(e => last7.includes(e.date)).forEach(e => { if (e.group && counts[e.group] !== undefined) counts[e.group] += (e.sets?.length || 0); });
    return counts;
  }, [gymLog]);
  const totalGroupSets = Object.values(groupDistribution).reduce((a, b) => a + b, 0);

  const activeTrend = trendExercise || (uniqueExercises.length > 0 ? uniqueExercises[0] : null);
  const trendData = useMemo(() => {
    if (!activeTrend) return [];
    return (gymLog || []).filter(e => e.name === activeTrend && e.sets?.length > 0).slice(0, 10).reverse().map(e => Math.max(...e.sets.map(s => Number(s.weight) || 0)));
  }, [gymLog, activeTrend]);

  // Body weight
  const bwEntries = (bodyWeight || []).sort((a, b) => a.date.localeCompare(b.date));
  const latestBW = bwEntries.length > 0 ? Number(bwEntries[bwEntries.length - 1].weight) : null;
  const bwAvg7 = (() => { const r = bwEntries.slice(-7); return r.length > 0 ? (r.reduce((s, e) => s + Number(e.weight), 0) / r.length).toFixed(1) : null; })();
  const bwChange = latestBW && bwEntries.length > 1 ? (latestBW - Number(bwEntries[0].weight)).toFixed(1) : null;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ id: "nutrition", label: "Nutrition" }, { id: "gym", label: "Gym" }].map(s => (
          <button key={s.id} className={`filter-chip ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>{s.label}</button>
        ))}
      </div>

      {/* ═══ NUTRITION STATS ═══ */}
      {section === "nutrition" && (
        <>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Nutrition Stats</div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Goal: {goals.calories} cal/day</span>
          </div>
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Calories</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {nutritionWeek.map(d => {
                const h = maxCal > 0 ? (d.calories / maxCal) * 100 : 0;
                const over = d.calories > goals.calories;
                return (<div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>{d.calories > 0 ? d.calories : ""}</div>
                  <div style={{ width: "100%", height: 100, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", height: `${h}%`, minHeight: d.calories > 0 ? 4 : 0, borderRadius: "4px 4px 0 0", background: over ? "linear-gradient(180deg, #d48a7b, #c47a6b)" : "linear-gradient(180deg, #6b8e6b, #5a7a5a)", transition: "height 0.5s ease" }} /></div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div>
                </div>);
              })}
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Protein</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
              {nutritionWeek.map(d => {
                const maxP = Math.max(goals.protein, ...nutritionWeek.map(x => x.protein));
                const h = maxP > 0 ? (d.protein / maxP) * 100 : 0;
                return (<div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>{d.protein > 0 ? d.protein + "g" : ""}</div>
                  <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", height: `${h}%`, minHeight: d.protein > 0 ? 4 : 0, borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg, #8ab4d4, #7aa4c4)", transition: "height 0.5s ease" }} /></div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div>
                </div>);
              })}
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>7-Day Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Avg Calories", val: Math.round(nutritionWeek.reduce((s, d) => s + d.calories, 0) / 7) },
                { label: "Avg Protein", val: Math.round(nutritionWeek.reduce((s, d) => s + d.protein, 0) / 7) + "g" },
                { label: "Days Tracked", val: nutritionWeek.filter(d => d.entries > 0).length + "/7" },
                { label: "Goal Hit Rate", val: Math.round(nutritionWeek.filter(d => d.calories >= goals.calories * 0.9 && d.calories <= goals.calories * 1.1).length / 7 * 100) + "%" },
              ].map(s => (<div key={s.label}><div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{s.val}</div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>{s.label}</div></div>))}
            </div>
          </Card>
        </>
      )}

      {/* ═══ GYM STATS ═══ */}
      {section === "gym" && (
        <>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Gym Stats</div>

          {/* Weekly Volume */}
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Weekly Volume</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
              {gymWeek.map(d => {
                const h = maxVol > 0 ? (d.totalVolume / maxVol) * 100 : 0;
                return (<div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "var(--muted)" }}>{d.totalVolume > 0 ? (d.totalVolume > 999 ? (d.totalVolume / 1000).toFixed(1) + "k" : d.totalVolume) : ""}</div>
                  <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", height: `${h}%`, minHeight: d.totalVolume > 0 ? 4 : 0, borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg, var(--accent), #a8784e)", transition: "height 0.5s ease" }} /></div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div>
                </div>);
              })}
            </div>
          </Card>

          {/* Activity */}
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Activity</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {gymWeek.map(d => (<div key={d.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: d.entries > 0 ? "linear-gradient(135deg, #6b8e6b, #5a7a5a)" : "#e8dcc8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: d.entries > 0 ? "white" : "var(--muted)" }}>{d.entries > 0 ? d.entries : ""}</div><div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div></div>))}
            </div>
          </Card>

          {/* 7-Day Summary */}
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>7-Day Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ label: "Workouts", val: gymWeek.filter(d => d.entries > 0).length + "/7" }, { label: "Total Sets", val: gymWeek.reduce((s, d) => s + d.totalSets, 0) }, { label: "Total Volume", val: (gymWeek.reduce((s, d) => s + d.totalVolume, 0) / 1000).toFixed(1) + "k lb" }, { label: "Muscle Groups", val: [...new Set(gymWeek.flatMap(d => d.groups))].length }].map(s => (<div key={s.label}><div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{s.val}</div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>{s.label}</div></div>))}
            </div>
          </Card>

          {/* PRs */}
          {uniqueExercises.filter(n => getPR(n) > 0).length > 0 && (
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Personal Records</div>
              {uniqueExercises.filter(n => getPR(n) > 0).map(name => {
                const progress = getProgress(name);
                return (<div key={name} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span><span style={{ fontWeight: 800, fontSize: 14, color: "var(--accent)" }}>{getPR(name)} lb</span></div>
                  {progress.length > 1 && <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 20 }}>{progress.map((p, i) => { const mW = Math.max(...progress.map(x => x.maxWeight)); const h = mW > 0 ? (p.maxWeight / mW) * 100 : 0; return <div key={i} style={{ flex: 1, height: `${h}%`, minHeight: 3, borderRadius: 2, background: i === progress.length - 1 ? "var(--accent)" : "#e8dcc8" }} />; })}</div>}
                </div>);
              })}
            </Card>
          )}

          {/* Progressive Overload */}
          {overloadSuggestions.length > 0 && (
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Progressive Overload</div>
              {overloadSuggestions.map((s, i) => (
                <div key={s.exercise} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < overloadSuggestions.length - 1 ? 10 : 0 }}>
                  {s.up ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="11" fill="#e6f4e6" /><path d="M11 6 L15 12 L13 12 L13 16 L9 16 L9 12 L7 12 Z" fill="#4a9a4a" /></svg>
                    : <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="11" fill="#f0ece4" /><path d="M7 11 L15 11" stroke="#b0a090" strokeWidth="2" strokeLinecap="round" /></svg>}
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{s.exercise}{s.up && <span style={{ fontWeight: 800, fontSize: 12, color: "#4a9a4a", marginLeft: 6 }}>{s.current}lb → {s.suggested}lb</span>}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{s.reason}</div></div>
                </div>
              ))}
            </Card>
          )}

          {/* Muscle Distribution */}
          {totalGroupSets > 0 && (
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Muscle Distribution</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center" }}>
                <svg viewBox="0 0 100 100" width="120" height="120">
                  {(() => { const r = 40; const circ = 2 * Math.PI * r; let offset = 0; return MUSCLE_GROUPS.filter(g => groupDistribution[g] > 0).map(g => { const pct = groupDistribution[g] / totalGroupSets; const dash = pct * circ; const el = <circle key={g} cx="50" cy="50" r={r} fill="none" stroke={GROUP_COLORS[g]} strokeWidth="14" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 0.4s ease" }} />; offset += dash; return el; }); })()}
                  <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text)">{totalGroupSets}</text>
                  <text x="50" y="60" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--muted)">sets</text>
                </svg>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {MUSCLE_GROUPS.filter(g => groupDistribution[g] > 0).map(g => (<div key={g} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: GROUP_COLORS[g], flexShrink: 0 }} /><span style={{ fontWeight: 700 }}>{g}</span><span style={{ color: "var(--muted)", fontWeight: 600 }}>{groupDistribution[g]}</span></div>))}
                </div>
              </div>
            </Card>
          )}

          {/* Exercise Trend */}
          {uniqueExercises.length > 0 && (
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Exercise Trend</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                {uniqueExercises.slice(0, 12).map(name => (<button key={name} className={`filter-chip ${activeTrend === name ? "active" : ""}`} onClick={() => setTrendExercise(name)} style={{ fontSize: 10, padding: "4px 10px" }}>{name}</button>))}
              </div>
              {trendData.length > 1 ? (() => {
                const minW = Math.min(...trendData); const maxW = Math.max(...trendData); const range = maxW - minW || 1;
                const padTop = 20; const padBot = 20; const chartH = 140 - padTop - padBot; const stepX = 300 / Math.max(trendData.length - 1, 1);
                const points = trendData.map((v, i) => `${i * stepX},${padTop + chartH - ((v - minW) / range) * chartH}`);
                const reg = linearRegression(trendData);
                const regY0 = reg ? padTop + chartH - ((reg.b - minW) / range) * chartH : 0;
                const regY1 = reg ? padTop + chartH - ((reg.m * (trendData.length - 1) + reg.b - minW) / range) * chartH : 0;
                return (<svg viewBox="0 0 300 140" width="100%" style={{ overflow: "visible" }}>
                  {[0, 0.25, 0.5, 0.75, 1].map(pct => { const y = padTop + chartH - pct * chartH; return <line key={pct} x1="0" y1={y} x2="300" y2={y} stroke="#e8dcc8" strokeWidth="0.5" />; })}
                  {reg && <line x1="0" y1={regY0} x2={(trendData.length - 1) * stepX} y2={regY1} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />}
                  <polyline points={points.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  {trendData.map((v, i) => { const x = i * stepX; const y = padTop + chartH - ((v - minW) / range) * chartH; return <g key={i}><circle cx={x} cy={y} r="4" fill="var(--accent)" stroke="white" strokeWidth="1.5" /><text x={x} y={y - 8} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--muted)">{v}</text></g>; })}
                  <text x="0" y={padTop + chartH + 14} fontSize="7" fill="var(--muted)" fontWeight="600">Oldest</text>
                  <text x="300" y={padTop + chartH + 14} fontSize="7" fill="var(--muted)" fontWeight="600" textAnchor="end">Latest</text>
                </svg>);
              })() : <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 16 }}>{trendData.length === 1 ? "Need 2+ sessions to show trend" : "No data yet"}</div>}
            </Card>
          )}

          {/* Body Weight */}
          {latestBW && (
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Body Weight</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                <div><div style={{ fontSize: 20, fontWeight: 800 }}>{latestBW}<span style={{ fontSize: 10, color: "var(--muted)" }}> lb</span></div><div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>Current</div></div>
                {bwAvg7 && <div><div style={{ fontSize: 20, fontWeight: 800 }}>{bwAvg7}<span style={{ fontSize: 10, color: "var(--muted)" }}> lb</span></div><div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>7-Day Avg</div></div>}
                {bwChange && <div><div style={{ fontSize: 20, fontWeight: 800, color: Number(bwChange) <= 0 ? "#6b8e6b" : "#d48a7b" }}>{Number(bwChange) > 0 ? "+" : ""}{bwChange}<span style={{ fontSize: 10, color: "var(--muted)" }}> lb</span></div><div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>All-Time</div></div>}
              </div>
            </Card>
          )}

          {uniqueExercises.length === 0 && (
            <Card style={{ padding: 20, textAlign: "center" }}><div style={{ fontSize: 13, color: "var(--muted)" }}>Log some exercises to see your stats here.</div></Card>
          )}
        </>
      )}
    </div>
  );
}
