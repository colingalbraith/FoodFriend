import { useState, useEffect } from "react";

const STEPS = [
  {
    id: "add-food",
    title: "Stock your fridge",
    desc: "Tap Quick Add below to add some food to your fridge. Try adding a few items!",
    icon: "🧊",
    tab: "fridge",
    action: "Add items below",
    checkKey: "items",
  },
  {
    id: "pantry",
    title: "Check your pantry",
    desc: "Swipe left on the fridge to see your pantry. Tap items to mark what you have in stock.",
    icon: "🫙",
    tab: "fridge",
    action: "Swipe left to pantry",
  },
  {
    id: "pick-routine",
    title: "Pick a workout",
    desc: "Browse preset programs like Push/Pull/Legs or Full Body. Tap 'Add All' to save one to your templates.",
    icon: "💪",
    tab: "gym",
    subSection: "templates",
    action: "Pick a program",
    checkKey: "templates",
  },
  {
    id: "nutrition",
    title: "Plan your meals",
    desc: "Tap any day to plan a meal. Your recipes will show what you can cook with what's in your fridge.",
    icon: "📋",
    tab: "meals",
    action: "Tap a meal slot",
  },
  {
    id: "ready",
    title: "You're all set!",
    desc: "Your fridge is stocked, workouts are ready, and meals are waiting to be planned. Let's go!",
    icon: "🎉",
    tab: "fridge",
  },
];

export default function Walkthrough({ onComplete, onSwitchTab, items, workoutTemplates }) {
  const [step, setStep] = useState(0);
  const [entering, setEntering] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 350);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const s = STEPS[step];
    if (s.tab && onSwitchTab) onSwitchTab(s.tab);
  }, [step]);

  // Auto-advance when user completes the action
  useEffect(() => {
    const s = STEPS[step];
    if (s.checkKey === "items" && items && items.length > 0) {
      // They added food — auto advance after a short delay
      const t = setTimeout(() => setStep(prev => prev === 0 ? 1 : prev), 800);
      return () => clearTimeout(t);
    }
    if (s.checkKey === "templates" && workoutTemplates && workoutTemplates.length > 0) {
      const t = setTimeout(() => setStep(prev => prev === 2 ? 3 : prev), 800);
      return () => clearTimeout(t);
    }
  }, [step, items?.length, workoutTemplates?.length]);

  function next() {
    if (step === STEPS.length - 1) { onComplete(); return; }
    setStep(s => s + 1);
  }
  function skip() { onComplete(); }

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Check if user completed this step's action
  const completed = (s.checkKey === "items" && items?.length > 0) ||
    (s.checkKey === "templates" && workoutTemplates?.length > 0);

  if (dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes wtSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wtBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes wtCheckPop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
      `}</style>

      {/* Floating card at top — does NOT block interaction with the app */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 900,
        padding: "52px 16px 0",
        display: "flex", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <div style={{
          background: "var(--card)",
          borderRadius: 18,
          padding: "16px 20px 14px",
          width: "100%", maxWidth: 400,
          boxShadow: "0 6px 30px rgba(139,109,71,0.2)",
          animation: entering ? "wtSlideDown 0.3s ease-out" : "none",
          pointerEvents: "auto",
          border: "1px solid var(--border)",
        }}>
          {/* Top row: icon + title + skip */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 26, animation: "wtBounce 2s ease-in-out infinite", flexShrink: 0 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{s.title}</div>
            </div>
            {!isLast && (
              <button onClick={skip} style={{
                background: "none", border: "none", color: "var(--muted)",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--body)", padding: "6px 8px",
                WebkitTapHighlightColor: "transparent", flexShrink: 0,
              }}>
                Skip
              </button>
            )}
          </div>

          {/* Description */}
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, lineHeight: 1.4, marginBottom: 12 }}>
            {s.desc}
          </div>

          {/* Bottom row: progress + action hint / next button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: step === i ? 14 : 5, height: 5, borderRadius: 3,
                  background: i <= step ? "var(--accent)" : "#e0cdb5",
                  transition: "all 0.3s ease",
                }} />
              ))}
            </div>

            {completed ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: "#6b8e6b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "wtCheckPop 0.3s ease-out",
                }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button className="cozy-btn primary" onClick={next} style={{ fontSize: 12, padding: "6px 16px", minHeight: 30 }}>
                  Next
                </button>
              </div>
            ) : isLast ? (
              <button className="cozy-btn primary" onClick={next} style={{ fontSize: 13, padding: "8px 24px", minHeight: 34 }}>
                Let's Go!
              </button>
            ) : (
              <button className="cozy-btn secondary" onClick={next} style={{ fontSize: 11, padding: "6px 14px", minHeight: 30 }}>
                {s.action || "Next"} →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
