import type { PlaybackState } from "../daemon/protocol.js";

export interface PlayerPageOptions {
  token: string;
  videoId: string | null;
  title?: string | null;
  sourceUrl?: string | null;
  initialPositionSeconds?: number;
  completionPercent?: number;
  playbackState: PlaybackState;
}

export function renderPlayerPage(options: PlayerPageOptions): string {
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
    .source-link {
      white-space: nowrap;
      color: var(--blue);
      font-weight: 750;
      text-decoration: none;
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
  </style>
</head>
<body>
  <main>
    <header>
      <div class="title-block">
        <div class="eyebrow">Now Learning</div>
        <h1>${title}</h1>
      </div>
      <span id="state">${playbackState}</span>
    </header>
    <section class="video-shell">
      <div class="video-frame">
        <div id="player" aria-label="YouTube shiur player"></div>
      </div>
    </section>
    <footer>
      <button id="play" title="Play" aria-label="Play">▶</button>
      <button id="pause" title="Pause" aria-label="Pause">Ⅱ</button>
      <button id="back" title="Back 30 seconds" aria-label="Back 30 seconds">-30</button>
      <button id="forward" title="Forward 30 seconds" aria-label="Forward 30 seconds">+30</button>
      <button id="watched" title="Mark watched" aria-label="Mark watched">✓</button>
      <progress id="progress" value="${completionPercent}" max="100" aria-label="Watch progress"></progress>
      ${sourceUrl ? `<a class="source-link" href="${sourceUrl}" target="_blank" rel="noreferrer">YouTube</a>` : ""}
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
