import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "../../constants/storage";
import Card from "../ui/Card";

const SEX_OPTIONS = ["Male", "Female", "Other"];
const GOAL_OPTIONS = ["Lose Weight", "Maintain", "Build Muscle", "Body Recomp"];
const ACTIVITY_OPTIONS = ["Sedentary", "Light", "Moderate", "Active", "Very Active"];
const EXPERIENCE_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const SPLIT_OPTIONS = ["Push/Pull/Legs", "Upper/Lower", "Full Body", "Bro Split"];
const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const RESTRICTION_OPTIONS = ["None", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Halal", "Kosher"];

const ACTIVITY_MULTIPLIERS = {
  Sedentary: 1.2,
  Light: 1.375,
  Moderate: 1.55,
  Active: 1.725,
  "Very Active": 1.9,
};

export default function SettingsTab({ userProfile, saveUserProfile, macroGoals, saveMacroGoals, bodyWeight, showToast }) {
  const p = userProfile || {};
  const [name, setName] = useState(p.name || "");
  const [age, setAge] = useState(p.age || "");
  const [sex, setSex] = useState(p.sex || "");
  const [heightFt, setHeightFt] = useState(p.heightFt || "");
  const [heightIn, setHeightIn] = useState(p.heightIn || "");
  const [weight, setWeight] = useState(p.weight || "");
  const [goal, setGoal] = useState(p.goal || "");
  const [activity, setActivity] = useState(p.activity || "");
  const [experience, setExperience] = useState(p.experience || "");
  const [split, setSplit] = useState(p.split || "");
  const [daysPerWeek, setDaysPerWeek] = useState(p.daysPerWeek || "");
  const [restrictions, setRestrictions] = useState(p.restrictions || []);
  const [computed, setComputed] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // Sync state when userProfile changes externally
  useEffect(() => {
    const pr = userProfile || {};
    setName(pr.name || "");
    setAge(pr.age || "");
    setSex(pr.sex || "");
    setHeightFt(pr.heightFt || "");
    setHeightIn(pr.heightIn || "");
    setWeight(pr.weight || "");
    setGoal(pr.goal || "");
    setActivity(pr.activity || "");
    setExperience(pr.experience || "");
    setSplit(pr.split || "");
    setDaysPerWeek(pr.daysPerWeek || "");
    setRestrictions(pr.restrictions || []);
  }, [userProfile]);

  function toggleRestriction(r) {
    if (r === "None") {
      setRestrictions(restrictions.includes("None") ? [] : ["None"]);
    } else {
      const without = restrictions.filter(x => x !== "None");
      setRestrictions(
        without.includes(r) ? without.filter(x => x !== r) : [...without, r]
      );
    }
  }

  function calculateGoals() {
    const w = Number(weight);
    const a = Number(age);
    const hFt = Number(heightFt);
    const hIn = Number(heightIn);
    if (!w || !a || !hFt || !sex || !goal || !activity) return;

    const totalInches = hFt * 12 + (hIn || 0);
    const heightCm = totalInches * 2.54;
    const weightKg = w * 0.453592;

    const sexOffset = sex === "Male" ? 5 : -161;
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * a + sexOffset;
    const multiplier = ACTIVITY_MULTIPLIERS[activity] || 1.55;
    const tdee = bmr * multiplier;

    let calories;
    if (goal === "Lose Weight") calories = tdee - 500;
    else if (goal === "Build Muscle") calories = tdee + 300;
    else calories = tdee; // Maintain or Body Recomp

    let proteinPerLb;
    if (goal === "Build Muscle") proteinPerLb = 1.0;
    else if (goal === "Lose Weight") proteinPerLb = 1.2;
    else proteinPerLb = 0.8;

    const protein = Math.round(w * proteinPerLb);
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

    const result = {
      calories: Math.round(calories),
      protein,
      carbs: Math.max(carbs, 0),
      fat,
      tdee: Math.round(tdee),
      bmr: Math.round(bmr),
    };
    setComputed(result);
    // Auto-apply
    saveMacroGoals({ calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat });
    showToast?.("Goals updated");
  }

  function handleSave() {
    saveUserProfile({
      name, age, sex, heightFt, heightIn, weight,
      goal, activity, experience, split, daysPerWeek, restrictions,
    });
  }

  // Latest body weight from gym tracking
  const latestBodyWeight = (() => {
    if (!bodyWeight || bodyWeight.length === 0) return null;
    const sorted = [...bodyWeight].sort((a, b) => b.date.localeCompare(a.date));
    return Number(sorted[0].weight);
  })();

  function syncWeight() {
    if (!latestBodyWeight) return;
    setWeight(String(latestBodyWeight));
    showToast?.(`Weight updated to ${latestBodyWeight} lb from gym log`);
  }

  function exportData() {
    const data = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) data[name] = JSON.parse(raw);
      } catch {}
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stockd-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.("Data exported successfully");
  }

  function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
          if (data[name]) {
            localStorage.setItem(key, JSON.stringify(data[name]));
          }
        });
        showToast?.("Data imported — reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        showToast?.("Invalid backup file");
      }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
      try { window.storage.remove(key).catch(() => {}); } catch {}
    });
    try { localStorage.clear(); } catch {}
    setShowClearConfirm(false);
    window.location.reload();
  }

  const labelStyle = { fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 };
  const sectionTitle = { fontSize: 13, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Settings</div>

      {/* Personal Info */}
      <Card style={{ marginBottom: 14, padding: 16 }}>
        <div style={sectionTitle}>Personal Info</div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Name</label>
          <input className="cozy-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Age</label>
            <input className="cozy-input" placeholder="25" value={age} onChange={e => setAge(e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <label style={labelStyle}>Current Weight (lb)</label>
            <input className="cozy-input" placeholder="170" value={weight} onChange={e => setWeight(e.target.value)} inputMode="numeric" />
            {latestBodyWeight && Number(weight) !== latestBodyWeight && (
              <button onClick={syncWeight} style={{
                marginTop: 4, background: "none", border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--body)",
                padding: 0, WebkitTapHighlightColor: "transparent",
              }}>
                Use latest: {latestBodyWeight} lb from gym log
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Sex</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SEX_OPTIONS.map(s => (
              <button key={s} className={`filter-chip ${sex === s ? "active" : ""}`} onClick={() => setSex(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Height</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="cozy-input" placeholder="5" value={heightFt} onChange={e => setHeightFt(e.target.value)} inputMode="numeric" style={{ width: 60, textAlign: "center" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>ft</span>
            <input className="cozy-input" placeholder="10" value={heightIn} onChange={e => setHeightIn(e.target.value)} inputMode="numeric" style={{ width: 60, textAlign: "center" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>in</span>
          </div>
        </div>
      </Card>

      {/* Goals */}
      <Card style={{ marginBottom: 14, padding: 16 }}>
        <div style={sectionTitle}>Goals</div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Goal</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GOAL_OPTIONS.map(g => (
              <button key={g} className={`filter-chip ${goal === g ? "active" : ""}`} onClick={() => setGoal(g)} style={{ justifyContent: "center", padding: "10px 8px", fontSize: 12 }}>
                {g === "Lose Weight" && "🔥 "}{g === "Maintain" && "⚖️ "}{g === "Build Muscle" && "💪 "}{g === "Body Recomp" && "🔄 "}{g}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Activity Level</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
            {ACTIVITY_OPTIONS.map(a => (
              <button key={a} className={`filter-chip ${activity === a ? "active" : ""}`} onClick={() => setActivity(a)} style={{ fontSize: 10, padding: "8px 4px", justifyContent: "center", minHeight: 34 }}>{a}</button>
            ))}
          </div>
        </div>

        <button className="cozy-btn primary full" onClick={calculateGoals} style={{ marginBottom: computed ? 12 : 0 }}>
          Calculate My Goals
        </button>

        {computed && (
          <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            <Card style={{ padding: 14, marginBottom: 10, background: "linear-gradient(135deg, rgba(107,142,107,0.08), rgba(107,142,107,0.03))" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>
                BMR: {computed.bmr} cal | TDEE: {computed.tdee} cal
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{computed.calories}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>CALORIES</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{computed.protein}g</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>PROTEIN</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{computed.carbs}g</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>CARBS</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{computed.fat}g</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>FAT</div>
                </div>
              </div>
            </Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a4a", textAlign: "center", padding: "8px 0" }}>Applied to your daily targets</div>
          </div>
        )}
      </Card>

      {/* Manual Macro Goals */}
      <Card style={{ marginBottom: 14, padding: 16 }}>
        <div style={sectionTitle}>Daily Targets</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Set your own targets or use Calculate above.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Calories</label>
            <input className="cozy-input" placeholder="2000" value={macroGoals?.calories ?? ""} onChange={e => saveMacroGoals({ ...(macroGoals || {}), calories: Number(e.target.value) || 0 })} inputMode="numeric" />
          </div>
          <div>
            <label style={labelStyle}>Protein (g)</label>
            <input className="cozy-input" placeholder="150" value={macroGoals?.protein ?? ""} onChange={e => saveMacroGoals({ ...(macroGoals || {}), protein: Number(e.target.value) || 0 })} inputMode="numeric" />
          </div>
          <div>
            <label style={labelStyle}>Carbs (g)</label>
            <input className="cozy-input" placeholder="250" value={macroGoals?.carbs ?? ""} onChange={e => saveMacroGoals({ ...(macroGoals || {}), carbs: Number(e.target.value) || 0 })} inputMode="numeric" />
          </div>
          <div>
            <label style={labelStyle}>Fat (g)</label>
            <input className="cozy-input" placeholder="65" value={macroGoals?.fat ?? ""} onChange={e => saveMacroGoals({ ...(macroGoals || {}), fat: Number(e.target.value) || 0 })} inputMode="numeric" />
          </div>
        </div>
      </Card>

      {/* Gym Profile */}
      <Card style={{ marginBottom: 14, padding: 16 }}>
        <div style={sectionTitle}>Gym Profile</div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Experience</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {EXPERIENCE_OPTIONS.map(e => (
              <button key={e} className={`filter-chip ${experience === e ? "active" : ""}`} onClick={() => setExperience(e)}>{e}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Preferred Split</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SPLIT_OPTIONS.map(s => (
              <button key={s} className={`filter-chip ${split === s ? "active" : ""}`} onClick={() => setSplit(s)} style={{ justifyContent: "center", padding: "10px 8px", fontSize: 12 }}>{s}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Days per Week</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
            {DAYS_OPTIONS.map(d => (
              <button key={d} className={`filter-chip ${daysPerWeek === d ? "active" : ""}`} onClick={() => setDaysPerWeek(d)} style={{ justifyContent: "center", padding: "8px 0", fontSize: 13 }}>{d}</button>
            ))}
          </div>
        </div>
      </Card>

      {/* Dietary */}
      <Card style={{ marginBottom: 14, padding: 16 }}>
        <div style={sectionTitle}>Dietary Restrictions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {RESTRICTION_OPTIONS.map(r => (
            <button key={r} className={`filter-chip ${restrictions.includes(r) ? "active" : ""}`} onClick={() => toggleRestriction(r)} style={{ justifyContent: "center", padding: "8px 4px", fontSize: 11 }}>{r}</button>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <button className="cozy-btn primary full" onClick={handleSave} style={{ marginBottom: 20 }}>
        Save Profile
      </button>


      {/* Data Management */}
      <Card style={{ marginBottom: 14, padding: 16 }}>
        <div style={sectionTitle}>Data</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className="cozy-btn secondary" style={{ flex: 1, fontSize: 12 }} onClick={exportData}>Export Backup</button>
          <label className="cozy-btn secondary" style={{ flex: 1, fontSize: 12, cursor: "pointer", textAlign: "center" }}>
            Import Backup
            <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
          </label>
        </div>
        {!showClearConfirm ? (
          <button className="cozy-btn danger full" onClick={() => setShowClearConfirm(true)}>
            Clear All Data
          </button>
        ) : (
          <div style={{ animation: "fadeIn 0.2s ease-out" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#8b3030", marginBottom: 10, textAlign: "center" }}>
              Are you sure? This will delete all your data and cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="cozy-btn danger" style={{ flex: 1 }} onClick={clearAllData}>Yes, Clear Everything</button>
              <button className="cozy-btn secondary" style={{ flex: 1 }} onClick={() => setShowClearConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Card>

      <div style={{ height: 20 }} />
    </div>
  );
}
