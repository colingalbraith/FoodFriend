export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Caveat:wght@500;600;700&display=swap');

  :root {
    --bg: linear-gradient(160deg, #fdf6ec 0%, #f5ebe0 50%, #faf0e4 100%);
    --card: #fffaf3;
    --border: #e8d5b7;
    --text: #5a3e22;
    --muted: #a8906f;
    --accent: #c4956a;
    --display: 'Caveat', cursive;
    --body: 'Nunito', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.9); }
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
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: 200px 0; }
  }
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-2deg); }
    75% { transform: rotate(2deg); }
  }

  .cozy-input {
    font-family: var(--body); font-size: 14px; padding: 10px 14px; border-radius: 12px;
    border: 2px solid #e0cdb5; background: #fffdf8; color: var(--text); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
  }
  .cozy-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(196,149,106,0.15); }
  .cozy-input::placeholder { color: #c4a882; }

  .cozy-btn {
    font-family: var(--body); font-weight: 700; font-size: 13px; padding: 10px 18px;
    border-radius: 12px; border: 2px solid transparent; cursor: pointer;
    transition: all 0.2s; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
  }
  .cozy-btn:active { transform: scale(0.97); }
  .cozy-btn.primary { background: linear-gradient(135deg, #c4956a, #a8784e); color: white; box-shadow: 0 2px 8px rgba(168,120,78,0.25); }
  .cozy-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(168,120,78,0.35); }
  .cozy-btn.primary:active { transform: translateY(0) scale(0.97); }
  .cozy-btn.primary:disabled { opacity: 0.6; cursor: default; transform: none; }
  .cozy-btn.secondary { background: var(--card); color: #8b6d47; border-color: #e0cdb5; }
  .cozy-btn.secondary:hover { background: #f5ebe0; }
  .cozy-btn.danger { background: #fde8e8; color: #c0392b; border-color: #f5c6c6; }
  .cozy-btn.full { width: 100%; justify-content: center; }

  .tab-btn {
    font-family: var(--body); font-weight: 700; font-size: 13px; padding: 9px 14px;
    border-radius: 12px; border: none; cursor: pointer; transition: all 0.25s ease;
    background: transparent; color: var(--muted); display: flex; align-items: center;
    gap: 5px; flex: 1; justify-content: center;
  }
  .tab-btn:hover { background: rgba(196,149,106,0.1); }
  .tab-btn.active {
    background: var(--card); color: var(--text);
    box-shadow: 0 1px 6px rgba(139,109,71,0.1);
  }

  .add-method-btn {
    font-family: var(--body); display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; padding: 14px 8px; border-radius: 14px; border: 2px dashed #e0cdb5;
    background: var(--card); color: var(--muted); cursor: pointer; transition: all 0.25s ease;
  }
  .add-method-btn:hover { border-color: var(--accent); border-style: solid; background: #fef8f0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139,109,71,0.08); }
  .add-method-btn:active { transform: translateY(0) scale(0.97); }

  .filter-chip {
    font-family: var(--body); font-size: 11px; font-weight: 700; padding: 5px 10px;
    border-radius: 20px; border: 1.5px solid #e0cdb5; background: var(--card);
    color: var(--muted); cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
  }
  .filter-chip:hover { border-color: var(--accent); }
  .filter-chip.active { background: linear-gradient(135deg, #c4956a, #a8784e); color: white; border-color: transparent; }

  .quick-chip {
    font-family: var(--body); font-size: 12px; font-weight: 600; padding: 6px 12px;
    border-radius: 10px; border: 1.5px solid #e0cdb5; background: var(--card);
    color: var(--text); cursor: pointer; transition: all 0.2s ease;
  }
  .quick-chip:hover { border-color: var(--accent); background: #fef8f0; }
  .quick-chip.added { background: #edf5ed; border-color: #b8d4b8; color: #4a7a4a; }
  .quick-chip:disabled { cursor: default; }

  .item-row {
    display: flex; align-items: center; gap: 10px; padding: 11px 14px;
    border-radius: 12px; transition: all 0.2s ease; cursor: pointer;
  }
  .item-row:hover { background: rgba(228,213,183,0.2); }

  .shopping-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 14px;
    border-radius: 12px; transition: all 0.2s;
  }

  .swipe-action {
    font-family: var(--body); font-weight: 700; font-size: 12px; border: none;
    cursor: pointer; padding: 0 16px; display: flex; align-items: center;
  }
  .swipe-action.use { background: #6b8e6b; color: white; }
  .swipe-action.toss { background: #c0392b; color: white; border-radius: 0 12px 12px 0; }

  .meal-cell {
    background: #fffdf8; border: 2px dashed #e8dcc8; border-radius: 10px;
    padding: 8px; min-height: 70px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; text-align: center;
    font-size: 12px;
  }
  .meal-cell:hover { border-color: var(--accent); border-style: solid; }
  .meal-cell.filled { border-style: solid; border-color: #d4b896; }

  .mic-btn {
    width: 72px; height: 72px; border-radius: 50%; border: 3px solid var(--accent);
    background: var(--card); font-size: 28px; cursor: pointer; transition: all 0.3s;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .mic-btn:hover { transform: scale(1.05); }
  .mic-btn.active {
    background: linear-gradient(135deg, #c0392b, #e74c3c); border-color: #c0392b;
    animation: gentlePulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 0 8px rgba(192,57,43,0.15);
  }

  /* Loading dots animation */
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

  /* Category dot */
  .cat-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d4c0a8; border-radius: 3px; }

  @media (max-width: 400px) {
    .tab-label { display: none; }
    .tab-btn { padding: 10px; }
  }
`;
