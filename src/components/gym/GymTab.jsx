import { useState, useRef, useMemo } from "react";
import { makeId } from "../../utils/itemHelpers";
import Card from "../ui/Card";
import Modal from "../ui/Modal";

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];

const EXERCISES = {
  Chest: [
    "Bench Press", "Incline Bench Press", "Decline Bench Press", "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Dumbbell Press",
    "Dumbbell Flyes", "Incline Dumbbell Flyes", "Cable Flyes", "Cable Crossover", "Low Cable Crossover",
    "Push-ups", "Diamond Push-ups", "Wide Push-ups", "Decline Push-ups", "Weighted Push-ups",
    "Machine Chest Press", "Seated Chest Press", "Pec Deck", "Dips (Chest)", "Landmine Press",
    "Floor Press", "Svend Press", "Plate Squeeze Press", "Smith Machine Bench",
  ],
  Back: [
    "Deadlift", "Conventional Deadlift", "Sumo Deadlift", "Trap Bar Deadlift", "Rack Pull",
    "Pull-ups", "Chin-ups", "Wide Grip Pull-ups", "Weighted Pull-ups", "Neutral Grip Pull-ups",
    "Barbell Row", "Pendlay Row", "Dumbbell Row", "Kroc Row", "Meadows Row",
    "T-Bar Row", "Chest-Supported Row", "Seated Cable Row", "Cable Row", "Single Arm Cable Row",
    "Lat Pulldown", "Wide Grip Pulldown", "Close Grip Pulldown", "Reverse Grip Pulldown",
    "Straight-Arm Pulldown", "Pullover", "Inverted Row", "Hyperextension", "Good Morning",
  ],
  Shoulders: [
    "Overhead Press", "Barbell Overhead Press", "Seated Overhead Press", "Dumbbell Shoulder Press", "Seated Dumbbell Press",
    "Arnold Press", "Push Press", "Military Press", "Behind-the-Neck Press", "Z Press",
    "Lateral Raise", "Cable Lateral Raise", "Dumbbell Lateral Raise", "Machine Lateral Raise",
    "Front Raise", "Dumbbell Front Raise", "Plate Front Raise", "Cable Front Raise",
    "Rear Delt Fly", "Reverse Pec Deck", "Face Pull", "Band Pull-Apart",
    "Upright Row", "Cable Upright Row", "Shrugs", "Barbell Shrugs", "Dumbbell Shrugs", "Trap Bar Shrugs",
    "Lu Raise", "Bradford Press", "Landmine Lateral Raise",
  ],
  Arms: [
    "Barbell Curl", "EZ Bar Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl",
    "Incline Dumbbell Curl", "Concentration Curl", "Cable Curl", "Spider Curl", "Reverse Curl",
    "Bayesian Curl", "Drag Curl", "21s", "Cross Body Curl", "Zottman Curl",
    "Tricep Pushdown", "Rope Pushdown", "Skull Crusher", "Overhead Tricep Extension", "Dumbbell Overhead Extension",
    "Cable Overhead Extension", "Tricep Dip", "Bench Dip", "Close-Grip Bench Press", "JM Press",
    "Kickback", "Cable Kickback", "Diamond Push-ups", "Tate Press",
    "Wrist Curl", "Reverse Wrist Curl", "Farmer's Walk",
  ],
  Legs: [
    "Back Squat", "Front Squat", "Goblet Squat", "Hack Squat", "Zercher Squat",
    "Smith Machine Squat", "Box Squat", "Pause Squat", "Safety Bar Squat",
    "Leg Press", "Single Leg Press", "Narrow Stance Leg Press",
    "Romanian Deadlift", "Stiff Leg Deadlift", "Single Leg RDL",
    "Bulgarian Split Squat", "Walking Lunges", "Reverse Lunges", "Lateral Lunges", "Step-ups",
    "Leg Extension", "Leg Curl", "Seated Leg Curl", "Nordic Curl",
    "Hip Thrust", "Barbell Hip Thrust", "Single Leg Hip Thrust", "Glute Bridge", "Cable Pull-Through",
    "Sumo Deadlift", "Sumo Squat",
    "Standing Calf Raise", "Seated Calf Raise", "Donkey Calf Raise", "Single Leg Calf Raise",
    "Sissy Squat", "Leg Press Calf Raise", "Wall Sit",
  ],
  Core: [
    "Plank", "Side Plank", "Plank Shoulder Tap", "RKC Plank",
    "Crunches", "Bicycle Crunch", "Reverse Crunch", "Decline Crunch",
    "Leg Raise", "Hanging Leg Raise", "Lying Leg Raise", "Knee Raise",
    "Russian Twist", "Weighted Russian Twist",
    "Cable Crunch", "Cable Woodchop", "Pallof Press",
    "Ab Rollout", "Ab Wheel", "Barbell Rollout",
    "Dead Bug", "Bird Dog", "Bear Crawl",
    "Mountain Climbers", "Flutter Kicks", "Scissor Kicks", "V-ups", "Toe Touches",
    "Dragon Flag", "L-Sit", "Hollow Body Hold", "Farmer's Walk", "Suitcase Carry",
  ],
  Cardio: [
    "Running", "Jogging", "Sprints", "Hill Sprints", "Interval Running",
    "Cycling", "Stationary Bike", "Spin Class", "Assault Bike",
    "Rowing", "Rowing Machine", "Stair Climber", "StairMaster",
    "Elliptical", "Arc Trainer",
    "Jump Rope", "Double Unders",
    "Swimming", "Laps", "Treading Water",
    "Walking", "Incline Walking", "Rucking",
    "Battle Ropes", "Box Jumps", "Burpees", "Jumping Jacks",
    "Sled Push", "Sled Pull", "Tire Flip", "Kettlebell Swing",
    "HIIT Circuit", "Tabata",
  ],
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
  const fill = (g) => isActive(g) ? "var(--accent)" : "#c8b8a0";
  const glow = (g) => isActive(g) ? "drop-shadow(0 0 8px rgba(196,149,106,0.5))" : "none";

  return (
    <div style={{ position: "relative", width: 220, height: 340, margin: "0 auto" }}>
      <svg viewBox="0 0 220 340" width="220" height="340">
        {/* Shadow */}
        <ellipse cx="110" cy="332" rx="50" ry="6" fill="#d4c0a8" opacity="0.15" />

        {/* Head */}
        <ellipse cx="110" cy="30" rx="20" ry="24" fill="#c8b8a0" opacity="0.55" />
        <ellipse cx="89" cy="30" rx="4" ry="6" fill="#c8b8a0" opacity="0.4" />
        <ellipse cx="131" cy="30" rx="4" ry="6" fill="#c8b8a0" opacity="0.4" />

        {/* Neck */}
        <path d="M98 52 Q98 58 96 64 L124 64 Q122 58 122 52" fill="#c8b8a0" opacity="0.45" />

        {/* Trapezius */}
        <path d="M96 62 Q74 66 42 76 L42 84 Q70 74 100 72 L120 72 Q150 74 178 84 L178 76 Q146 66 124 62 Z"
          fill={fill("Shoulders")} opacity={isActive("Shoulders") ? 0.75 : 0.45}
          onClick={() => onToggle("Shoulders")} style={{ cursor: "pointer", filter: glow("Shoulders") }} />

        {/* Shoulders — big round delts */}
        <ellipse cx="40" cy="84" rx="20" ry="18" fill={fill("Shoulders")} opacity={isActive("Shoulders") ? 0.85 : 0.45}
          onClick={() => onToggle("Shoulders")} style={{ cursor: "pointer", filter: glow("Shoulders") }} />
        <ellipse cx="180" cy="84" rx="20" ry="18" fill={fill("Shoulders")} opacity={isActive("Shoulders") ? 0.85 : 0.45}
          onClick={() => onToggle("Shoulders")} style={{ cursor: "pointer", filter: glow("Shoulders") }} />

        {/* Chest — wide thick pecs */}
        <path d="M60 74 Q80 68 110 70 Q140 68 160 74 Q164 92 156 104 Q138 112 110 110 Q82 112 64 104 Q56 92 60 74 Z"
          fill={fill("Chest")} opacity={isActive("Chest") ? 0.85 : 0.45}
          onClick={() => onToggle("Chest")} style={{ cursor: "pointer", filter: glow("Chest") }} />
        <line x1="110" y1="76" x2="110" y2="108" stroke={isActive("Chest") ? "#b08060" : "#ccc0b0"} strokeWidth="1" opacity="0.25" />

        {/* Core — thick torso */}
        <path d="M68 108 Q66 120 68 140 Q70 158 76 170 L96 170 Q100 166 110 166 Q120 166 124 170 L144 170 Q150 158 152 140 Q154 120 152 108 Q140 114 110 112 Q80 114 68 108 Z"
          fill={fill("Core")} opacity={isActive("Core") ? 0.8 : 0.45}
          onClick={() => onToggle("Core")} style={{ cursor: "pointer", filter: glow("Core") }} />
        <line x1="110" y1="112" x2="110" y2="166" stroke={isActive("Core") ? "#b08060" : "#b0a090"} strokeWidth="0.8" opacity="0.35" />
        {[124, 138, 152].map(y => (
          <line key={y} x1="84" y1={y} x2="136" y2={y} stroke={isActive("Core") ? "#b08060" : "#b0a090"} strokeWidth="0.6" opacity="0.3" />
        ))}

        {/* Back overlay */}
        {isActive("Back") && (
          <path d="M64 76 Q86 70 110 72 Q134 70 156 76 Q158 94 152 106 Q136 114 110 112 Q84 114 68 106 Q62 94 64 76 Z"
            fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.45" />
        )}

        {/* Upper arms — thick */}
        <path d="M36 96 Q18 102 14 114 Q10 136 14 156 Q22 164 32 158 Q44 150 48 134 Q50 114 46 96 Z"
          fill={fill("Arms")} opacity={isActive("Arms") ? 0.8 : 0.45}
          onClick={() => onToggle("Arms")} style={{ cursor: "pointer", filter: glow("Arms") }} />
        <path d="M184 96 Q202 102 206 114 Q210 136 206 156 Q198 164 188 158 Q176 150 172 134 Q170 114 174 96 Z"
          fill={fill("Arms")} opacity={isActive("Arms") ? 0.8 : 0.45}
          onClick={() => onToggle("Arms")} style={{ cursor: "pointer", filter: glow("Arms") }} />

        {/* Forearms */}
        <path d="M14 158 Q6 164 4 176 Q2 194 6 210 Q14 216 22 210 Q30 200 32 184 Q34 168 28 158 Z"
          fill={fill("Arms")} opacity={isActive("Arms") ? 0.65 : 0.35}
          onClick={() => onToggle("Arms")} style={{ cursor: "pointer" }} />
        <path d="M206 158 Q214 164 216 176 Q218 194 214 210 Q206 216 198 210 Q190 200 188 184 Q186 168 192 158 Z"
          fill={fill("Arms")} opacity={isActive("Arms") ? 0.65 : 0.35}
          onClick={() => onToggle("Arms")} style={{ cursor: "pointer" }} />

        {/* Hands */}
        <ellipse cx="8" cy="218" rx="8" ry="10" fill="#c8b8a0" opacity="0.35" />
        <ellipse cx="212" cy="218" rx="8" ry="10" fill="#c8b8a0" opacity="0.35" />

        {/* Upper legs — massive quads */}
        <path d="M76 172 Q64 182 54 208 Q46 236 46 254 Q52 264 66 258 Q82 250 88 228 Q94 200 94 178 Z"
          fill={fill("Legs")} opacity={isActive("Legs") ? 0.8 : 0.45}
          onClick={() => onToggle("Legs")} style={{ cursor: "pointer", filter: glow("Legs") }} />
        <path d="M144 172 Q156 182 166 208 Q174 236 174 254 Q168 264 154 258 Q138 250 132 228 Q126 200 126 178 Z"
          fill={fill("Legs")} opacity={isActive("Legs") ? 0.8 : 0.45}
          onClick={() => onToggle("Legs")} style={{ cursor: "pointer", filter: glow("Legs") }} />

        {/* Knees */}
        <ellipse cx="56" cy="260" rx="12" ry="9" fill={fill("Legs")} opacity={isActive("Legs") ? 0.5 : 0.35}
          onClick={() => onToggle("Legs")} style={{ cursor: "pointer" }} />
        <ellipse cx="164" cy="260" rx="12" ry="9" fill={fill("Legs")} opacity={isActive("Legs") ? 0.5 : 0.35}
          onClick={() => onToggle("Legs")} style={{ cursor: "pointer" }} />

        {/* Calves — thick */}
        <path d="M50 268 Q40 280 38 298 Q40 314 48 322 Q56 326 64 322 Q72 312 72 294 Q72 278 66 268 Z"
          fill={fill("Legs")} opacity={isActive("Legs") ? 0.65 : 0.35}
          onClick={() => onToggle("Legs")} style={{ cursor: "pointer" }} />
        <path d="M170 268 Q180 280 182 298 Q180 314 172 322 Q164 326 156 322 Q148 312 148 294 Q148 278 154 268 Z"
          fill={fill("Legs")} opacity={isActive("Legs") ? 0.65 : 0.35}
          onClick={() => onToggle("Legs")} style={{ cursor: "pointer" }} />

        {/* Feet */}
        <ellipse cx="48" cy="328" rx="14" ry="6" fill="#c8b8a0" opacity="0.35" />
        <ellipse cx="172" cy="328" rx="14" ry="6" fill="#c8b8a0" opacity="0.35" />
      </svg>

      {/* Labels — rendered as SVG text for precise centering */}
      <svg viewBox="0 0 220 340" width="220" height="340" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
        {[
          { g: "Shoulders", x: 110, y: 80 },
          { g: "Chest", x: 110, y: 94 },
          { g: "Core", x: 110, y: 142 },
          { g: "Arms", x: 30, y: 128 },
          { g: "Arms", x: 190, y: 128, key: "arms-r" },
          { g: "Legs", x: 70, y: 216 },
          { g: "Legs", x: 150, y: 216, key: "legs-r" },
        ].map(l => isActive(l.g) && (
          <text key={l.key || l.g} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central"
            fontSize="8" fontWeight="800" fill="white"
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <tspan>{l.g.toUpperCase()}</tspan>
          </text>
        ))}
      </svg>
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
