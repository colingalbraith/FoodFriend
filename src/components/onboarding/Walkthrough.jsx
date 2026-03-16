import { useState, useEffect } from "react";

const STEPS = [
  {
    title: "Your Food",
    desc: "This is your fridge. Add items, track what's expiring, and swipe left to see your pantry staples.",
    icon: "🧊",
    tab: "fridge",
  },
  {
    title: "Nutrition",
    desc: "Plan meals for the week, browse recipes you can cook with what's in your fridge, and manage your shopping list.",
    icon: "📋",
    tab: "meals",
  },
  {
    title: "Gym",
    desc: "Log workouts by tapping muscle groups, track sets and reps, and use preset programs like PPL or Upper/Lower.",
    icon: "💪",
    tab: "gym",
  },
  {
    title: "Stats",
    desc: "See your weekly calorie and protein trends, gym volume, personal records, and body weight progress.",
    icon: "📊",
    tab: "stats",
  },
  {
    title: "You're ready!",
    desc: "Start by adding some food to your fridge. Everything connects — plan meals, track macros, hit the gym.",
    icon: "🚀",
    tab: null,
  },
];

export default function Walkthrough({ onComplete, onSwitchTab }) {
  const [step, setStep] = useState(0);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 350);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (STEPS[step].tab && onSwitchTab) {
      onSwitchTab(STEPS[step].tab);
    }
  }, [step]);

  function next() {
    if (step === STEPS.length - 1) { onComplete(); return; }
    setStep(s => s + 1);
  }
  function skip() { onComplete(); }

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes wtSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wtBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      {/* Light scrim — just enough to focus attention on the card without hiding content */}
      <div onClick={next} style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(90,62,34,0.15)",
        WebkitTapHighlightColor: "transparent",
      }} />

      {/* Tooltip card — positioned at top so users can see the page below */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: "56px 20px 0",
        display: "flex", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <div style={{
          background: "var(--card)",
          borderRadius: 20,
          padding: "24px 24px 20px",
          width: "100%", maxWidth: 400,
          boxShadow: "0 8px 40px rgba(139,109,71,0.25)",
          animation: entering ? "wtSlideDown 0.3s ease-out" : "none",
          textAlign: "center",
          pointerEvents: "auto",
        }}>
          {/* Icon + Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 32, animation: "wtBounce 2s ease-in-out infinite" }}>{s.icon}</span>
            <span style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: "var(--text)" }}>{s.title}</span>
          </div>

          {/* Description */}
          <div style={{
            fontSize: 13, color: "var(--muted)", fontWeight: 600,
            lineHeight: 1.5, marginBottom: 16,
          }}>
            {s.desc}
          </div>

          {/* Progress dots + buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {!isLast ? (
              <button onClick={skip} style={{
                background: "none", border: "none", color: "var(--muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--body)", padding: "8px 4px",
                WebkitTapHighlightColor: "transparent",
              }}>
                Skip
              </button>
            ) : <div />}

            <div style={{ display: "flex", gap: 5 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: step === i ? 16 : 5, height: 5, borderRadius: 3,
                  background: i <= step ? "var(--accent)" : "#e0cdb5",
                  transition: "all 0.3s ease",
                }} />
              ))}
            </div>

            <button className="cozy-btn primary" onClick={next} style={{
              fontSize: 13, padding: "8px 20px", minHeight: 34,
            }}>
              {isLast ? "Let's Go!" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
