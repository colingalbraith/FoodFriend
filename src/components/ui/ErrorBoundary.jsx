import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const isQuota = this.state.error?.name === "QuotaExceededError" ||
        this.state.error?.message?.includes("quota");

      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 40, fontFamily: "'Nunito', sans-serif", background: "#fdf6ec", color: "#5a3e22",
        }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {isQuota ? "💾" : "😵"}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              {isQuota ? "Storage Full" : "Something went wrong"}
            </h2>
            <p style={{ fontSize: 14, color: "#a8906f", lineHeight: 1.5, marginBottom: 20 }}>
              {isQuota
                ? "Your browser's storage is full. Try clearing some data in Settings, or use a different browser."
                : "The app hit an unexpected error. Reloading usually fixes it."}
            </p>
            <button onClick={() => window.location.reload()} style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14,
              padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #c4956a, #a8784e)", color: "white",
              boxShadow: "0 2px 8px rgba(168,120,78,0.25)",
            }}>
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
