import { useState, useEffect } from "react";

const SEX_OPTIONS = ["Male", "Female", "Other"];
const GOAL_OPTIONS = ["Lose Weight", "Maintain", "Build Muscle", "Body Recomp"];
const ACTIVITY_OPTIONS = ["Sedentary", "Light", "Moderate", "Active", "Very Active"];
const RESTRICTION_OPTIONS = ["None", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Halal", "Kosher"];

const ACTIVITY_MULTIPLIERS = { Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Active: 1.725, "Very Active": 1.9 };

const TOTAL_STEPS = 5; // 0=welcome, 1=name, 2=body, 3=goals, 4=diet

// Animated food emojis that float around
function FloatingEmoji({ emoji, delay, x, y, duration }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      fontSize: 28, opacity: 0,
      animation: `floatEmoji ${duration}s ease-in-out ${delay}s infinite`,
      pointerEvents: "none", zIndex: 0,
    }}>
      {emoji}
    </div>
  );
}

// Confetti particles for the final step
function Confetti() {
  const colors = ["#c4956a", "#6b8e6b", "#d48a7b", "#8ab4d4", "#c4a86a", "#8ac4a8", "#d4a87b"];
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 60,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.left}%`, top: "-5%",
          width: p.size, height: p.size * 1.5,
          background: p.color, borderRadius: 2,
          transform: `rotate(${p.rotation}deg)`,
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          "--drift": `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1); // 1=forward, -1=back
  const [animKey, setAnimKey] = useState(0);

  // Profile state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [activity, setActivity] = useState("");
  const [restrictions, setRestrictions] = useState([]);

  function next() { setDir(1); setAnimKey(k => k + 1); setStep(s => Math.min(s + 1, TOTAL_STEPS)); }
  function back() { setDir(-1); setAnimKey(k => k + 1); setStep(s => Math.max(s - 1, 0)); }

  function toggleRestriction(r) {
    if (r === "None") { setRestrictions(restrictions.includes("None") ? [] : ["None"]); }
    else { const without = restrictions.filter(x => x !== "None"); setRestrictions(without.includes(r) ? without.filter(x => x !== r) : [...without, r]); }
  }

  function finish() {
    // Calculate macro goals
    const w = Number(weight); const a = Number(age);
    const hFt = Number(heightFt); const hIn = Number(heightIn) || 0;
    let macroGoals = null;
    if (w && a && hFt && sex && goal && activity) {
      const totalInches = hFt * 12 + hIn;
      const heightCm = totalInches * 2.54;
      const weightKg = w * 0.453592;
      const sexOffset = sex === "Male" ? 5 : -161;
      const bmr = 10 * weightKg + 6.25 * heightCm - 5 * a + sexOffset;
      const tdee = bmr * (ACTIVITY_MULTIPLIERS[activity] || 1.55);
      let calories = goal === "Lose Weight" ? tdee - 500 : goal === "Build Muscle" ? tdee + 300 : tdee;
      const proteinPerLb = goal === "Build Muscle" ? 1.0 : goal === "Lose Weight" ? 1.2 : 0.8;
      const protein = Math.round(w * proteinPerLb);
      const fat = Math.round((calories * 0.25) / 9);
      const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
      macroGoals = { calories: Math.round(calories), protein, carbs: Math.max(carbs, 0), fat };
    }

    onComplete({
      profile: { name, age, sex, heightFt, heightIn, weight, goalWeight, goal, activity, experience: "", split: "", daysPerWeek: "", restrictions },
      macroGoals,
    });
  }

  const slideAnim = dir === 1 ? "slideInRight" : "slideInLeft";
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-grad)",
      display: "flex", flexDirection: "column", fontFamily: "var(--body)", color: "var(--text)",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes floatEmoji {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.8) rotate(0deg); }
          15% { opacity: 0.6; }
          50% { opacity: 0.4; transform: translateY(-30px) scale(1.1) rotate(10deg); }
          85% { opacity: 0.6; }
        }
        @keyframes fridgeBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.1) rotate(-3deg); }
          40% { transform: scale(0.95) rotate(2deg); }
          60% { transform: scale(1.05) rotate(-1deg); }
          80% { transform: scale(0.98) rotate(0.5deg); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(196,149,106,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(196,149,106,0); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(720deg); opacity: 0; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes waveHand {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-15deg); }
        }
      `}</style>

      {/* Background emojis */}
      {step === 0 && (
        <>
          <FloatingEmoji emoji="🥦" delay={0} x={10} y={20} duration={4} />
          <FloatingEmoji emoji="🍗" delay={0.5} x={80} y={15} duration={5} />
          <FloatingEmoji emoji="🥚" delay={1} x={20} y={70} duration={3.5} />
          <FloatingEmoji emoji="🧀" delay={1.5} x={75} y={65} duration={4.5} />
          <FloatingEmoji emoji="🍎" delay={0.3} x={50} y={85} duration={3.8} />
          <FloatingEmoji emoji="🥩" delay={0.8} x={35} y={30} duration={4.2} />
          <FloatingEmoji emoji="🥛" delay={1.2} x={65} y={45} duration={3.6} />
          <FloatingEmoji emoji="🍞" delay={0.6} x={15} y={50} duration={5.2} />
        </>
      )}

      {/* Final step confetti */}
      {step === TOTAL_STEPS && <Confetti />}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 28px", maxWidth: 420, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>

        {/* ═══ STEP 0: Welcome ═══ */}
        {step === 0 && (
          <div key={animKey} style={{ textAlign: "center", animation: "scaleUp 0.6s cubic-bezier(0.32, 0.72, 0, 1)" }}>
            <div style={{ fontSize: 80, marginBottom: 16, animation: "fridgeBounce 2s ease-in-out infinite" }}>
              🧊
            </div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 42, fontWeight: 700, margin: "0 0 8px", color: "var(--text)" }}>
              Stockd
            </h1>
            <p style={{ fontSize: 16, color: "var(--muted)", fontWeight: 600, lineHeight: 1.5, marginBottom: 40 }}>
              Your fridge, meals, gym & goals<br />all in one place.
            </p>
            <button className="cozy-btn primary full" onClick={next} style={{ animation: "pulseGlow 2s ease-in-out infinite", fontSize: 16, padding: "16px 24px" }}>
              Let's Get Started
            </button>
          </div>
        )}

        {/* ═══ STEP 1: Name & Basics ═══ */}
        {step === 1 && (
          <div key={animKey} style={{ animation: `${slideAnim} 0.35s ease-out` }}>
            <div style={{ fontSize: 40, marginBottom: 12, animation: "waveHand 1.5s ease-in-out 0.3s 2" }}>👋</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>Hey there!</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>What should we call you?</p>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Name</label>
              <input className="cozy-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ fontSize: 18 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Age</label>
                <input className="cozy-input" placeholder="25" value={age} onChange={e => setAge(e.target.value)} inputMode="numeric" />
              </div>
              <div>
                <label style={labelStyle}>Sex</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {SEX_OPTIONS.map(s => (
                    <button key={s} className={`filter-chip ${sex === s ? "active" : ""}`} onClick={() => setSex(s)} style={{ flex: 1, justifyContent: "center", fontSize: 12 }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Body ═══ */}
        {step === 2 && (
          <div key={animKey} style={{ animation: `${slideAnim} 0.35s ease-out` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📏</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>Your stats</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Used to calculate your calorie goals.</p>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Height</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="cozy-input" placeholder="5" value={heightFt} onChange={e => setHeightFt(e.target.value)} inputMode="numeric" style={{ width: 70, textAlign: "center" }} />
                <span style={{ fontWeight: 700, color: "var(--muted)" }}>ft</span>
                <input className="cozy-input" placeholder="10" value={heightIn} onChange={e => setHeightIn(e.target.value)} inputMode="numeric" style={{ width: 70, textAlign: "center" }} />
                <span style={{ fontWeight: 700, color: "var(--muted)" }}>in</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Current Weight (lb)</label>
                <input className="cozy-input" placeholder="170" value={weight} onChange={e => setWeight(e.target.value)} inputMode="numeric" />
              </div>
              <div>
                <label style={labelStyle}>Goal Weight (lb)</label>
                <input className="cozy-input" placeholder="160" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} inputMode="numeric" />
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Goals ═══ */}
        {step === 3 && (
          <div key={animKey} style={{ animation: `${slideAnim} 0.35s ease-out` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>Your goal</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>We'll tailor your calorie & protein targets.</p>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>What's the goal?</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {GOAL_OPTIONS.map((g, i) => (
                  <button key={g} className={`filter-chip ${goal === g ? "active" : ""}`} onClick={() => setGoal(g)}
                    style={{ padding: "14px 18px", fontSize: 14, justifyContent: "center", animation: `fadeIn 0.3s ease-out ${i * 60}ms both` }}>
                    {g === "Lose Weight" && "🔥 "}{g === "Maintain" && "⚖️ "}{g === "Build Muscle" && "💪 "}{g === "Body Recomp" && "🔄 "}{g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Activity Level</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ACTIVITY_OPTIONS.map(a => (
                  <button key={a} className={`filter-chip ${activity === a ? "active" : ""}`} onClick={() => setActivity(a)} style={{ fontSize: 12 }}>{a}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Diet ═══ */}
        {step === 4 && (
          <div key={animKey} style={{ animation: `${slideAnim} 0.35s ease-out` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>Dietary needs</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>We'll filter recipes to match. Pick all that apply.</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {RESTRICTION_OPTIONS.map((r, i) => (
                <button key={r} className={`filter-chip ${restrictions.includes(r) ? "active" : ""}`} onClick={() => toggleRestriction(r)}
                  style={{ padding: "12px 18px", fontSize: 14, animation: `popIn 0.3s ease-out ${i * 40}ms both` }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Done ═══ */}
        {step === TOTAL_STEPS && (
          <div key={animKey} style={{ textAlign: "center", animation: "scaleUp 0.5s cubic-bezier(0.32, 0.72, 0, 1)" }}>
            <div style={{ fontSize: 72, marginBottom: 16, animation: "fridgeBounce 1.5s ease-in-out" }}>🎉</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
              You're all set{name ? `, ${name}` : ""}!
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, lineHeight: 1.5, marginBottom: 36 }}>
              Your goals are calculated and ready to go.<br />Time to stock up.
            </p>
            <button className="cozy-btn primary full" onClick={finish} style={{ fontSize: 16, padding: "16px 24px", animation: "pulseGlow 2s ease-in-out infinite" }}>
              Open My Fridge
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav: progress + buttons */}
      {step > 0 && step < TOTAL_STEPS && (
        <div style={{ padding: "20px 28px 36px", maxWidth: 420, margin: "0 auto", width: "100%" }}>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
            {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => (
              <div key={i} style={{
                width: step === i + 1 ? 24 : 8, height: 8, borderRadius: 4,
                background: i + 1 <= step ? "var(--accent)" : "#e0cdb5",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="cozy-btn secondary" onClick={back} style={{ padding: "14px 20px" }}>Back</button>
            <button className="cozy-btn primary" style={{ flex: 1, fontSize: 15, padding: "14px 20px" }} onClick={next}>
              {step === TOTAL_STEPS - 1 ? "Finish" : "Continue"}
            </button>
          </div>

          {/* Skip option */}
          <button onClick={finish} style={{
            display: "block", margin: "14px auto 0", background: "none", border: "none",
            color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--body)", WebkitTapHighlightColor: "transparent",
          }}>
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
