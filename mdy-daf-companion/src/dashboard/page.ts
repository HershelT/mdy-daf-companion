import type { CurrentShiurStatus, PlaybackState } from "../daemon/protocol.js";
import type { StatsDashboardSummary } from "../stats/summary.js";

export interface DashboardPageOptions {
  token: string;
  playbackState: PlaybackState;
  currentShiur: CurrentShiurStatus | null;
  stats: StatsDashboardSummary;
}

export function renderDashboardPage(options: DashboardPageOptions): string {
  const current = options.currentShiur;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MDY Daf Companion Dashboard</title>
  <style>
    :root {
      --ink: #1F2933;
      --paper: #F7F7F2;
      --surface: #FFFFFF;
      --border: #D6D3C8;
      --blue: #2563EB;
      --green: #168A5B;
      --gold: #B7791F;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body { margin: 0; background: var(--paper); color: var(--ink); }
    main { max-width: 1040px; margin: 0 auto; padding: 24px; }
    header { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 22px; }
    h1 { font-size: 24px; margin: 0; }
    h2 { font-size: 16px; margin: 0 0 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
    .metric { font-size: 30px; font-weight: 750; margin: 4px 0; }
    .muted { color: #52606D; font-size: 13px; }
    .progress { width: 100%; height: 12px; }
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
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>MDY Daf Companion</h1>
        <div class="muted">Playback is ${escapeHtml(options.playbackState)}</div>
      </div>
      <a class="button" href="/player?token=${encodeURIComponent(options.token)}">Open Player</a>
    </header>

    <section class="card">
      <h2>Current Shiur</h2>
      ${
        current
          ? `<strong>${escapeHtml(current.title)}</strong>
             <p class="muted">${escapeHtml(current.masechta || "")} ${current.daf || ""} · ${Math.round(current.completionPercent)}% watched</p>
             <progress class="progress" value="${current.completionPercent}" max="100"></progress>`
          : `<p class="muted">No shiur resolved yet. Run <code>mdy-daf prepare</code>.</p>`
      }
    </section>

    <section class="grid" aria-label="Stats">
      ${metric("Watched Today", `${options.stats.today.watchedMinutes}m`, "Learning time tracked today")}
      ${metric("Coding Today", `${options.stats.today.codingMinutes}m`, "Claude Code active time today")}
      ${metric("Week Watched", `${options.stats.week.watchedMinutes}m`, "Learning time over the last seven days")}
      ${metric("Dafim Completed", `${options.stats.week.dafimCompleted}`, "Completed this week")}
    </section>

    <section class="card">
      <h2>Catch-Up</h2>
      <p class="muted">Catch-up planning will use unresolved prior dafim once more calendar history is collected.</p>
    </section>
  </main>
</body>
</html>`;
}

function metric(label: string, value: string, caption: string): string {
  return `<article class="card"><h2>${escapeHtml(label)}</h2><div class="metric">${escapeHtml(value)}</div><div class="muted">${escapeHtml(caption)}</div></article>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

