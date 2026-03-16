import { useState, useEffect } from "react";

const STEPS = [
  {
    title: "Your Food",
    desc: "This is your fridge. Add items, track what's expiring, and swipe left to see your pantry staples.",
    icon: "🧊",
    tab: "fridge",
    position: "top",
  },
  {
    title: "Nutrition",
    desc: "Plan your meals for the week, browse recipes you can cook with what's in your fridge, and manage your shopping list.",
    icon: "📋",
    tab: "meals",
    position: "top",
  },
  {
    title: "Gym",
    desc: "Log workouts by tapping muscle groups, track sets and reps, and use preset programs like PPL or Upper/Lower.",
    icon: "💪",
    tab: "gym",
    position: "top",
  },
  {
    title: "Stats",
    desc: "See your weekly calorie and protein trends, gym volume, personal records, and body weight progress.",
    icon: "📊",
    tab: "stats",
    position: "top",
  },
  {
    title: "You're ready!",
    desc: "Start by adding some food to your fridge. Everything connects — plan meals, track macros, hit the gym.",
    icon: "🚀",
    tab: null,
    position: "center",
  },
];

export default function Walkthrough({ onComplete, onSwitchTab }) {
  const [step, setStep] = useState(0);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 300);
    return () => clearTimeout(t);
  }, [step]);

  // Switch to the relevant tab when stepping
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
  const isCenter = s.position === "center";

  return (
    <>
      <style>{`
        @keyframes wtFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wtSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wtPulseRing { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.15); opacity: 0; } }
        @keyframes wtBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* Overlay backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(90,62,34,0.5)",
        backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
        animation: "wtFadeIn 0.3s ease-out",
        display: "flex", flexDirection: "column",
        justifyContent: isCenter ? "center" : "flex-end",
        alignItems: "center",
        padding: isCenter ? 28 : 0,
      }}>
        {/* Tooltip card */}
        <div style={{
          background: "var(--card)", borderRadius: isCenter ? 24 : "24px 24px 0 0",
          padding: isCenter ? "36px 28px" : "28px 24px 32px",
          width: "100%", maxWidth: 420,
          boxShadow: "0 -4px 40px rgba(139,109,71,0.2)",
          animation: entering ? "wtSlideUp 0.3s ease-out" : "none",
          textAlign: "center",
        }}>
          {/* Icon */}
          <div style={{
            fontSize: 48, marginBottom: 12,
            animation: "wtBounce 2s ease-in-out infinite",
          }}>
            {s.icon}
          </div>

          {/* Title */}
          <div style={{
            fontFamily: "var(--display)", fontSize: 28, fontWeight: 700,
            color: "var(--text)", marginBottom: 8,
          }}>
            {s.title}
          </div>

          {/* Description */}
          <div style={{
            fontSize: 14, color: "var(--muted)", fontWeight: 600,
            lineHeight: 1.5, marginBottom: 24, maxWidth: 300, margin: "0 auto 24px",
          }}>
            {s.desc}
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: step === i ? 20 : 6, height: 6, borderRadius: 3,
                background: i <= step ? "var(--accent)" : "#e0cdb5",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {!isLast && (
              <button onClick={skip} style={{
                background: "none", border: "none", color: "var(--muted)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--body)", padding: "12px 20px",
                WebkitTapHighlightColor: "transparent",
              }}>
                Skip Tour
              </button>
            )}
            <button className="cozy-btn primary" onClick={next} style={{
              fontSize: 15, padding: "12px 32px",
            }}>
              {isLast ? "Let's Go!" : "Next"}
            </button>
          </div>
        </div>

        {/* Tab highlight pulse (shows which tab we're talking about) */}
        {s.tab && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: 64, display: "flex", justifyContent: "space-around",
            alignItems: "center", zIndex: 1000, pointerEvents: "none",
          }}>
            {["fridge", "meals", "gym", "stats", "settings"].map(id => (
              <div key={id} style={{
                width: 44, height: 44, borderRadius: 22,
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {id === s.tab && (
                  <div style={{
                    position: "absolute", inset: -6,
                    borderRadius: "50%", border: "2px solid var(--accent)",
                    animation: "wtPulseRing 1.5s ease-in-out infinite",
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
