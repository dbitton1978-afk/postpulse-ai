:root {
  color-scheme: dark;
  --bg: #0b0f14;
  --bg2: #121923;
  --card: rgba(20, 26, 36, 0.78);
  --card-border: rgba(255, 255, 255, 0.08);
  --text: #f3f7fb;
  --muted: #9fb0c3;
  --primary: #00ffcc;
  --primary-dark: #00d7ac;
  --danger: #ff6b6b;
  --shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  --radius: 22px;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(0, 255, 204, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(0, 153, 255, 0.12), transparent 25%),
    linear-gradient(180deg, var(--bg), var(--bg2));
  color: var(--text);
  font-family: Inter, Arial, Helvetica, sans-serif;
}

body {
  min-height: 100vh;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.app-shell {
  position: relative;
  z-index: 2;
  max-width: 1380px;
  margin: 0 auto;
  padding: 34px 20px 60px;
}

.bg-orb {
  position: fixed;
  z-index: 0;
  border-radius: 999px;
  filter: blur(70px);
  opacity: 0.25;
  pointer-events: none;
}

.orb-1 {
  width: 280px;
  height: 280px;
  background: #00ffcc;
  top: 70px;
  left: -80px;
}

.orb-2 {
  width: 260px;
  height: 260px;
  background: #2d7cff;
  top: 180px;
  right: -70px;
}

.orb-3 {
  width: 220px;
  height: 220px;
  background: #8f5bff;
  bottom: 40px;
  left: 20%;
}

.glass {
  background: var(--card);
  border: 1px solid var(--card-border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 22px;
}

.hero-copy {
  max-width: 760px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
  border-radius: 999px;
  border: 1px solid rgba(0, 255, 204, 0.24);
  background: rgba(0, 255, 204, 0.08);
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0 0 10px;
  font-size: clamp(34px, 5vw, 58px);
  line-height: 1;
  letter-spacing: -0.03em;
}

.hero p {
  margin: 0;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.6;
}

.lang-switch {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
}

.lang-switch button,
.tabs button,
.copy-btn,
.primary-btn {
  border: 0;
  cursor: pointer;
  transition: 0.2s ease;
}

.lang-switch button {
  min-width: 90px;
  padding: 10px 14px;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  font-weight: 700;
}

.lang-switch button.active {
  background: rgba(0, 255, 204, 0.14);
  color: var(--text);
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.tabs button {
  padding: 12px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--muted);
  border: 1px solid var(--card-border);
  font-weight: 700;
}

.tabs button.active {
  background: linear-gradient(135deg, rgba(0, 255, 204, 0.18), rgba(45, 124, 255, 0.16));
  color: var(--text);
  border-color: rgba(0, 255, 204, 0.28);
}

.layout {
  display: grid;
  grid-template-columns: 460px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
}

.panel {
  border-radius: var(--radius);
  padding: 22px;
}

.panel-title {
  margin-bottom: 18px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  border-radius: 16px;
  padding: 14px 16px;
  outline: none;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #7f90a3;
}

.field input:focus,
.field textarea:focus,
.field select:focus {
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 0 0 4px rgba(0, 255, 204, 0.08);
}

textarea {
  resize: vertical;
  min-height: 120px;
}

select {
  appearance: none;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.primary-btn {
  width: 100%;
  padding: 15px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), #59ffd9);
  color: #03120f;
  font-size: 15px;
  font-weight: 800;
}

.primary-btn:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #59ffd9, var(--primary));
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.error-box {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 107, 107, 0.12);
  border: 1px solid rgba(255, 107, 107, 0.2);
  color: #ffd1d1;
  font-weight: 700;
}

.empty-state {
  min-height: 360px;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  color: var(--muted);
  font-size: 18px;
  text-align: center;
  padding: 24px;
}

.result-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-section {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.copy-btn {
  padding: 9px 12px;
  border-radius: 12px;
  background: rgba(0, 255, 204, 0.08);
  color: var(--primary);
  border: 1px solid rgba(0, 255, 204, 0.15);
  font-size: 13px;
  font-weight: 700;
}

.text-card {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  color: var(--text);
  font-size: 15px;
}

.result-list {
  margin: 0;
  padding-inline-start: 18px;
  color: var(--text);
}

.result-list li {
  margin-bottom: 10px;
  line-height: 1.7;
  color: var(--text);
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hashtags span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(45, 124, 255, 0.14);
  border: 1px solid rgba(45, 124, 255, 0.22);
  color: #cfe2ff;
  font-size: 14px;
  font-weight: 700;
}

.scores-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.score-card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.score-value {
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
  color: var(--primary);
  margin-bottom: 8px;
}

.score-label {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .empty-state {
    min-height: 220px;
  }
}

@media (max-width: 720px) {
  .app-shell {
    padding: 20px 14px 40px;
  }

  .hero {
    flex-direction: column;
  }

  .lang-switch {
    width: 100%;
  }

  .lang-switch button {
    flex: 1;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .scores-grid {
    grid-template-columns: 1fr 1fr;
  }

  .panel {
    padding: 16px;
    border-radius: 18px;
  }
}

@media (max-width: 520px) {
  .scores-grid {
    grid-template-columns: 1fr;
  }

  .tabs button {
    flex: 1 1 100%;
  }
}
