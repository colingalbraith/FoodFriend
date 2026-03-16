import { useState } from "react";
import { makeId } from "../../utils/itemHelpers";
import Card from "../ui/Card";
import Modal from "../ui/Modal";

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio", "Full Body"];

const COMMON_EXERCISES = {
  Chest: ["Bench Press", "Incline Press", "Dumbbell Flyes", "Push-ups", "Cable Crossover"],
  Back: ["Deadlift", "Pull-ups", "Barbell Row", "Lat Pulldown", "Cable Row"],
  Shoulders: ["Overhead Press", "Lateral Raise", "Face Pull", "Arnold Press", "Front Raise"],
  Arms: ["Bicep Curl", "Tricep Pushdown", "Hammer Curl", "Skull Crusher", "Preacher Curl"],
  Legs: ["Squat", "Leg Press", "Romanian Deadlift", "Leg Curl", "Calf Raise", "Lunges"],
  Core: ["Plank", "Crunches", "Leg Raise", "Russian Twist", "Ab Wheel"],
  Cardio: ["Running", "Cycling", "Rowing", "Jump Rope", "Stair Climber"],
  "Full Body": ["Clean & Press", "Burpees", "Thrusters", "Kettlebell Swing"],
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function GymTab({ gymLog, saveGymLog }) {
  const [section, setSection] = useState("log"); // "log" | "stats"
  const [adding, setAdding] = useState(false);
  const [exName, setExName] = useState("");
  const [exGroup, setExGroup] = useState("Chest");
  const [sets, setSets] = useState([{ weight: "", reps: "" }]);
  const [exNotes, setExNotes] = useState("");
  const [editingId, setEditingId] = useState(null);

  const today = todayKey();
  const todayWorkouts = (gymLog || []).filter(e => e.date === today);

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const weekData = last7.map(date => {
    const entries = (gymLog || []).filter(e => e.date === date);
    const totalSets = entries.reduce((s, e) => s + (e.sets?.length || 0), 0);
    const totalVolume = entries.reduce((s, e) => s + (e.sets || []).reduce((v, set) => v + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0);
    return {
      date, entries: entries.length, totalSets, totalVolume,
      label: date === today ? "Today" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date + "T12:00:00").getDay()],
      groups: [...new Set(entries.map(e => e.group))],
    };
  });

  // All-time PRs for each exercise
  function getPR(exerciseName) {
    const entries = (gymLog || []).filter(e => e.name.toLowerCase() === exerciseName.toLowerCase());
    let maxWeight = 0;
    entries.forEach(e => (e.sets || []).forEach(s => { if (Number(s.weight) > maxWeight) maxWeight = Number(s.weight); }));
    return maxWeight;
  }

  // Progress for an exercise (last 5 sessions)
  function getProgress(exerciseName) {
    const entries = (gymLog || []).filter(e => e.name.toLowerCase() === exerciseName.toLowerCase()).slice(0, 5).reverse();
    return entries.map(e => ({
      date: e.date,
      maxWeight: Math.max(...(e.sets || []).map(s => Number(s.weight) || 0)),
      totalVolume: (e.sets || []).reduce((v, s) => v + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0),
    }));
  }

  function addSet() { setSets([...sets, { weight: "", reps: "" }]); }
  function updateSet(i, field, val) { setSets(sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s)); }
  function removeSet(i) { if (sets.length > 1) setSets(sets.filter((_, idx) => idx !== i)); }

  function openAdd() {
    setExName(""); setExGroup("Chest"); setSets([{ weight: "", reps: "" }]); setExNotes("");
    setEditingId(null); setAdding(true);
  }

  function openEdit(entry) {
    setExName(entry.name); setExGroup(entry.group); setSets(entry.sets || [{ weight: "", reps: "" }]);
    setExNotes(entry.notes || ""); setEditingId(entry.id); setAdding(true);
  }

  function saveExercise() {
    if (!exName.trim()) return;
    const entry = {
      id: editingId || makeId(), date: today, name: exName.trim(), group: exGroup,
      sets: sets.filter(s => s.weight || s.reps), notes: exNotes.trim(),
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    if (editingId) {
      saveGymLog((gymLog || []).map(e => e.id === editingId ? entry : e));
    } else {
      saveGymLog([entry, ...(gymLog || [])]);
    }
    setAdding(false);
  }

  function deleteExercise(id) { saveGymLog((gymLog || []).filter(e => e.id !== id)); }

  const maxVol = Math.max(1, ...weekData.map(d => d.totalVolume));
  const uniqueExercises = [...new Set((gymLog || []).map(e => e.name))];

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ id: "log", label: "Log" }, { id: "stats", label: "Stats" }].map(s => (
          <button key={s.id} className={`filter-chip ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>{s.label}</button>
        ))}
      </div>

      {/* ─── LOG SECTION ─── */}
      {section === "log" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>Today's Workout</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{todayWorkouts.length} exercises</div>
          </div>

          <button className="cozy-btn primary full" onClick={openAdd} style={{ marginBottom: 14 }}>Log Exercise</button>

          {todayWorkouts.length === 0 ? (
            <Card style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>No exercises logged today. Hit the gym!</div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todayWorkouts.map((entry, i) => {
                const pr = getPR(entry.name);
                const entryMax = Math.max(...(entry.sets || []).map(s => Number(s.weight) || 0));
                const isPR = entryMax > 0 && entryMax >= pr;
                return (
                  <Card key={entry.id} style={{ padding: 0, overflow: "hidden", animation: `fadeIn 0.2s ease-out ${i * 30}ms both` }}>
                    <div onClick={() => openEdit(entry)} style={{ padding: "14px 16px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                            {entry.name}
                            {isPR && <span style={{ fontSize: 10, fontWeight: 800, color: "#d48a7b", marginLeft: 6 }}>PR!</span>}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{entry.group} · {entry.time}</div>
                        </div>
                      </div>
                      {entry.sets && entry.sets.length > 0 && (
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {entry.sets.map((s, j) => (
                            <div key={j} style={{ background: "#f5f0e8", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                              {s.weight && <span>{s.weight}lb</span>}
                              {s.weight && s.reps && <span> × </span>}
                              {s.reps && <span>{s.reps}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.notes && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{entry.notes}</div>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── STATS SECTION ─── */}
      {section === "stats" && (
        <>
          <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Gym Stats</div>

          {/* Weekly volume chart */}
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>Weekly Volume (lbs)</div>
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

          {/* Weekly activity */}
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Activity</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {weekData.map(d => (
                <div key={d.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: d.entries > 0 ? "linear-gradient(135deg, #6b8e6b, #5a7a5a)" : "#e8dcc8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: d.entries > 0 ? "white" : "var(--muted)",
                  }}>
                    {d.entries > 0 ? d.entries : ""}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: d.date === today ? "var(--accent)" : "var(--muted)" }}>{d.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* PRs */}
          {uniqueExercises.length > 0 && (
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Personal Records</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {uniqueExercises.filter(n => getPR(n) > 0).map(name => {
                  const progress = getProgress(name);
                  const pr = getPR(name);
                  return (
                    <div key={name}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--accent)" }}>{pr} lb</span>
                      </div>
                      {progress.length > 1 && (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 24 }}>
                          {progress.map((p, i) => {
                            const maxW = Math.max(...progress.map(x => x.maxWeight));
                            const h = maxW > 0 ? (p.maxWeight / maxW) * 100 : 0;
                            return (
                              <div key={i} style={{ flex: 1, height: `${h}%`, minHeight: 3, borderRadius: 2, background: i === progress.length - 1 ? "var(--accent)" : "#e8dcc8", transition: "height 0.3s ease" }} />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Summary */}
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

      {/* ─── LOG EXERCISE MODAL ─── */}
      <Modal open={adding} onClose={() => setAdding(false)} title={editingId ? "Edit Exercise" : "Log Exercise"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Muscle group picker */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Muscle Group</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {MUSCLE_GROUPS.map(g => (
                <button key={g} className={`filter-chip ${exGroup === g ? "active" : ""}`} onClick={() => setExGroup(g)} style={{ fontSize: 11, padding: "5px 10px" }}>{g}</button>
              ))}
            </div>
          </div>

          {/* Exercise name + quick picks */}
          <div>
            <input className="cozy-input" placeholder="Exercise name" value={exName} onChange={e => setExName(e.target.value)} />
            {!exName && COMMON_EXERCISES[exGroup] && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                {COMMON_EXERCISES[exGroup].map(ex => (
                  <button key={ex} className="quick-chip" onClick={() => setExName(ex)} style={{ fontSize: 11, padding: "5px 10px" }}>{ex}</button>
                ))}
              </div>
            )}
          </div>

          {/* Sets */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Sets</label>
            {sets.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", width: 20 }}>{i + 1}</span>
                <input className="cozy-input" placeholder="Weight" value={s.weight} onChange={e => updateSet(i, "weight", e.target.value)} inputMode="numeric" style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "var(--muted)" }}>lb ×</span>
                <input className="cozy-input" placeholder="Reps" value={s.reps} onChange={e => updateSet(i, "reps", e.target.value)} inputMode="numeric" style={{ flex: 1 }} />
                {sets.length > 1 && (
                  <button onClick={() => removeSet(i)} style={{ background: "none", border: "none", color: "#c0392b", fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
                )}
              </div>
            ))}
            <button className="cozy-btn secondary" onClick={addSet} style={{ fontSize: 12, padding: "6px 14px" }}>+ Add Set</button>
          </div>

          <input className="cozy-input" placeholder="Notes (optional)" value={exNotes} onChange={e => setExNotes(e.target.value)} />

          <div style={{ display: "flex", gap: 8 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveExercise} disabled={!exName.trim()}>
              {editingId ? "Update" : "Log"}
            </button>
            {editingId && <button className="cozy-btn danger" onClick={() => { deleteExercise(editingId); setAdding(false); }}>Delete</button>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
