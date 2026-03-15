export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Caveat:wght@500;600;700&display=swap');

  :root {
    --bg: #fdf6ec;
    --bg-grad: linear-gradient(160deg, #fdf6ec 0%, #f5ebe0 50%, #faf0e4 100%);
    --card: #fffaf3;
    --border: #e8d5b7;
    --text: #5a3e22;
    --muted: #a8906f;
    --accent: #c4956a;
    --display: 'Caveat', cursive;
    --body: 'Nunito', sans-serif;
    --nav-height: 64px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
  }

  body {
    font-family: var(--body);
    color: var(--text);
    background: var(--bg-grad);
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    overscroll-behavior: none;
  }

  /* ─── App Shell ─── */
  .app-shell {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-grad);
    font-family: var(--body);
    color: var(--text);
  }

  .app-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
  }

  .app-header {
    padding: 16px 20px 0;
    max-width: 520;
    margin: 0 auto;
    width: 100%;
  }

  .app-alerts {
    padding: 0 20px;
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
  }

  .alert-banner {
    border: 2px solid;
    border-radius: 14px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8;
    animation: popIn 0.4s ease-out;
  }

  .alert-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .app-main {
    padding: 14px 20px;
    padding-bottom: 24px;
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
  }

  /* ─── Bottom Navigation ─── */
  .bottom-nav {
    display: flex;
    align-items: stretch;
    justify-content: space-around;
    background: var(--card);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    box-shadow: 0 -2px 20px rgba(139,109,71,0.06);
    position: relative;
    z-index: 1;
  }

  .bottom-nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex: 1;
    height: var(--nav-height);
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    font-family: var(--body);
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .bottom-nav-btn:active {
    transform: scale(0.92);
  }

  .bottom-nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 28px;
    border-radius: 14px;
    transition: all 0.25s ease;
  }

  .bottom-nav-btn.active .bottom-nav-icon {
    background: rgba(196,149,106,0.15);
  }

  .bottom-nav-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--muted);
    transition: color 0.2s ease;
  }

  .bottom-nav-btn.active .bottom-nav-label {
    color: var(--text);
  }

  .bottom-nav-indicator {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 3px;
    border-radius: 0 0 3px 3px;
    background: var(--accent);
    animation: fadeIn 0.2s ease-out;
  }

  /* ─── Animations ─── */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.92); }
    70% { transform: scale(1.02); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes gentlePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes scanLine {
    0%, 100% { transform: translateY(-40px); opacity: 0.4; }
    50% { transform: translateY(40px); opacity: 1; }
  }

  /* ─── Loading Dots ─── */
  .loading-dots {
    display: flex; gap: 6px; justify-content: center; align-items: center;
  }
  .loading-dots span {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--accent); opacity: 0.4;
    animation: loadDot 1.2s ease-in-out infinite;
  }
  .loading-dots span:nth-child(2) { animation-delay: 0.15s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes loadDot {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1.1); }
  }

  /* ─── Inputs ─── */
  .cozy-input {
    font-family: var(--body); font-size: 16px; padding: 12px 14px; border-radius: 12px;
    border: 2px solid #e0cdb5; background: #fffdf8; color: var(--text); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
    -webkit-appearance: none; appearance: none;
  }
  .cozy-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(196,149,106,0.15); }
  .cozy-input::placeholder { color: #c4a882; }

  /* ─── Buttons ─── */
  .cozy-btn {
    font-family: var(--body); font-weight: 700; font-size: 14px; padding: 12px 20px;
    border-radius: 12px; border: 2px solid transparent; cursor: pointer;
    transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 5px;
    white-space: nowrap; -webkit-tap-highlight-color: transparent;
    min-height: 44px;
  }
  .cozy-btn:active { transform: scale(0.96); }
  .cozy-btn.primary { background: linear-gradient(135deg, #c4956a, #a8784e); color: white; box-shadow: 0 2px 8px rgba(168,120,78,0.25); }
  .cozy-btn.primary:active { box-shadow: 0 1px 4px rgba(168,120,78,0.2); }
  .cozy-btn.primary:disabled { opacity: 0.5; cursor: default; transform: none; }
  .cozy-btn.secondary { background: var(--card); color: #8b6d47; border-color: #e0cdb5; }
  .cozy-btn.danger { background: #fde8e8; color: #c0392b; border-color: #f5c6c6; }
  .cozy-btn.full { width: 100%; justify-content: center; }

  /* ─── Add Method Buttons ─── */
  .add-method-btn {
    font-family: var(--body); display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 4px; padding: 16px 8px; border-radius: 14px;
    border: 2px dashed #e0cdb5; background: var(--card); color: var(--muted);
    cursor: pointer; transition: all 0.15s ease; -webkit-tap-highlight-color: transparent;
    min-height: 56px;
  }
  .add-method-btn:active { transform: scale(0.96); background: #fef8f0; border-style: solid; border-color: var(--accent); }

  /* ─── Filter Chips ─── */
  .filter-chip {
    font-family: var(--body); font-size: 12px; font-weight: 700; padding: 7px 12px;
    border-radius: 20px; border: 1.5px solid #e0cdb5; background: var(--card);
    color: var(--muted); cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
    -webkit-tap-highlight-color: transparent; min-height: 34px;
  }
  .filter-chip:active { transform: scale(0.95); }
  .filter-chip.active { background: linear-gradient(135deg, #c4956a, #a8784e); color: white; border-color: transparent; }

  /* ─── Quick Chips ─── */
  .quick-chip {
    font-family: var(--body); font-size: 13px; font-weight: 600; padding: 8px 14px;
    border-radius: 10px; border: 1.5px solid #e0cdb5; background: var(--card);
    color: var(--text); cursor: pointer; transition: all 0.15s ease;
    -webkit-tap-highlight-color: transparent; min-height: 36px;
  }
  .quick-chip:active { transform: scale(0.96); }
  .quick-chip.added { background: #edf5ed; border-color: #b8d4b8; color: #4a7a4a; }
  .quick-chip:disabled { cursor: default; }

  /* ─── Item Rows ─── */
  .item-row {
    display: flex; align-items: center; gap: 10px; padding: 13px 14px;
    border-radius: 12px; transition: all 0.15s ease; cursor: pointer;
    -webkit-tap-highlight-color: transparent; min-height: 52px;
  }
  .item-row:active { background: rgba(228,213,183,0.25); }

  .shopping-item {
    display: flex; align-items: center; gap: 10px; padding: 11px 14px;
    border-radius: 12px; transition: all 0.2s; min-height: 48px;
  }

  .swipe-action {
    font-family: var(--body); font-weight: 700; font-size: 13px; border: none;
    cursor: pointer; padding: 0 20px; display: flex; align-items: center;
    min-height: 52px;
  }
  .swipe-action.use { background: #6b8e6b; color: white; }
  .swipe-action.toss { background: #c0392b; color: white; border-radius: 0 12px 12px 0; }

  /* ─── Category Dot ─── */
  .cat-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }

  /* ─── Meal Cells ─── */
  .meal-cell {
    background: #fffdf8; border: 2px dashed #e8dcc8; border-radius: 10px;
    padding: 8px; min-height: 70px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; text-align: center;
    font-size: 12px; -webkit-tap-highlight-color: transparent;
  }
  .meal-cell:active { border-color: var(--accent); border-style: solid; }
  .meal-cell.filled { border-style: solid; border-color: #d4b896; }

  /* ─── Mic Button ─── */
  .mic-btn {
    width: 72px; height: 72px; border-radius: 50%; border: 3px solid var(--accent);
    background: var(--card); font-size: 28px; cursor: pointer; transition: all 0.3s;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .mic-btn:active { transform: scale(0.95); }
  .mic-btn.active {
    background: linear-gradient(135deg, #c0392b, #e74c3c); border-color: #c0392b;
    animation: gentlePulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 0 8px rgba(192,57,43,0.15);
  }

  /* ─── Modal (bottom sheet) ─── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
  }
  .modal-backdrop {
    position: absolute; inset: 0; background: rgba(90,62,34,0.35);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  }
  .modal-sheet {
    position: relative; background: var(--card);
    border-radius: 20px 20px 0 0; width: 100%; max-width: 520px;
    max-height: 90vh;
    overflow-y: auto; -webkit-overflow-scrolling: touch;
    padding: 16px 20px 24px;
    animation: sheetUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 -4px 40px rgba(139,109,71,0.15);
  }
  @keyframes sheetUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .modal-handle {
    width: 36px; height: 4px; border-radius: 2px; background: #ddd;
    margin: 0 auto 14px;
  }
  .modal-title {
    font-family: var(--display); font-size: 24px; font-weight: 700;
    color: var(--text); margin-bottom: 14px;
  }

  /* ─── Scrollbar ─── */
  ::-webkit-scrollbar { width: 0; height: 0; }

  /* ─── Disable hover on touch ─── */
  @media (hover: none) {
    .cozy-btn.primary:hover { transform: none; box-shadow: 0 2px 8px rgba(168,120,78,0.25); }
    .cozy-btn.secondary:hover { background: var(--card); }
    .add-method-btn:hover { border-color: #e0cdb5; border-style: dashed; background: var(--card); transform: none; box-shadow: none; }
    .filter-chip:hover { border-color: #e0cdb5; }
    .quick-chip:hover { border-color: #e0cdb5; background: var(--card); }
    .item-row:hover { background: transparent; }
    .meal-cell:hover { border-color: #e8dcc8; border-style: dashed; }
  }
`;
