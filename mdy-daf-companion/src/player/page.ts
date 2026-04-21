import type { PlaybackState } from "../daemon/protocol.js";

export interface PlayerPageOptions {
  token: string;
  videoId: string | null;
  title?: string | null;
  initialPositionSeconds?: number;
  completionPercent?: number;
  playbackState: PlaybackState;
  companionMode?: boolean;
}

export function renderPlayerPage(options: PlayerPageOptions): string {
  const rawVideoId = options.videoId || "";
  const videoId = escapeHtml(rawVideoId);
  const title = escapeHtml(options.title || "MDY Daf Companion");
  const token = escapeHtml(options.token);
  const playbackState = escapeHtml(options.playbackState);
  const initialPositionSeconds = Math.max(0, options.initialPositionSeconds || 0);
  const completionPercent = Math.max(0, Math.min(100, options.completionPercent || 0));
  const companionMode = Boolean(options.companionMode);
  const autoplay = options.playbackState === "playing" ? "&autoplay=1" : "";
  const embedUrl = rawVideoId
    ? escapeHtml(`https://www.youtube.com/embed/${encodeURIComponent(rawVideoId)}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1${autoplay}`)
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MDY Daf Companion</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #18232F;
      --muted: #52606D;
      --paper: #EEF2F0;
      --surface: #FFFFFF;
      --surface-soft: #F8FAF8;
      --border: #C9D2CB;
      --blue: #2563EB;
      --green: #168A5B;
      --gold: #B7791F;
      --shadow: 0 16px 38px rgba(24, 35, 47, 0.16);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
    }
    main {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto auto auto;
      align-content: start;
    }
    header {
      padding: 16px 20px;
      border-color: var(--border);
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    .title-block {
      min-width: 0;
    }
    .window-actions {
      display: none;
      align-items: center;
      gap: 6px;
      -webkit-app-region: no-drag;
    }
    .window-actions button {
      min-width: 30px;
      width: 30px;
      height: 30px;
      padding: 0;
      font-size: 13px;
    }
    .eyebrow {
      color: var(--green);
      font-size: 12px;
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: 0;
      margin-bottom: 4px;
    }
    footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--surface);
    }
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    #state {
      font-size: 13px;
      color: var(--surface);
      background: var(--gold);
      border-radius: 999px;
      padding: 6px 10px;
      white-space: nowrap;
      font-weight: 700;
    }
    .video-shell {
      min-height: 0;
      padding: 14px 16px;
      display: grid;
      place-items: center;
    }
    .video-frame {
      width: min(100%, 1280px, calc((100vh - 180px) * 16 / 9));
      aspect-ratio: 16 / 9;
      background: #111827;
      border: 1px solid #111827;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    .video-frame > #player,
    .video-frame iframe {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
    .empty-player {
      height: 100%;
      display: grid;
      place-items: center;
      color: #FFFFFF;
      padding: 18px;
      text-align: center;
      font-weight: 700;
      background: #172033;
    }
    .dashboard-view {
      display: none;
    }
    .dashboard-panel {
      color: #FFFFFF;
    }
    .dashboard-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .dashboard-head h2 {
      margin: 0;
      font-size: 15px;
    }
    .dashboard-card {
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.08));
      border-radius: 8px;
      padding: 12px;
      min-width: 0;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
    }
    .dashboard-card[data-accent="green"] {
      border-top: 3px solid #19A974;
    }
    .dashboard-card[data-accent="blue"] {
      border-top: 3px solid #60A5FA;
    }
    .dashboard-card[data-accent="gold"] {
      border-top: 3px solid #D6A23A;
    }
    .dashboard-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .dashboard-value {
      margin-top: 4px;
      color: #FFFFFF;
      font-size: 22px;
      line-height: 1;
      font-weight: 850;
    }
    .dashboard-caption {
      margin-top: 6px;
      color: rgba(255, 255, 255, 0.64);
      font-size: 11px;
      line-height: 1.3;
    }
    .dashboard-title {
      overflow-wrap: anywhere;
      line-height: 1.25;
      font-weight: 800;
    }
    .dashboard-progress {
      width: 100%;
      height: 7px;
      margin-top: 10px;
      border-radius: 999px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.14);
    }
    .dashboard-progress span {
      display: block;
      height: 100%;
      width: var(--pct, 0%);
      background: linear-gradient(90deg, #19A974, #60A5FA);
    }
    button {
      min-width: 42px;
      height: 40px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
      color: var(--ink);
      cursor: pointer;
      font-size: 14px;
      font-weight: 750;
    }
    #play {
      color: #FFFFFF;
      background: var(--green);
      border-color: var(--green);
    }
    #pause {
      color: #FFFFFF;
      background: var(--blue);
      border-color: var(--blue);
    }
    button:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--blue), transparent 70%);
      outline-offset: 2px;
    }
    progress {
      width: 100%;
      min-width: 180px;
      height: 12px;
      accent-color: var(--green);
    }
    @media (max-width: 720px) {
      header {
        align-items: flex-start;
        flex-direction: column;
      }
      footer {
        flex-wrap: wrap;
      }
      progress {
        order: 10;
        width: 100%;
      }
      .video-shell {
        padding: 10px;
      }
      .video-frame {
        width: 100%;
      }
    }
    body.companion {
      overflow: hidden;
      background: #05070A;
    }
    body.companion main {
      height: 100vh;
      min-height: 100vh;
      display: block;
      position: relative;
      background: #05070A;
    }
    body.companion header {
      position: absolute;
      z-index: 20;
      top: 0;
      left: 0;
      right: 0;
      min-height: 48px;
      padding: 8px 10px;
      gap: 8px;
      -webkit-app-region: drag;
      border-bottom: 0;
      background: linear-gradient(180deg, rgba(5, 7, 10, 0.88), rgba(5, 7, 10, 0));
      color: #FFFFFF;
      opacity: 0;
      transition: opacity 140ms ease;
      cursor: move;
    }
    body.companion .title-block {
      flex: 1 1 auto;
    }
    body.companion .eyebrow {
      font-size: 10px;
      margin-bottom: 2px;
    }
    body.companion h1 {
      font-size: 13px;
      line-height: 1.2;
      color: #FFFFFF;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    body.companion #state {
      font-size: 11px;
      padding: 4px 7px;
      -webkit-app-region: no-drag;
    }
    body.companion .window-actions {
      display: flex;
    }
    body.companion .video-shell {
      position: absolute;
      inset: 0;
      padding: 0;
      display: block;
    }
    body.companion .video-frame {
      width: 100%;
      height: 100%;
      max-height: none;
      aspect-ratio: auto;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
    body.companion .dashboard-view {
      position: absolute;
      z-index: 14;
      inset: 0;
      overflow: auto;
      padding: 54px 12px 66px;
      background: radial-gradient(circle at top left, rgba(22, 138, 91, 0.22), transparent 34%),
        linear-gradient(135deg, rgba(8, 13, 20, 0.98), rgba(15, 23, 42, 0.98));
    }
    body.companion.dashboard-open .dashboard-view {
      display: block;
    }
    body.companion.dashboard-open .video-shell {
      display: none;
    }
    body.companion .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }
    body.companion .dashboard-card.current {
      grid-column: 1 / -1;
    }
    body.companion footer {
      position: absolute;
      z-index: 20;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 26px 10px 9px;
      gap: 7px;
      flex-wrap: wrap;
      border-top: 0;
      background: linear-gradient(0deg, rgba(5, 7, 10, 0.9), rgba(5, 7, 10, 0));
      opacity: 0;
      transition: opacity 140ms ease;
    }
    body.companion footer button {
      min-width: 36px;
      height: 34px;
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.36);
      backdrop-filter: blur(10px);
    }
    body.companion footer #play {
      background: rgba(22, 138, 91, 0.9);
      border-color: rgba(22, 138, 91, 0.9);
    }
    body.companion footer #pause {
      background: rgba(37, 99, 235, 0.9);
      border-color: rgba(37, 99, 235, 0.9);
    }
    body.companion footer #dashboard-toggle,
    body.companion #dashboard-back {
      min-width: 52px;
      font-size: 12px;
    }
    body.companion progress {
      order: 10;
      min-width: 0;
      width: 100%;
      height: 9px;
    }
    body.companion:hover header,
    body.companion:hover footer,
    body.companion:focus-within header,
    body.companion:focus-within footer {
      opacity: 1;
    }
    body.companion::before {
      content: "";
      position: absolute;
      z-index: 30;
      top: 0;
      left: 42%;
      right: 42%;
      height: 4px;
      border-radius: 0 0 999px 999px;
      background: rgba(255, 255, 255, 0.46);
      pointer-events: none;
    }
  </style>
</head>
<body${companionMode ? ` class="companion"` : ""}>
  <main>
    <header>
      <div class="title-block">
        <div class="eyebrow">Now Learning</div>
        <h1 id="shiur-title">${title}</h1>
      </div>
      <span id="state">${playbackState}</span>
      <div class="window-actions" aria-label="Window controls">
        <button id="pin-window" title="Toggle always on top" aria-label="Toggle always on top">▲</button>
        <button id="minimize-window" title="Minimize" aria-label="Minimize">_</button>
        <button id="close-window" title="Close" aria-label="Close">×</button>
      </div>
    </header>
    <section class="video-shell">
      <div class="video-frame">
        ${
          embedUrl
            ? `<iframe id="player" aria-label="YouTube shiur player" src="${embedUrl}" title="${title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
            : `<div id="player" class="empty-player" aria-label="YouTube shiur player">No shiur loaded yet</div>`
        }
      </div>
    </section>
    <section id="dashboard-view" class="dashboard-view" aria-label="MDY Daf Companion stats" hidden>
      <div class="dashboard-panel">
        <div class="dashboard-head">
          <h2>Stats</h2>
          <button id="dashboard-back" title="Back to video" aria-label="Back to video">Video</button>
        </div>
        <div id="dashboard-content" class="dashboard-grid">
          <article class="dashboard-card current">
            <div class="dashboard-label">Current Shiur</div>
            <div class="dashboard-title">Loading stats...</div>
          </article>
        </div>
      </div>
    </section>
    <footer>
      <button id="play" title="Play" aria-label="Play">▶</button>
      <button id="pause" title="Pause" aria-label="Pause">Ⅱ</button>
      <button id="back" title="Back 30 seconds" aria-label="Back 30 seconds">-30</button>
      <button id="forward" title="Forward 30 seconds" aria-label="Forward 30 seconds">+30</button>
      <button id="watched" title="Mark watched" aria-label="Mark watched">✓</button>
      <button id="dashboard-toggle" title="Show stats" aria-label="Show stats">Stats</button>
      <progress id="progress" value="${completionPercent}" max="100" aria-label="Watch progress"></progress>
    </footer>
  </main>
  <script>
    const MDY_DAF = {
      token: "${token}",
      videoId: "${videoId}",
      initialPositionSeconds: ${initialPositionSeconds},
      desiredPlaybackState: "${playbackState}",
      player: null,
      lastSent: 0,
      lastStatusPoll: 0
    };
  </script>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    function onYouTubeIframeAPIReady() {
      if (!MDY_DAF.videoId) return;
      MDY_DAF.player = new YT.Player("player", {
        videoId: MDY_DAF.videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: () => sendProgress()
          ,
          onReady: () => {
            if (MDY_DAF.initialPositionSeconds > 0) {
              MDY_DAF.player.seekTo(MDY_DAF.initialPositionSeconds, true);
            }
            applyDesiredPlaybackState();
          }
        }
      });
    }

    function setStateLabel(state) {
      document.getElementById("state").textContent = state || "idle";
    }

    function updateCurrentShiur(shiur) {
      if (!shiur) return;
      document.getElementById("shiur-title").textContent = shiur.title || "MDY Daf Companion";
      if (typeof shiur.completionPercent === "number") {
        document.getElementById("progress").value = Math.max(0, Math.min(100, shiur.completionPercent));
      }
      if (shiur.videoId && shiur.videoId !== MDY_DAF.videoId) {
        MDY_DAF.videoId = shiur.videoId;
        MDY_DAF.initialPositionSeconds = Math.max(0, shiur.positionSeconds || 0);
        if (MDY_DAF.player?.cueVideoById) {
          MDY_DAF.player.cueVideoById({
            videoId: shiur.videoId,
            startSeconds: MDY_DAF.initialPositionSeconds
          });
        }
      }
    }

    function applyDesiredPlaybackState() {
      if (!MDY_DAF.player) return;
      const playerState = typeof MDY_DAF.player.getPlayerState === "function"
        ? MDY_DAF.player.getPlayerState()
        : null;
      if (MDY_DAF.desiredPlaybackState === "playing") {
        if (playerState !== 1) {
          MDY_DAF.player.playVideo?.();
        }
        return;
      }
      if (MDY_DAF.desiredPlaybackState === "paused" || MDY_DAF.desiredPlaybackState === "blocked" || MDY_DAF.desiredPlaybackState === "idle") {
        if (playerState === 1 || playerState === 3) {
          MDY_DAF.player.pauseVideo?.();
          sendProgress(true);
        }
      }
    }

    async function pollDaemonStatus() {
      const now = Date.now();
      if (now - MDY_DAF.lastStatusPoll < 1500) return;
      MDY_DAF.lastStatusPoll = now;
      const response = await fetch("/status", {
        headers: { authorization: "Bearer " + MDY_DAF.token }
      }).catch(() => null);
      if (!response?.ok) return;
      const status = await response.json().catch(() => null);
      if (!status?.ok) return;
      MDY_DAF.desiredPlaybackState = status.playbackState || "idle";
      setStateLabel(MDY_DAF.desiredPlaybackState);
      updateCurrentShiur(status.currentShiur);
      applyDesiredPlaybackState();
    }

    function addText(parent, className, value) {
      const node = document.createElement("div");
      node.className = className;
      node.textContent = value;
      parent.appendChild(node);
      return node;
    }

    function statCard(label, value, caption, accent) {
      const card = document.createElement("article");
      card.className = "dashboard-card";
      if (accent) {
        card.dataset.accent = accent;
      }
      addText(card, "dashboard-label", label);
      addText(card, "dashboard-value", value);
      if (caption) {
        addText(card, "dashboard-caption", caption);
      }
      return card;
    }

    function renderDashboard(data) {
      const content = document.getElementById("dashboard-content");
      if (!content) return;
      content.textContent = "";
      const current = document.createElement("article");
      current.className = "dashboard-card current";
      current.dataset.accent = "green";
      addText(current, "dashboard-label", "Current Shiur");
      addText(current, "dashboard-title", data?.currentShiur?.title || "No shiur prepared");
      const pct = Math.max(0, Math.min(100, data?.currentShiur?.completionPercent || 0));
      const progress = document.createElement("div");
      progress.className = "dashboard-progress";
      const progressFill = document.createElement("span");
      progressFill.style.setProperty("--pct", pct + "%");
      progress.appendChild(progressFill);
      current.appendChild(progress);
      addText(current, "dashboard-caption", Math.round(pct) + "% watched");
      content.appendChild(current);
      const today = data?.stats?.today || {};
      const week = data?.stats?.week || {};
      const ratio = typeof today.watchToCodingRatio === "number"
        ? Math.round(today.watchToCodingRatio * 100) + "%"
        : "n/a";
      content.appendChild(statCard("Watched Today", (today.watchedMinutes || 0) + "m", "learning time", "green"));
      content.appendChild(statCard("Coding Today", (today.codingMinutes || 0) + "m", "Claude active time", "blue"));
      content.appendChild(statCard("Watch Ratio", ratio, "watched vs coding", "gold"));
      content.appendChild(statCard("Dafim Done", String(week.dafimCompleted || 0), "this week", "green"));
    }

    async function loadDashboard() {
      const response = await fetch("/api/dashboard", {
        headers: { authorization: "Bearer " + MDY_DAF.token }
      }).catch(() => null);
      if (!response?.ok) return;
      const data = await response.json().catch(() => null);
      if (data?.ok) {
        renderDashboard(data);
      }
    }

    function setDashboardOpen(open) {
      document.body.classList.toggle("dashboard-open", open);
      const view = document.getElementById("dashboard-view");
      if (view) {
        view.hidden = !open;
      }
      const toggle = document.getElementById("dashboard-toggle");
      if (toggle) {
        toggle.textContent = open ? "Video" : "Stats";
        toggle.setAttribute("aria-label", open ? "Back to video" : "Show stats");
      }
      if (open) {
        loadDashboard();
      }
    }

    async function sendProgress(force = false) {
      if (!MDY_DAF.player || typeof MDY_DAF.player.getCurrentTime !== "function") return;
      const now = Date.now();
      if (!force && now - MDY_DAF.lastSent < 4000) return;
      MDY_DAF.lastSent = now;
      const positionSeconds = MDY_DAF.player.getCurrentTime() || 0;
      const durationSeconds = MDY_DAF.player.getDuration() || null;
      if (durationSeconds) {
        document.getElementById("progress").value = Math.min(100, positionSeconds / durationSeconds * 100);
      }
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": "Bearer " + MDY_DAF.token
        },
        body: JSON.stringify({
          videoId: MDY_DAF.videoId,
          positionSeconds,
          durationSeconds
        })
      }).catch(() => {});
    }

    document.getElementById("play").addEventListener("click", () => {
      MDY_DAF.desiredPlaybackState = "playing";
      setStateLabel("playing");
      MDY_DAF.player?.playVideo?.();
      fetch("/play", { method: "POST", headers: { authorization: "Bearer " + MDY_DAF.token } }).catch(() => {});
    });
    document.getElementById("pause").addEventListener("click", () => {
      MDY_DAF.desiredPlaybackState = "paused";
      setStateLabel("paused");
      MDY_DAF.player?.pauseVideo?.();
      sendProgress(true);
      fetch("/pause", { method: "POST", headers: { authorization: "Bearer " + MDY_DAF.token } }).catch(() => {});
    });
    document.getElementById("back").addEventListener("click", () => {
      if (!MDY_DAF.player) return;
      MDY_DAF.player.seekTo(Math.max(0, (MDY_DAF.player.getCurrentTime() || 0) - 30), true);
      sendProgress(true);
    });
    document.getElementById("forward").addEventListener("click", () => {
      if (!MDY_DAF.player) return;
      MDY_DAF.player.seekTo((MDY_DAF.player.getCurrentTime() || 0) + 30, true);
      sendProgress(true);
    });
    document.getElementById("watched").addEventListener("click", async () => {
      if (!MDY_DAF.player) return;
      const durationSeconds = MDY_DAF.player.getDuration() || 0;
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": "Bearer " + MDY_DAF.token
        },
        body: JSON.stringify({
          videoId: MDY_DAF.videoId,
          positionSeconds: durationSeconds,
          durationSeconds
        })
      }).catch(() => {});
      document.getElementById("progress").value = 100;
    });
    document.getElementById("dashboard-toggle")?.addEventListener("click", () => {
      setDashboardOpen(!document.body.classList.contains("dashboard-open"));
    });
    document.getElementById("dashboard-back")?.addEventListener("click", () => {
      setDashboardOpen(false);
    });
    if (window.location.hash === "#stats" || window.location.hash === "#dashboard") {
      setDashboardOpen(true);
    }
    document.getElementById("pin-window")?.addEventListener("click", async () => {
      const pinned = await window.mdyCompanion?.toggleAlwaysOnTop?.();
      const button = document.getElementById("pin-window");
      if (button && typeof pinned === "boolean") {
        button.textContent = pinned ? "▲" : "△";
      }
    });
    document.getElementById("minimize-window")?.addEventListener("click", () => {
      window.mdyCompanion?.minimize?.();
    });
    document.getElementById("close-window")?.addEventListener("click", () => {
      window.mdyCompanion?.close?.();
    });
    window.mdyCompanion?.state?.().then?.((state) => {
      const button = document.getElementById("pin-window");
      if (button && typeof state?.alwaysOnTop === "boolean") {
        button.textContent = state.alwaysOnTop ? "▲" : "△";
      }
    }).catch?.(() => {});
    window.setInterval(() => sendProgress(false), 5000);
    window.setInterval(() => pollDaemonStatus(), 1500);
    pollDaemonStatus();
    window.addEventListener("beforeunload", () => sendProgress(true));
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
