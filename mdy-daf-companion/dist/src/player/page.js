export function renderPlayerPage(options) {
    const videoId = escapeHtml(options.videoId || "");
    const title = escapeHtml(options.title || "MDY Daf Companion");
    const sourceUrl = escapeHtml(options.sourceUrl || "");
    const token = escapeHtml(options.token);
    const playbackState = escapeHtml(options.playbackState);
    const initialPositionSeconds = Math.max(0, options.initialPositionSeconds || 0);
    const completionPercent = Math.max(0, Math.min(100, options.completionPercent || 0));
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MDY Daf Companion</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1F2933;
      --paper: #F7F7F2;
      --surface: #FFFFFF;
      --border: #D6D3C8;
      --blue: #2563EB;
      --green: #168A5B;
      --gold: #B7791F;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
    }
    main {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr auto;
    }
    header, footer {
      padding: 12px 14px;
      border-color: var(--border);
      background: var(--surface);
    }
    header {
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    footer {
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }
    #state {
      font-size: 13px;
      color: var(--gold);
    }
    #player {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #111827;
    }
    button {
      min-width: 38px;
      height: 34px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
      color: var(--ink);
      cursor: pointer;
      font-size: 15px;
    }
    button:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--blue), transparent 70%);
      outline-offset: 2px;
    }
    progress {
      width: 100%;
      height: 10px;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${title}</h1>
      <span id="state">${playbackState}</span>
    </header>
    <section id="player" aria-label="YouTube shiur player"></section>
    <footer>
      <button id="play" title="Play" aria-label="Play">▶</button>
      <button id="pause" title="Pause" aria-label="Pause">Ⅱ</button>
      <button id="back" title="Back 30 seconds" aria-label="Back 30 seconds">-30</button>
      <button id="forward" title="Forward 30 seconds" aria-label="Forward 30 seconds">+30</button>
      <button id="watched" title="Mark watched" aria-label="Mark watched">✓</button>
      <progress id="progress" value="${completionPercent}" max="100" aria-label="Watch progress"></progress>
      ${sourceUrl ? `<a href="${sourceUrl}" target="_blank" rel="noreferrer">YouTube</a>` : ""}
    </footer>
  </main>
  <script>
    const MDY_DAF = {
      token: "${token}",
      videoId: "${videoId}",
      initialPositionSeconds: ${initialPositionSeconds},
      player: null,
      lastSent: 0
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
          }
        }
      });
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
      MDY_DAF.player?.playVideo?.();
      fetch("/play", { method: "POST", headers: { authorization: "Bearer " + MDY_DAF.token } }).catch(() => {});
    });
    document.getElementById("pause").addEventListener("click", () => {
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
    window.setInterval(() => sendProgress(false), 5000);
    window.addEventListener("beforeunload", () => sendProgress(true));
  </script>
</body>
</html>`;
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
