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

// ─── Preset workout programs ───────────────────────────────────────────
const PRESET_PROGRAMS = [
  {
    name: "Push / Pull / Legs",
    tag: "PPL",
    days: [
      {
        name: "Push Day",
        groups: ["Chest", "Shoulders", "Arms"],
        exercises: [
          { name: "Bench Press", group: "Chest" },
          { name: "Incline Dumbbell Press", group: "Chest" },
          { name: "Cable Flyes", group: "Chest" },
          { name: "Overhead Press", group: "Shoulders" },
          { name: "Lateral Raise", group: "Shoulders" },
          { name: "Tricep Pushdown", group: "Arms" },
          { name: "Overhead Tricep Extension", group: "Arms" },
        ],
      },
      {
        name: "Pull Day",
        groups: ["Back", "Arms"],
        exercises: [
          { name: "Deadlift", group: "Back" },
          { name: "Pull-ups", group: "Back" },
          { name: "Barbell Row", group: "Back" },
          { name: "Seated Cable Row", group: "Back" },
          { name: "Face Pull", group: "Shoulders" },
          { name: "Barbell Curl", group: "Arms" },
          { name: "Hammer Curl", group: "Arms" },
        ],
      },
      {
        name: "Leg Day",
        groups: ["Legs", "Core"],
        exercises: [
          { name: "Back Squat", group: "Legs" },
          { name: "Romanian Deadlift", group: "Legs" },
          { name: "Leg Press", group: "Legs" },
          { name: "Leg Extension", group: "Legs" },
          { name: "Leg Curl", group: "Legs" },
          { name: "Standing Calf Raise", group: "Legs" },
          { name: "Hanging Leg Raise", group: "Core" },
        ],
      },
    ],
  },
  {
    name: "Upper / Lower",
    tag: "U/L",
    days: [
      {
        name: "Upper A — Strength",
        groups: ["Chest", "Back", "Shoulders", "Arms"],
        exercises: [
          { name: "Bench Press", group: "Chest" },
          { name: "Barbell Row", group: "Back" },
          { name: "Overhead Press", group: "Shoulders" },
          { name: "Pull-ups", group: "Back" },
          { name: "Dumbbell Curl", group: "Arms" },
          { name: "Tricep Pushdown", group: "Arms" },
        ],
      },
      {
        name: "Lower A — Strength",
        groups: ["Legs", "Core"],
        exercises: [
          { name: "Back Squat", group: "Legs" },
          { name: "Romanian Deadlift", group: "Legs" },
          { name: "Leg Press", group: "Legs" },
          { name: "Leg Curl", group: "Legs" },
          { name: "Standing Calf Raise", group: "Legs" },
          { name: "Plank", group: "Core" },
        ],
      },
      {
        name: "Upper B — Volume",
        groups: ["Chest", "Back", "Shoulders", "Arms"],
        exercises: [
          { name: "Incline Dumbbell Press", group: "Chest" },
          { name: "Seated Cable Row", group: "Back" },
          { name: "Dumbbell Shoulder Press", group: "Shoulders" },
          { name: "Lat Pulldown", group: "Back" },
          { name: "Lateral Raise", group: "Shoulders" },
          { name: "Hammer Curl", group: "Arms" },
          { name: "Skull Crusher", group: "Arms" },
        ],
      },
      {
        name: "Lower B — Volume",
        groups: ["Legs", "Core"],
        exercises: [
          { name: "Front Squat", group: "Legs" },
          { name: "Bulgarian Split Squat", group: "Legs" },
          { name: "Hip Thrust", group: "Legs" },
          { name: "Leg Extension", group: "Legs" },
          { name: "Seated Leg Curl", group: "Legs" },
          { name: "Cable Crunch", group: "Core" },
        ],
      },
    ],
  },
  {
    name: "Bro Split",
    tag: "5-Day",
    days: [
      {
        name: "Chest Day",
        groups: ["Chest"],
        exercises: [
          { name: "Bench Press", group: "Chest" },
          { name: "Incline Dumbbell Press", group: "Chest" },
          { name: "Cable Flyes", group: "Chest" },
          { name: "Dumbbell Flyes", group: "Chest" },
          { name: "Pec Deck", group: "Chest" },
          { name: "Dips (Chest)", group: "Chest" },
        ],
      },
      {
        name: "Back Day",
        groups: ["Back"],
        exercises: [
          { name: "Deadlift", group: "Back" },
          { name: "Pull-ups", group: "Back" },
          { name: "Barbell Row", group: "Back" },
          { name: "Lat Pulldown", group: "Back" },
          { name: "Seated Cable Row", group: "Back" },
          { name: "Straight-Arm Pulldown", group: "Back" },
        ],
      },
      {
        name: "Shoulder Day",
        groups: ["Shoulders"],
        exercises: [
          { name: "Overhead Press", group: "Shoulders" },
          { name: "Arnold Press", group: "Shoulders" },
          { name: "Lateral Raise", group: "Shoulders" },
          { name: "Rear Delt Fly", group: "Shoulders" },
          { name: "Face Pull", group: "Shoulders" },
          { name: "Shrugs", group: "Shoulders" },
        ],
      },
      {
        name: "Arm Day",
        groups: ["Arms"],
        exercises: [
          { name: "Barbell Curl", group: "Arms" },
          { name: "Skull Crusher", group: "Arms" },
          { name: "Hammer Curl", group: "Arms" },
          { name: "Tricep Pushdown", group: "Arms" },
          { name: "Preacher Curl", group: "Arms" },
          { name: "Overhead Tricep Extension", group: "Arms" },
        ],
      },
      {
        name: "Leg Day",
        groups: ["Legs", "Core"],
        exercises: [
          { name: "Back Squat", group: "Legs" },
          { name: "Leg Press", group: "Legs" },
          { name: "Romanian Deadlift", group: "Legs" },
          { name: "Leg Extension", group: "Legs" },
          { name: "Leg Curl", group: "Legs" },
          { name: "Standing Calf Raise", group: "Legs" },
          { name: "Hanging Leg Raise", group: "Core" },
        ],
      },
    ],
  },
  {
    name: "Full Body",
    tag: "3-Day",
    days: [
      {
        name: "Full Body A",
        groups: ["Chest", "Back", "Legs", "Shoulders", "Core"],
        exercises: [
          { name: "Bench Press", group: "Chest" },
          { name: "Barbell Row", group: "Back" },
          { name: "Back Squat", group: "Legs" },
          { name: "Overhead Press", group: "Shoulders" },
          { name: "Plank", group: "Core" },
        ],
      },
      {
        name: "Full Body B",
        groups: ["Chest", "Back", "Legs", "Arms", "Core"],
        exercises: [
          { name: "Incline Dumbbell Press", group: "Chest" },
          { name: "Pull-ups", group: "Back" },
          { name: "Romanian Deadlift", group: "Legs" },
          { name: "Dumbbell Curl", group: "Arms" },
          { name: "Tricep Pushdown", group: "Arms" },
          { name: "Hanging Leg Raise", group: "Core" },
        ],
      },
      {
        name: "Full Body C",
        groups: ["Chest", "Back", "Legs", "Shoulders", "Core"],
        exercises: [
          { name: "Dumbbell Bench Press", group: "Chest" },
          { name: "Seated Cable Row", group: "Back" },
          { name: "Front Squat", group: "Legs" },
          { name: "Lateral Raise", group: "Shoulders" },
          { name: "Hip Thrust", group: "Legs" },
          { name: "Cable Crunch", group: "Core" },
        ],
      },
    ],
  },
  {
    name: "Arnold Split",
    tag: "6-Day",
    days: [
      {
        name: "Chest & Back",
        groups: ["Chest", "Back"],
        exercises: [
          { name: "Bench Press", group: "Chest" },
          { name: "Incline Dumbbell Press", group: "Chest" },
          { name: "Pull-ups", group: "Back" },
          { name: "Barbell Row", group: "Back" },
          { name: "Cable Flyes", group: "Chest" },
          { name: "Lat Pulldown", group: "Back" },
        ],
      },
      {
        name: "Shoulders & Arms",
        groups: ["Shoulders", "Arms"],
        exercises: [
          { name: "Arnold Press", group: "Shoulders" },
          { name: "Lateral Raise", group: "Shoulders" },
          { name: "Barbell Curl", group: "Arms" },
          { name: "Skull Crusher", group: "Arms" },
          { name: "Rear Delt Fly", group: "Shoulders" },
          { name: "Hammer Curl", group: "Arms" },
          { name: "Tricep Pushdown", group: "Arms" },
        ],
      },
      {
        name: "Legs",
        groups: ["Legs", "Core"],
        exercises: [
          { name: "Back Squat", group: "Legs" },
          { name: "Romanian Deadlift", group: "Legs" },
          { name: "Leg Press", group: "Legs" },
          { name: "Walking Lunges", group: "Legs" },
          { name: "Leg Curl", group: "Legs" },
          { name: "Standing Calf Raise", group: "Legs" },
          { name: "Hanging Leg Raise", group: "Core" },
        ],
      },
    ],
  },
];

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

export default function GymTab({ gymLog, saveGymLog, bodyWeight, saveBodyWeight, workoutTemplates, saveWorkoutTemplates }) {
  const [section, setSection] = useState("log");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [weightInput, setWeightInput] = useState("");
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

  const templates = workoutTemplates || [];

  function saveAsTemplate() {
    if (!templateName.trim()) return;
    const exercises = todayWorkouts.map(e => ({ name: e.name, group: e.group }));
    if (exercises.length === 0) return;
    const groups = [...new Set(exercises.map(e => e.group))];
    const template = { id: makeId(), name: templateName.trim(), groups, exercises, createdAt: new Date().toISOString() };
    saveWorkoutTemplates([template, ...templates]);
    setSavingTemplate(false); setTemplateName("");
  }

  function loadTemplate(template) {
    setSessionGroups(template.groups || []);
    setSessionActive(true);
    setSessionStart(Date.now());
    // Pre-create entries for each exercise in the template
    const newEntries = template.exercises.map(ex => ({
      id: makeId(), date: today, name: ex.name, group: ex.group, sets: [],
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }));
    // Don't duplicate exercises already logged today
    const existingNames = new Set(todayWorkouts.map(e => e.name));
    const toAdd = newEntries.filter(e => !existingNames.has(e.name));
    if (toAdd.length > 0) {
      saveGymLog([...toAdd, ...(gymLog || [])]);
    }
    setPicking(true);
  }

  function deleteTemplate(id) {
    saveWorkoutTemplates(templates.filter(t => t.id !== id));
  }

  function addPresetDay(day) {
    const exists = templates.some(t => t.name === day.name);
    if (exists) return;
    const template = { id: makeId(), name: day.name, groups: day.groups, exercises: day.exercises, createdAt: new Date().toISOString() };
    saveWorkoutTemplates([...templates, template]);
  }

  function addPresetProgram(program) {
    const existingNames = new Set(templates.map(t => t.name));
    const toAdd = program.days.filter(d => !existingNames.has(d.name)).map(d => ({
      id: makeId(), name: d.name, groups: d.groups, exercises: d.exercises, createdAt: new Date().toISOString(),
    }));
    if (toAdd.length === 0) return;
    saveWorkoutTemplates([...templates, ...toAdd]);
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
        {[{ id: "log", label: "Log" }, { id: "templates", label: "Templates" }, { id: "weight", label: "Weight" }].map(s => (
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

      {/* ─── TEMPLATES ─── */}
      {section === "templates" && (() => {
        const templateNames = new Set(templates.map(t => t.name));

        return (
          <div style={{ animation: "fadeIn 0.2s ease-out" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Workout Templates</div>

            {/* Save current workout as template */}
            {hasSession && !savingTemplate && (
              <button className="cozy-btn primary full" onClick={() => setSavingTemplate(true)} style={{ marginBottom: 14 }}>
                Save Today's Workout as Template
              </button>
            )}

            {savingTemplate && (
              <Card style={{ padding: 14, marginBottom: 14, border: "2px solid var(--accent)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>
                  {todayWorkouts.length} exercises: {todayWorkouts.map(e => e.name).join(", ")}
                </div>
                <input className="cozy-input" placeholder="Template name (e.g. Push Day)" value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveAsTemplate(); }}
                  style={{ marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveAsTemplate} disabled={!templateName.trim()}>Save</button>
                  <button className="cozy-btn secondary" onClick={() => setSavingTemplate(false)}>Cancel</button>
                </div>
              </Card>
            )}

            {/* My Templates */}
            {templates.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>My Templates</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {templates.map((t, i) => (
                    <Card key={t.id} style={{ padding: 0, animation: `fadeIn 0.2s ease-out ${i * 40}ms both` }}>
                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                              {t.exercises.length} exercises · {t.groups.join(", ")}
                            </div>
                          </div>
                          <button onClick={() => deleteTemplate(t.id)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", padding: 4 }}>✕</button>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                          {t.exercises.map((ex, j) => (
                            <span key={j} style={{
                              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                              background: GROUP_COLORS[ex.group] ? `${GROUP_COLORS[ex.group]}18` : "#f5f0e8",
                              color: GROUP_COLORS[ex.group] || "var(--muted)",
                              border: `1px solid ${GROUP_COLORS[ex.group] ? `${GROUP_COLORS[ex.group]}30` : "#e0cdb5"}`,
                            }}>
                              {ex.name}
                            </span>
                          ))}
                        </div>
                        <button className="cozy-btn primary full" style={{ fontSize: 12 }} onClick={() => loadTemplate(t)}>
                          Start This Workout
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Preset Programs */}
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Programs</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PRESET_PROGRAMS.map((program, pi) => (
                <Card key={program.name} style={{ padding: 0, overflow: "hidden", animation: `fadeIn 0.3s ease-out ${pi * 50}ms both` }}>
                  <div style={{ padding: "14px 16px 10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: 17, fontFamily: "var(--display)" }}>{program.name}</div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                        background: "linear-gradient(135deg, rgba(196,149,106,0.15), rgba(196,149,106,0.08))",
                        color: "var(--accent)",
                      }}>
                        {program.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 10 }}>
                      {program.days.length} workout{program.days.length > 1 ? "s" : ""} per cycle
                    </div>

                    {/* Add all button */}
                    {!program.days.every(d => templateNames.has(d.name)) && (
                      <button className="cozy-btn secondary full" style={{ fontSize: 11, marginBottom: 10, padding: "8px 14px", minHeight: 36 }}
                        onClick={() => addPresetProgram(program)}>
                        Add All to My Templates
                      </button>
                    )}
                    {program.days.every(d => templateNames.has(d.name)) && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a4a", textAlign: "center", marginBottom: 10, padding: "6px 0" }}>
                        Added to your templates
                      </div>
                    )}
                  </div>

                  {/* Individual days */}
                  {program.days.map((day, di) => {
                    const added = templateNames.has(day.name);
                    return (
                      <div key={di} style={{ padding: "10px 16px", borderTop: "1px solid #f0e6d6" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{day.name}</div>
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                              {day.exercises.length} exercises · {day.groups.join(", ")}
                            </div>
                          </div>
                          {!added ? (
                            <button className="filter-chip" onClick={() => addPresetDay(day)}
                              style={{ fontSize: 10, padding: "4px 10px", minHeight: 26 }}>
                              + Add
                            </button>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#4a7a4a", padding: "4px 10px" }}>Added</span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {day.exercises.map((ex, j) => (
                            <span key={j} style={{
                              fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                              background: GROUP_COLORS[ex.group] ? `${GROUP_COLORS[ex.group]}12` : "#f5f0e8",
                              color: GROUP_COLORS[ex.group] || "var(--muted)",
                            }}>
                              {ex.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ─── WEIGHT SECTION ─── */}
      {section === "weight" && (() => {
        const entries = (bodyWeight || []).sort((a, b) => a.date.localeCompare(b.date));
        const last30 = entries.slice(-30);
        const todayEntry = entries.find(e => e.date === today);
        const latestWeight = entries.length > 0 ? Number(entries[entries.length - 1].weight) : null;
        const startWeight = last30.length > 0 ? Number(last30[0].weight) : null;
        const change = latestWeight && startWeight ? (latestWeight - startWeight).toFixed(1) : null;
        const avg7 = (() => {
          const recent = entries.slice(-7);
          return recent.length > 0 ? (recent.reduce((s, e) => s + Number(e.weight), 0) / recent.length).toFixed(1) : null;
        })();

        // Chart data
        const chartData = last30.length >= 2 ? last30 : [];
        const minW = chartData.length > 0 ? Math.min(...chartData.map(e => Number(e.weight))) - 3 : 0;
        const maxW = chartData.length > 0 ? Math.max(...chartData.map(e => Number(e.weight))) + 3 : 1;
        const range = maxW - minW || 1;
        const points = chartData.map((e, i) => ({
          x: chartData.length > 1 ? (i / (chartData.length - 1)) * 270 + 15 : 150,
          y: 130 - ((Number(e.weight) - minW) / range) * 110,
          ...e,
        }));

        function logWeight() {
          if (!weightInput) return;
          const entry = { id: makeId(), date: today, weight: weightInput, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) };
          const updated = [...(bodyWeight || []).filter(e => e.date !== today), entry];
          saveBodyWeight(updated);
          setWeightInput("");
        }

        return (
          <>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Body Weight</div>

            {/* Current weight + log */}
            <Card style={{ padding: 20, marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", animation: "countUp 0.4s ease-out" }}>
                {todayEntry ? `${todayEntry.weight}` : latestWeight ? `${latestWeight}` : "--"}
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)", marginLeft: 4 }}>lb</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {todayEntry ? `Logged today at ${todayEntry.time}` : latestWeight ? "Last logged" : "No data yet"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
                <input className="cozy-input" placeholder="Weight (lb)" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                  inputMode="decimal" style={{ width: 120, textAlign: "center" }}
                  onKeyDown={e => { if (e.key === "Enter") logWeight(); }} />
                <button className="cozy-btn primary" onClick={logWeight} disabled={!weightInput}>Log</button>
              </div>
            </Card>

            {/* Weight chart */}
            {chartData.length >= 2 && (
              <Card style={{ padding: 16, marginBottom: 14, animation: "fadeIn 0.4s ease-out" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>30-Day Trend</div>
                <svg viewBox="0 0 300 150" width="100%" style={{ display: "block" }}>
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                    const y = 130 - pct * 110;
                    const val = Math.round(minW + pct * range);
                    return (
                      <g key={pct}>
                        <line x1="15" y1={y} x2="285" y2={y} stroke="#e8dcc8" strokeWidth="0.5" />
                        <text x="5" y={y + 3} fontSize="7" fill="#b0a090">{val}</text>
                      </g>
                    );
                  })}
                  {/* Line */}
                  <polyline points={points.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dots */}
                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" stroke="var(--card)" strokeWidth="2" style={{ animation: `popIn 0.2s ease-out ${i * 30}ms both` }} />
                  ))}
                  {/* Trend line */}
                  {points.length >= 3 && (() => {
                    const n = points.length;
                    const vals = points.map(p => Number(p.weight));
                    const sumX = points.reduce((s, _, i) => s + i, 0);
                    const sumY = vals.reduce((s, v) => s + v, 0);
                    const sumXY = vals.reduce((s, v, i) => s + i * v, 0);
                    const sumX2 = points.reduce((s, _, i) => s + i * i, 0);
                    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                    const intercept = (sumY - slope * sumX) / n;
                    const y1 = 130 - ((intercept - minW) / range) * 110;
                    const y2 = 130 - ((intercept + slope * (n - 1) - minW) / range) * 110;
                    return <line x1={points[0].x} y1={y1} x2={points[n - 1].x} y2={y2} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />;
                  })()}
                </svg>
              </Card>
            )}

            {/* Stats */}
            {entries.length > 0 && (
              <Card style={{ padding: 16, animation: "fadeIn 0.3s ease-out 100ms both" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{latestWeight || "--"} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>lb</span></div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Current</div>
                  </div>
                  {change !== null && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: Number(change) <= 0 ? "#6b8e6b" : "#d48a7b" }}>
                        {Number(change) > 0 ? "+" : ""}{change} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>lb</span>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>30-Day Change</div>
                    </div>
                  )}
                  {avg7 && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{avg7} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>lb</span></div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>7-Day Avg</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{entries.length}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Weigh-ins</div>
                  </div>
                </div>
              </Card>
            )}
          </>
        );
      })()}

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
