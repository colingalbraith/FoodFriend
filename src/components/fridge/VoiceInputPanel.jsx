import { useState, useRef } from "react";
import { CATEGORY_EMOJI } from "../../constants/categories";
import { autoExpiry } from "../../utils/itemHelpers";

export default function VoiceInputPanel({ onAdd, onClose }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState([]);
  const [error, setError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = useRef(null);

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition isn't supported in this browser. Try Chrome!"); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onerror = (e) => { setError(`Mic error: ${e.error}`); setListening(false); };
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
    setError(null);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function parseWithAI() {
    if (!transcript.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: "Extract grocery items from this voice transcript. Return ONLY a JSON array of objects with 'name' (string) and 'qty' (string, default '1'). No markdown, no backticks.",
          messages: [{ role: "user", content: `Transcript: "${transcript}"` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      setParsed(JSON.parse(clean));
    } catch (e) {
      setError("Couldn't parse voice input. Try again!");
    }
    setAiLoading(false);
  }

  function submit() {
    if (parsed.length === 0) return;
    onAdd(parsed);
    onClose();
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <button className={`mic-btn ${listening ? "active" : ""}`}
          onClick={listening ? stopListening : startListening}
        >
          {listening ? "⏹️" : "🎙️"}
        </button>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, fontWeight: 600 }}>
          {listening ? "Listening... say your grocery items" : "Tap to start speaking"}
        </div>
      </div>

      {error && <div style={{ fontSize: 12, color: "#c0392b", textAlign: "center", marginBottom: 10 }}>{error}</div>}

      {transcript && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>What I heard:</div>
          <div className="cozy-input" style={{ minHeight: 60, whiteSpace: "pre-wrap", fontSize: 13, background: "#f9f3e8" }}>
            {transcript}
          </div>
          {parsed.length === 0 && (
            <button className="cozy-btn primary full" style={{ marginTop: 8 }} onClick={parseWithAI} disabled={aiLoading}>
              {aiLoading ? "Parsing..." : "✨ Parse Items with AI"}
            </button>
          )}
        </div>
      )}

      {parsed.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Found {parsed.length} items:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
            {parsed.map((p, i) => (
              <span key={i} className="quick-chip">
                {CATEGORY_EMOJI[autoExpiry(p.name).category] || "🛒"} {p.qty !== "1" ? `${p.qty}× ` : ""}{p.name}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={submit}>Add All</button>
            <button className="cozy-btn secondary" onClick={onClose}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
