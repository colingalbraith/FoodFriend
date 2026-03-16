import { useState, useRef } from "react";
import { makeId } from "../../utils/itemHelpers";
import Card from "../ui/Card";
import Modal from "../ui/Modal";

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];

const EXERCISES = {
  Chest: ["Bench Press", "Incline Press", "Dumbbell Flyes", "Push-ups", "Cable Crossover"],
  Back: ["Deadlift", "Pull-ups", "Barbell Row", "Lat Pulldown", "Cable Row"],
  Shoulders: ["Overhead Press", "Lateral Raise", "Face Pull", "Arnold Press"],
  Arms: ["Bicep Curl", "Tricep Pushdown", "Hammer Curl", "Skull Crusher"],
  Legs: ["Squat", "Leg Press", "Romanian Deadlift", "Leg Curl", "Lunges", "Calf Raise"],
  Core: ["Plank", "Crunches", "Leg Raise", "Russian Twist"],
  Cardio: ["Running", "Cycling", "Rowing", "Jump Rope"],
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ id: "log", label: "Log" }, { id: "stats", label: "Stats" }].map(s => (
          <button key={s.id} className={`filter-chip ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>{s.label}</button>
        ))}
      </div>

      {/* ─── LOG ─── */}
      {section === "log" && !sessionActive && (
        <>
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
                            <span key={j} style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{s.weight}×{s.reps}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── LIVE SESSION ─── */}
      {section === "log" && sessionActive && (
        <>
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
                    <div key={i} style={{ background: "#edf5ed", borderRadius: 8, padding: "5px 10px", fontSize: 13, fontWeight: 700, color: "#4a7a4a" }}>
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
                          {isPR && <span style={{ fontSize: 10, fontWeight: 800, color: "#d48a7b", marginLeft: 6 }}>PR</span>}
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                          {(entry.sets || []).map((s, j) => (
                            <span key={j} style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{s.weight}×{s.reps}</span>
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
        </>
      )}

      {/* ─── STATS ─── */}
      {section === "stats" && (
        <>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Gym Stats</div>

          <Card style={{ padding: 16, marginBottom: 14 }}>
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

          <Card style={{ padding: 16, marginBottom: 14 }}>
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

          {uniqueExercises.filter(n => getPR(n) > 0).length > 0 && (
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Personal Records</div>
              {uniqueExercises.filter(n => getPR(n) > 0).map(name => {
                const progress = getProgress(name);
                return (
                  <div key={name} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "var(--accent)" }}>{getPR(name)} lb</span>
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

          <Card style={{ padding: 16 }}>
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
        </>
      )}

      {/* ─── EXERCISE PICKER ─── */}
      <Modal open={picking} onClose={() => setPicking(false)} title="Pick Exercise">
        <div>
          {recentExercises.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Recent</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {recentExercises.map(name => {
                  const group = (gymLog || []).find(e => e.name === name)?.group || "";
                  return <button key={name} className="quick-chip" onClick={() => pickExercise(name, group)} style={{ fontSize: 12, padding: "7px 12px" }}>{name}</button>;
                })}
              </div>
            </div>
          )}
          <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
            {sessionExercises.map(([group, exList]) => (
              <div key={group} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>{group}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {exList.map(ex => <button key={ex} className="quick-chip" onClick={() => pickExercise(ex, group)} style={{ fontSize: 12, padding: "7px 12px" }}>{ex}</button>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
