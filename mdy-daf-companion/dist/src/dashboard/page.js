export function renderDashboardPage(options) {
    const current = options.currentShiur;
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MDY Daf Companion Dashboard</title>
  <style>
    :root {
      --ink: #18232F;
      --muted: #52606D;
      --paper: #EEF2F0;
      --surface: #FFFFFF;
      --surface-soft: #F8FAF8;
      --border: #C9D2CB;
      --blue: #2563EB;
      --green: #168A5B;
      --gold: #B7791F;
      --shadow: 0 16px 38px rgba(24, 35, 47, 0.12);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--paper);
      color: var(--ink);
    }
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 32px;
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 28px;
      line-height: 1.12;
      margin: 0 0 4px;
    }
    h2 {
      font-size: 15px;
      margin: 0 0 12px;
      color: var(--muted);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: #F6E7C1;
      color: #76520C;
      font-size: 13px;
      font-weight: 750;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
      gap: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 16px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      box-shadow: 0 1px 0 rgba(24, 35, 47, 0.04);
    }
    .hero-card {
      min-height: 220px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow);
    }
    .metric {
      font-size: 34px;
      line-height: 1;
      font-weight: 800;
      margin: 4px 0 8px;
    }
    .muted {
      color: var(--muted);
      font-size: 14px;
      line-height: 1.45;
    }
    .shiur-title {
      font-size: 22px;
      line-height: 1.25;
      font-weight: 800;
      margin-bottom: 8px;
      overflow-wrap: anywhere;
    }
    .progress {
      width: 100%;
      height: 14px;
      accent-color: var(--green);
    }
    .accent-green { border-top: 4px solid var(--green); }
    .accent-blue { border-top: 4px solid var(--blue); }
    .accent-gold { border-top: 4px solid var(--gold); }
    a.button {
      display: inline-flex;
      align-items: center;
      height: 34px;
      padding: 0 12px;
      border-radius: 6px;
      background: var(--blue);
      color: white;
      text-decoration: none;
      font-weight: 650;
    }
    .side-stack {
      display: grid;
      gap: 16px;
    }
    .command-row {
      display: grid;
      gap: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px;
      color: var(--ink);
    }
    code {
      background: var(--surface-soft);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 8px;
      overflow-wrap: anywhere;
    }
    @media (max-width: 860px) {
      header {
        align-items: flex-start;
        flex-direction: column;
      }
      .layout {
        grid-template-columns: 1fr;
      }
      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>MDY Daf Companion</h1>
        <span class="status-pill">Playback ${escapeHtml(options.playbackState)}</span>
      </div>
      <a class="button" href="/player?token=${encodeURIComponent(options.token)}">Open Player</a>
    </header>

    <section class="layout">
      <div>
        <section class="card hero-card accent-green">
          <div>
            <h2>Current Shiur</h2>
            ${current
        ? `<div class="shiur-title">${escapeHtml(current.title)}</div>
                   <p class="muted">${escapeHtml(current.masechta || "")} ${current.daf || ""} · ${Math.round(current.completionPercent)}% watched</p>`
        : `<div class="shiur-title">No shiur prepared</div>
                   <p class="muted">Run the prepare command to load today’s shiur.</p>`}
          </div>
          <progress class="progress" value="${current?.completionPercent || 0}" max="100" aria-label="Current shiur progress"></progress>
        </section>

        <section class="grid" aria-label="Stats">
          ${metric("Watched Today", `${options.stats.today.watchedMinutes}m`, "Learning time tracked today", "accent-green")}
          ${metric("Coding Today", `${options.stats.today.codingMinutes}m`, "Claude Code active time today", "accent-blue")}
          ${metric("Week Watched", `${options.stats.week.watchedMinutes}m`, "Learning time over the last seven days", "accent-gold")}
          ${metric("Dafim Completed", `${options.stats.week.dafimCompleted}`, "Completed this week", "accent-green")}
        </section>
      </div>

      <aside class="side-stack">
        <section class="card accent-blue">
          <h2>Controls</h2>
          <div class="command-row">
            <code>mdy-daf prepare</code>
            <code>mdy-daf open-player</code>
            <code>mdy-daf stats</code>
          </div>
        </section>
        <section class="card accent-gold">
          <h2>Catch-Up</h2>
          <div class="metric">0</div>
          <p class="muted">Tracked missed dafim</p>
        </section>
      </aside>
    </section>
  </main>
</body>
</html>`;
}
function metric(label, value, caption, className) {
    return `<article class="card ${className}"><h2>${escapeHtml(label)}</h2><div class="metric">${escapeHtml(value)}</div><div class="muted">${escapeHtml(caption)}</div></article>`;
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
