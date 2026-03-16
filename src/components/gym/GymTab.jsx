import { useState, useRef, useMemo } from "react";
import { makeId } from "../../utils/itemHelpers";
import Card from "../ui/Card";
import Modal from "../ui/Modal";

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];

const EXERCISES = {
  Chest: ["Bench Press", "Incline Press", "Decline Press", "Dumbbell Bench", "Incline Dumbbell Press", "Dumbbell Flyes", "Cable Crossover", "Push-ups", "Machine Chest Press", "Pec Deck", "Dips (Chest)", "Landmine Press"],
  Back: ["Deadlift", "Pull-ups", "Barbell Row", "Lat Pulldown", "Cable Row", "Seated Row", "T-Bar Row", "Dumbbell Row", "Chest-Supported Row", "Pendlay Row", "Rack Pull", "Straight-Arm Pulldown"],
  Shoulders: ["Overhead Press", "Dumbbell Shoulder Press", "Lateral Raise", "Cable Lateral Raise", "Face Pull", "Arnold Press", "Front Raise", "Rear Delt Fly", "Upright Row", "Military Press", "Shrugs"],
  Arms: ["Bicep Curl", "Hammer Curl", "Preacher Curl", "EZ Bar Curl", "Cable Curl", "Concentration Curl", "Tricep Pushdown", "Skull Crusher", "Overhead Tricep Extension", "Tricep Dip", "Close-Grip Bench", "Reverse Curl"],
  Legs: ["Squat", "Front Squat", "Leg Press", "Hack Squat", "Romanian Deadlift", "Bulgarian Split Squat", "Lunges", "Leg Extension", "Leg Curl", "Hip Thrust", "Goblet Squat", "Calf Raise", "Sumo Deadlift"],
  Core: ["Plank", "Crunches", "Bicycle Crunch", "Leg Raise", "Hanging Leg Raise", "Russian Twist", "Cable Crunch", "Ab Rollout", "Dead Bug", "Mountain Climbers", "Woodchop", "Pallof Press"],
  Cardio: ["Running", "Cycling", "Rowing", "Jump Rope", "Stair Climber", "Elliptical", "Swimming", "Walking", "Sprints", "Battle Ropes"],
};

const GROUP_COLORS = { Chest: "#d48a7b", Back: "#8ab4d4", Shoulders: "#c4a86a", Arms: "#b89878", Legs: "#7cb87c", Core: "#d4a87b", Cardio: "#8ac4a8" };

/* Inject keyframes once */
if (typeof document !== "undefined" && !document.getElementById("gym-tab-anims")) {
  const style = document.createElement("style");
  style.id = "gym-tab-anims";
  style.textContent = `
    @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 50%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
    @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
    @keyframes fadeIn { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(style);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

function linearRegression(pts) {
  const n = pts.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += pts[i]; sxy += i * pts[i]; sxx += i * i; }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  return { m, b };
}

function BodyPicker({ selected, onToggle }) {
  const isActive = (g) => selected.includes(g);
  const fill = (g) => isActive(g) ? "var(--accent)" : "#e0d0b8";
  const opacity = (g) => isActive(g) ? 0.85 : 0.4;

  return (
    <div style={{ position: "relative", width: 180, height: 320, margin: "0 auto" }}>
      <svg viewBox="0 0 180 320" width="180" height="320">
        {/* Head */}
        <circle cx="90" cy="32" r="20" fill="#d4c0a8" opacity="0.5" />

        {/* Neck */}
        <rect x="82" y="52" width="16" height="14" rx="4" fill="#d4c0a8" opacity="0.4" />

        {/* Shoulders — tappable */}
        <ellipse cx="52" cy="78" rx="20" ry="12" fill={fill("Shoulders")} opacity={opacity("Shoulders")} onClick={() => onToggle("Shoulders")} style={{ cursor: "pointer" }} />
        <ellipse cx="128" cy="78" rx="20" ry="12" fill={fill("Shoulders")} opacity={opacity("Shoulders")} onClick={() => onToggle("Shoulders")} style={{ cursor: "pointer" }} />

        {/* Chest — tappable */}
        <rect x="58" y="72" width="64" height="40" rx="10" fill={fill("Chest")} opacity={opacity("Chest")} onClick={() => onToggle("Chest")} style={{ cursor: "pointer" }} />

        {/* Core — tappable */}
        <rect x="65" y="114" width="50" height="48" rx="8" fill={fill("Core")} opacity={opacity("Core")} onClick={() => onToggle("Core")} style={{ cursor: "pointer" }} />

        {/* Arms — tappable */}
        <rect x="28" y="82" width="22" height="60" rx="8" fill={fill("Arms")} opacity={opacity("Arms")} onClick={() => onToggle("Arms")} style={{ cursor: "pointer" }} />
        <rect x="130" y="82" width="22" height="60" rx="8" fill={fill("Arms")} opacity={opacity("Arms")} onClick={() => onToggle("Arms")} style={{ cursor: "pointer" }} />

        {/* Forearms */}
        <rect x="24" y="142" width="18" height="46" rx="6" fill={fill("Arms")} opacity={opacity("Arms") * 0.7} onClick={() => onToggle("Arms")} style={{ cursor: "pointer" }} />
        <rect x="138" y="142" width="18" height="46" rx="6" fill={fill("Arms")} opacity={opacity("Arms") * 0.7} onClick={() => onToggle("Arms")} style={{ cursor: "pointer" }} />

        {/* Back — invisible from front, shown as overlay on torso */}
        {isActive("Back") && (
          <rect x="62" y="76" width="56" height="36" rx="8" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
        )}

        {/* Legs — tappable */}
        <rect x="60" y="165" width="26" height="80" rx="8" fill={fill("Legs")} opacity={opacity("Legs")} onClick={() => onToggle("Legs")} style={{ cursor: "pointer" }} />
        <rect x="94" y="165" width="26" height="80" rx="8" fill={fill("Legs")} opacity={opacity("Legs")} onClick={() => onToggle("Legs")} style={{ cursor: "pointer" }} />

        {/* Lower legs */}
        <rect x="62" y="248" width="20" height="52" rx="6" fill={fill("Legs")} opacity={opacity("Legs") * 0.7} onClick={() => onToggle("Legs")} style={{ cursor: "pointer" }} />
        <rect x="98" y="248" width="20" height="52" rx="6" fill={fill("Legs")} opacity={opacity("Legs") * 0.7} onClick={() => onToggle("Legs")} style={{ cursor: "pointer" }} />
      </svg>

      {/* Labels */}
      {[
        { g: "Shoulders", x: 90, y: 78 },
        { g: "Chest", x: 90, y: 94 },
        { g: "Core", x: 90, y: 138 },
        { g: "Arms", x: 22, y: 108 },
        { g: "Legs", x: 90, y: 205 },
      ].map(l => isActive(l.g) && (
        <div key={l.g} style={{
          position: "absolute", left: l.x, top: l.y, transform: "translate(-50%, -50%)",
          fontSize: 9, fontWeight: 800, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          pointerEvents: "none", textTransform: "uppercase", letterSpacing: 0.5,
        }}>{l.g}</div>
      ))}
    </div>
  );
}

export default function GymTab({ gymLog, saveGymLog }) {
  const [section, setSection] = useState("log");
  const [sessionGroups, setSessionGroups] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [picking, setPicking] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sessionStart, setSessionStart] = useState(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [trendExercise, setTrendExercise] = useState(null);
  const weightRef = useRef(null);

  const today = todayKey();
  const todayWorkouts = (gymLog || []).filter(e => e.date === today);
  const recentExercises = [...new Set((gymLog || []).map(e => e.name))].slice(0, 8);

  // Check if there's already a session today
  const hasSession = todayWorkouts.length > 0;

  function toggleGroup(g) {
    setSessionGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  function startSession() {
    setSessionActive(true);
    setSessionStart(Date.now());
    setPicking(true);
  }

  function resumeSession() {
    setSessionActive(true);
    setSessionStart(Date.now());
  }

  function endSession() {
    setSessionActive(false);
    setActiveEntry(null);
    setSessionGroups([]);
  }

  function lastWeight(name) {
    const prev = (gymLog || []).find(e => e.name === name && e.sets?.length > 0);
    return prev ? prev.sets[prev.sets.length - 1].weight : "";
  }

  function lastReps(name) {
    const prev = (gymLog || []).find(e => e.name === name && e.sets?.length > 0);
    return prev ? prev.sets[prev.sets.length - 1].reps : "";
  }

  function pickExercise(name, group) {
    const existing = todayWorkouts.find(e => e.name === name);
    if (existing) {
      setActiveEntry(existing);
    } else {
      const entry = { id: makeId(), date: today, name, group, sets: [], time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) };
      saveGymLog([entry, ...(gymLog || [])]);
      setActiveEntry(entry);
    }
    setWeight(lastWeight(name)); setReps(lastReps(name));
    setPicking(false);
    setExerciseSearch("");
    setTimeout(() => weightRef.current?.focus(), 150);
  }

  function addSet() {
    if (!activeEntry || (!weight && !reps)) return;
    const updatedEntry = { ...activeEntry, sets: [...(activeEntry.sets || []), { weight: weight || "0", reps: reps || "0" }] };
    saveGymLog((gymLog || []).map(e => e.id === activeEntry.id ? updatedEntry : e));
    setActiveEntry(updatedEntry);
    setReps("");
  }

  function removeLastSet() {
    if (!activeEntry || !activeEntry.sets?.length) return;
    const updatedEntry = { ...activeEntry, sets: activeEntry.sets.slice(0, -1) };
    saveGymLog((gymLog || []).map(e => e.id === activeEntry.id ? updatedEntry : e));
    setActiveEntry(updatedEntry);
  }

  function deleteExercise(id) {
    saveGymLog((gymLog || []).filter(e => e.id !== id));
    if (activeEntry?.id === id) setActiveEntry(null);
  }

  function getPR(name) {
    let max = 0;
    (gymLog || []).filter(e => e.name === name).forEach(e => (e.sets || []).forEach(s => { if (Number(s.weight) > max) max = Number(s.weight); }));
    return max;
  }

  function getProgress(name) {
    return (gymLog || []).filter(e => e.name === name && e.sets?.length > 0).slice(0, 5).reverse().map(e => ({
      maxWeight: Math.max(...e.sets.map(s => Number(s.weight) || 0)),
    }));
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const weekData = last7.map(date => {
    const entries = (gymLog || []).filter(e => e.date === date);
    return {
      date, entries: entries.length,
      totalSets: entries.reduce((s, e) => s + (e.sets?.length || 0), 0),
      totalVolume: entries.reduce((s, e) => s + (e.sets || []).reduce((v, set) => v + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0),
      label: date === today ? "Today" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date + "T12:00:00").getDay()],
      groups: [...new Set(entries.map(e => e.group))],
    };
  });

  const maxVol = Math.max(1, ...weekData.map(d => d.totalVolume));
  const uniqueExercises = [...new Set((gymLog || []).map(e => e.name))];

  // Filtered exercises for session
  const sessionExercises = sessionGroups.length > 0
    ? Object.entries(EXERCISES).filter(([g]) => sessionGroups.includes(g))
    : Object.entries(EXERCISES);

  // --- NEW: Progressive overload suggestions (exercises used in last 7 days) ---
  const overloadSuggestions = useMemo(() => {
    const last7Names = [...new Set((gymLog || []).filter(e => last7.includes(e.date) && e.sets?.length > 0).map(e => e.name))];
    return last7Names.map(n => getOverloadSuggestion(n, gymLog)).filter(Boolean);
  }, [gymLog, last7]);

  // --- NEW: Muscle group distribution (last 7 days) ---
  const groupDistribution = useMemo(() => {
    const counts = {};
    MUSCLE_GROUPS.forEach(g => { counts[g] = 0; });
    (gymLog || []).filter(e => last7.includes(e.date)).forEach(e => {
      if (e.group && counts[e.group] !== undefined) counts[e.group] += (e.sets?.length || 0);
    });
    return counts;
  }, [gymLog, last7]);

  const totalGroupSets = Object.values(groupDistribution).reduce((a, b) => a + b, 0);

  // --- NEW: Exercise trend data ---
  const activeTrend = trendExercise || (uniqueExercises.length > 0 ? uniqueExercises[0] : null);

  const trendData = useMemo(() => {
    if (!activeTrend) return [];
    return (gymLog || [])
      .filter(e => e.name === activeTrend && e.sets?.length > 0)
      .slice(0, 10)
      .reverse()
      .map(e => Math.max(...e.sets.map(s => Number(s.weight) || 0)));
  }, [gymLog, activeTrend]);

  // --- Search-filtered exercises for picker ---
  const searchLower = exerciseSearch.toLowerCase().trim();
  const filteredSessionExercises = searchLower
    ? sessionExercises.map(([group, exList]) => [group, exList.filter(ex => ex.toLowerCase().includes(searchLower))]).filter(([, exList]) => exList.length > 0)
    : sessionExercises;

  const filteredRecent = searchLower
    ? recentExercises.filter(n => n.toLowerCase().includes(searchLower))
    : recentExercises;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ id: "log", label: "Log" }, { id: "stats", label: "Stats" }].map(s => (
          <button key={s.id} className={`filter-chip ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>{s.label}</button>
        ))}
      </div>

      {/* ─── LOG ─── */}
      {section === "log" && !sessionActive && (
        <div style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>
            {hasSession ? "Today's Workout" : "What are we hitting?"}
          </div>
          {!hasSession && (
            <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginBottom: 16 }}>
              Tap the muscle groups you're training
            </div>
          )}

          {!hasSession && (
            <>
              <BodyPicker selected={sessionGroups} onToggle={toggleGroup} />

              {/* Back + Cardio buttons (not on body) */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8, marginBottom: 16 }}>
                {["Back", "Cardio"].map(g => (
                  <button key={g} className={`filter-chip ${sessionGroups.includes(g) ? "active" : ""}`}
                    onClick={() => toggleGroup(g)} style={{ padding: "8px 16px" }}>
                    {g}
                  </button>
                ))}
              </div>

              <button className="cozy-btn primary full" onClick={startSession} disabled={sessionGroups.length === 0}
                style={{ marginBottom: 14 }}>
                Start Session {sessionGroups.length > 0 && `(${sessionGroups.join(", ")})`}
              </button>
            </>
          )}

          {hasSession && (
            <>
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginBottom: 14 }}>
                {todayWorkouts.length} exercises · {todayWorkouts.reduce((s, e) => s + (e.sets?.length || 0), 0)} sets
              </div>
              <button className="cozy-btn primary full" onClick={resumeSession} style={{ marginBottom: 14 }}>
                Continue Session
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {todayWorkouts.map((entry, i) => (
                  <Card key={entry.id} style={{ padding: 0, animation: `fadeIn 0.2s ease-out ${i * 30}ms both` }}>
                    <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{entry.name}</div>
                        <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                          {(entry.sets || []).map((s, j) => (
                            <span key={j} style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", animation: `popIn 0.15s ease-out ${j * 40}ms both` }}>{s.weight}×{s.reps}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── LIVE SESSION ─── */}
      {section === "log" && sessionActive && (
        <div style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>Live Session</div>
            <button className="cozy-btn danger" style={{ fontSize: 11, padding: "6px 14px", minHeight: 32 }} onClick={endSession}>
              End
            </button>
          </div>

          {/* Active exercise */}
          {activeEntry && (
            <Card style={{ padding: 14, marginBottom: 14, border: "2px solid var(--accent)" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{activeEntry.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{activeEntry.group}</div>

              {activeEntry.sets?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {activeEntry.sets.map((s, i) => (
                    <div key={i} style={{ background: "#edf5ed", borderRadius: 8, padding: "5px 10px", fontSize: 13, fontWeight: 700, color: "#4a7a4a", animation: `popIn 0.15s ease-out ${i * 40}ms both` }}>
                      {s.weight}lb × {s.reps}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input ref={weightRef} className="cozy-input" placeholder="lbs" value={weight} onChange={e => setWeight(e.target.value)} inputMode="numeric" style={{ flex: 1, textAlign: "center" }} />
                <span style={{ fontWeight: 700, color: "var(--muted)" }}>×</span>
                <input className="cozy-input" placeholder="reps" value={reps} onChange={e => setReps(e.target.value)} inputMode="numeric" style={{ flex: 1, textAlign: "center" }}
                  onKeyDown={e => { if (e.key === "Enter") addSet(); }} />
                <button className="cozy-btn primary" onClick={addSet} style={{ padding: "10px 16px" }} disabled={!weight && !reps}>+</button>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {activeEntry.sets?.length > 0 && (
                  <button className="cozy-btn secondary" style={{ fontSize: 11, padding: "6px 12px" }} onClick={removeLastSet}>Undo</button>
                )}
                <button className="cozy-btn primary" style={{ flex: 1, fontSize: 12 }} onClick={() => { setActiveEntry(null); setPicking(true); }}>Next Exercise</button>
              </div>
            </Card>
          )}

          {!activeEntry && (
            <button className="cozy-btn primary full" onClick={() => setPicking(true)} style={{ marginBottom: 14 }}>
              Add Exercise
            </button>
          )}

          {/* Today's logged exercises */}
          {todayWorkouts.filter(e => e.id !== activeEntry?.id).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todayWorkouts.filter(e => e.id !== activeEntry?.id).map((entry, i) => {
                const pr = getPR(entry.name);
                const entryMax = Math.max(0, ...(entry.sets || []).map(s => Number(s.weight) || 0));
                const isPR = entryMax > 0 && entryMax >= pr;
                return (
                  <Card key={entry.id} style={{ padding: 0, animation: `fadeIn 0.2s ease-out ${i * 30}ms both` }}>
                    <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { setActiveEntry(entry); setWeight(lastWeight(entry.name)); setReps(""); }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {entry.name}
                          {isPR && <span style={{ fontSize: 10, fontWeight: 800, color: "#d48a7b", marginLeft: 6, display: "inline-block", animation: "bounceIn 0.4s ease-out" }}>PR</span>}
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                          {(entry.sets || []).map((s, j) => (
                            <span key={j} style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", animation: `popIn 0.15s ease-out ${j * 40}ms both` }}>{s.weight}×{s.reps}</span>
                          ))}
                          {(!entry.sets || entry.sets.length === 0) && <span style={{ fontSize: 11, color: "#ccc" }}>No sets</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteExercise(entry.id)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── STATS ─── */}
      {section === "stats" && (
        <div style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Gym Stats</div>

          {/* Weekly Volume */}
          <Card style={{ padding: 16, marginBottom: 14, animation: `fadeIn 0.2s ease-out 0ms both` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Weekly Volume</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
              {weekData.map(d => {
                const h = maxVol > 0 ? (d.totalVolume / maxVol) * 100 : 0;
                return (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: "var(--muted)" }}>{d.totalVolume > 0 ? (d.totalVolume > 999 ? (d.totalVolume / 1000).toFixed(1) + "k" : d.totalVolume) : ""}</div>
                    <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", height: `${h}%`, minHeight: d.totalVolume > 0 ? 4 : 0, borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg, var(--accent), #a8784e)", transition: "height 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activity Heatmap */}
          <Card style={{ padding: 16, marginBottom: 14, animation: `fadeIn 0.2s ease-out 60ms both` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Activity</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {weekData.map(d => (
                <div key={d.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: d.entries > 0 ? "linear-gradient(135deg, #6b8e6b, #5a7a5a)" : "#e8dcc8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: d.entries > 0 ? "white" : "var(--muted)" }}>
                    {d.entries > 0 ? d.entries : ""}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Personal Records */}
          {uniqueExercises.filter(n => getPR(n) > 0).length > 0 && (
            <Card style={{ padding: 16, marginBottom: 14, animation: `fadeIn 0.2s ease-out 120ms both` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Personal Records</div>
              {uniqueExercises.filter(n => getPR(n) > 0).map(name => {
                const progress = getProgress(name);
                return (
                  <div key={name} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "var(--accent)", display: "inline-block", animation: "bounceIn 0.4s ease-out" }}>{getPR(name)} lb</span>
                    </div>
                    {progress.length > 1 && (
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 20 }}>
                        {progress.map((p, i) => {
                          const maxW = Math.max(...progress.map(x => x.maxWeight));
                          const h = maxW > 0 ? (p.maxWeight / maxW) * 100 : 0;
                          return <div key={i} style={{ flex: 1, height: `${h}%`, minHeight: 3, borderRadius: 2, background: i === progress.length - 1 ? "var(--accent)" : "#e8dcc8" }} />;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          )}

          {/* 7-Day Summary */}
          <Card style={{ padding: 16, marginBottom: 14, animation: `fadeIn 0.2s ease-out 180ms both` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>7-Day Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Workouts", val: weekData.filter(d => d.entries > 0).length + "/7" },
                { label: "Total Sets", val: weekData.reduce((s, d) => s + d.totalSets, 0) },
                { label: "Total Volume", val: (weekData.reduce((s, d) => s + d.totalVolume, 0) / 1000).toFixed(1) + "k lb" },
                { label: "Muscle Groups", val: [...new Set(weekData.flatMap(d => d.groups))].length },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* ─── NEW: Progressive Overload Suggestions ─── */}
          {overloadSuggestions.length > 0 && (
            <Card style={{ padding: 16, marginBottom: 14, animation: `fadeIn 0.2s ease-out 240ms both` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Progressive Overload</div>
              {overloadSuggestions.map((s, i) => (
                <div key={s.exercise} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < overloadSuggestions.length - 1 ? 10 : 0, animation: `fadeIn 0.2s ease-out ${i * 60}ms both` }}>
                  {s.up ? (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="11" fill="#e6f4e6" />
                      <path d="M11 6 L15 12 L13 12 L13 16 L9 16 L9 12 L7 12 Z" fill="#4a9a4a" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="11" fill="#f0ece4" />
                      <path d="M7 11 L15 11" stroke="#b0a090" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {s.exercise}
                      {s.up && <span style={{ fontWeight: 800, fontSize: 12, color: "#4a9a4a", marginLeft: 6 }}>{s.current}lb → {s.suggested}lb</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.reason}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ─── NEW: Muscle Group Distribution Donut ─── */}
          {totalGroupSets > 0 && (
            <Card style={{ padding: 16, marginBottom: 14, animation: `fadeIn 0.2s ease-out 300ms both` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Muscle Distribution</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center" }}>
                <svg viewBox="0 0 100 100" width="120" height="120">
                  {(() => {
                    const r = 40;
                    const circ = 2 * Math.PI * r;
                    let offset = 0;
                    return MUSCLE_GROUPS.filter(g => groupDistribution[g] > 0).map(g => {
                      const pct = groupDistribution[g] / totalGroupSets;
                      const dash = pct * circ;
                      const el = (
                        <circle
                          key={g}
                          cx="50" cy="50" r={r}
                          fill="none"
                          stroke={GROUP_COLORS[g]}
                          strokeWidth="14"
                          strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 50 50)"
                          style={{ transition: "stroke-dasharray 0.4s ease" }}
                        />
                      );
                      offset += dash;
                      return el;
                    });
                  })()}
                  <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text)">{totalGroupSets}</text>
                  <text x="50" y="60" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--muted)">sets</text>
                </svg>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {MUSCLE_GROUPS.filter(g => groupDistribution[g] > 0).map(g => (
                    <div key={g} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: GROUP_COLORS[g], flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>{g}</span>
                      <span style={{ color: "var(--muted)", fontWeight: 600 }}>{groupDistribution[g]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ─── NEW: Exercise Trend Chart ─── */}
          {uniqueExercises.length > 0 && (
            <Card style={{ padding: 16, marginBottom: 14, animation: `fadeIn 0.2s ease-out 360ms both` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Exercise Trend</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                {uniqueExercises.slice(0, 12).map(name => (
                  <button key={name} className={`filter-chip ${activeTrend === name ? "active" : ""}`}
                    onClick={() => setTrendExercise(name)}
                    style={{ fontSize: 10, padding: "4px 10px" }}>
                    {name}
                  </button>
                ))}
              </div>
              {trendData.length > 1 ? (() => {
                const minW = Math.min(...trendData);
                const maxW = Math.max(...trendData);
                const range = maxW - minW || 1;
                const padTop = 20;
                const padBot = 20;
                const chartH = 140 - padTop - padBot;
                const stepX = 300 / Math.max(trendData.length - 1, 1);
                const points = trendData.map((v, i) => `${i * stepX},${padTop + chartH - ((v - minW) / range) * chartH}`);
                const reg = linearRegression(trendData);
                const regY0 = reg ? padTop + chartH - ((reg.b - minW) / range) * chartH : 0;
                const regY1 = reg ? padTop + chartH - ((reg.m * (trendData.length - 1) + reg.b - minW) / range) * chartH : 0;
                return (
                  <svg viewBox="0 0 300 140" width="100%" style={{ overflow: "visible" }}>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                      const y = padTop + chartH - pct * chartH;
                      return <line key={pct} x1="0" y1={y} x2="300" y2={y} stroke="#e8dcc8" strokeWidth="0.5" />;
                    })}
                    {/* Trend line */}
                    {reg && (
                      <line x1="0" y1={regY0} x2={(trendData.length - 1) * stepX} y2={regY1} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
                    )}
                    {/* Data line */}
                    <polyline points={points.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {/* Data dots */}
                    {trendData.map((v, i) => {
                      const x = i * stepX;
                      const y = padTop + chartH - ((v - minW) / range) * chartH;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="4" fill="var(--accent)" stroke="white" strokeWidth="1.5" />
                          <text x={x} y={y - 8} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--muted)">{v}</text>
                        </g>
                      );
                    })}
                    {/* Axis labels */}
                    <text x="0" y={padTop + chartH + 14} fontSize="7" fill="var(--muted)" fontWeight="600">Oldest</text>
                    <text x="300" y={padTop + chartH + 14} fontSize="7" fill="var(--muted)" fontWeight="600" textAnchor="end">Latest</text>
                  </svg>
                );
              })() : (
                <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 16 }}>
                  {trendData.length === 1 ? "Need 2+ sessions to show trend" : "No data yet"}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ─── EXERCISE PICKER ─── */}
      <Modal open={picking} onClose={() => { setPicking(false); setExerciseSearch(""); }} title="Pick Exercise">
        <div>
          {/* Search input */}
          <input
            className="cozy-input"
            placeholder="Search exercises..."
            value={exerciseSearch}
            onChange={e => setExerciseSearch(e.target.value)}
            style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }}
            autoFocus
          />
          {filteredRecent.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Recent</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {filteredRecent.map(name => {
                  const group = (gymLog || []).find(e => e.name === name)?.group || "";
                  return <button key={name} className="quick-chip" onClick={() => pickExercise(name, group)} style={{ fontSize: 12, padding: "7px 12px" }}>{name}</button>;
                })}
              </div>
            </div>
          )}
          <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
            {filteredSessionExercises.map(([group, exList]) => (
              <div key={group} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>{group}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {exList.map(ex => <button key={ex} className="quick-chip" onClick={() => pickExercise(ex, group)} style={{ fontSize: 12, padding: "7px 12px" }}>{ex}</button>)}
                </div>
              </div>
            ))}
            {filteredSessionExercises.length === 0 && searchLower && (
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 16 }}>No exercises match "{exerciseSearch}"</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
