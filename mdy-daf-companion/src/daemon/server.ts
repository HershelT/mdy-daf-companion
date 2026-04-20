import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import type { RuntimePaths } from "../core/paths.js";
import { nowIso } from "../core/time.js";
import { AppDatabase } from "../storage/database.js";
import { loadConfig } from "../core/config.js";
import { civilDateInTimezone } from "../core/time.js";
import { parseHookPayload, toHookEventRecord } from "../hooks/events.js";
import type { DaemonActionResult, DaemonStatus, PlaybackState } from "./protocol.js";
import { createDaemonToken, removeDaemonState, writeDaemonState } from "./state.js";
import { renderPlayerPage } from "../player/page.js";
import { openUrl } from "../player/launcher.js";
import { HebcalDafCalendar } from "../resolver/dafCalendar.js";
import { chooseBestCandidate } from "../resolver/scoring.js";
import { createDefaultCandidateProvider } from "../resolver/defaultProvider.js";
import { storeResolvedShiur, CURRENT_SHIUR_SETTING } from "../resolver/persist.js";
import { shouldBlockAutoPlayback } from "../guard/shabbosGuard.js";

export interface DaemonServerHandle {
  server: http.Server;
  token: string;
  port: number;
  startedAt: string;
  close: () => Promise<void>;
}

interface DaemonMemoryState {
  playbackState: PlaybackState;
  lastAction: string | null;
  currentVideoId: string | null;
  activeCodingStartedAt: number | null;
  lastProgressByVideo: Map<string, number>;
  completedVideos: Set<string>;
}

async function readBody(request: IncomingMessage): Promise<string> {
  let body = "";
  request.setEncoding("utf8");
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1024 * 1024) {
      throw new Error("Request body too large");
    }
  }
  return body;
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(`${JSON.stringify(value)}\n`);
}

function authorized(request: IncomingMessage, token: string): boolean {
  return request.headers.authorization === `Bearer ${token}`;
}

export async function startDaemonServer(paths: RuntimePaths, port = 0): Promise<DaemonServerHandle> {
  const token = createDaemonToken();
  const startedAt = nowIso();
  const memory: DaemonMemoryState = {
    playbackState: "idle",
    lastAction: null,
    currentVideoId: null,
    activeCodingStartedAt: null,
    lastProgressByVideo: new Map(),
    completedVideos: new Set()
  };

  const database = new AppDatabase(paths);
  database.migrate();
  const config = loadConfig(paths);
  const today = () => civilDateInTimezone(new Date(), config.timezone);

  async function resolveAndStoreShiur(date = today()): Promise<string> {
    const daf = await new HebcalDafCalendar().getDafForDate(date);
    const candidates = await createDefaultCandidateProvider(paths, database).getCandidates(daf);
    const resolved = chooseBestCandidate(daf, candidates, {
      language: config.language,
      format: config.format
    });
    storeResolvedShiur(database, resolved);
    memory.currentVideoId = resolved.video.videoId;
    return resolved.video.videoId;
  }

  function currentShiurStatus() {
    const currentVideoId = memory.currentVideoId || database.getSetting<string>(CURRENT_SHIUR_SETTING);
    if (!currentVideoId) {
      return null;
    }
    const video = database.getVideo(currentVideoId);
    if (!video) {
      return null;
    }
    const progress = database.getPlaybackProgress(currentVideoId);
    return {
      videoId: video.videoId,
      title: video.title,
      sourceUrl: video.sourceUrl,
      masechta: video.masechta,
      daf: video.daf,
      positionSeconds: progress?.positionSeconds || 0,
      completionPercent: progress?.completionPercent || 0
    };
  }

  function markCodingActive(): void {
    memory.activeCodingStartedAt ??= Date.now();
  }

  function playerUrl(port: number): string {
    return `http://127.0.0.1:${port}/player?token=${encodeURIComponent(token)}`;
  }

  function flushCodingSeconds(): void {
    if (!memory.activeCodingStartedAt) {
      return;
    }
    const codingSeconds = Math.max(0, (Date.now() - memory.activeCodingStartedAt) / 1000);
    memory.activeCodingStartedAt = null;
    if (codingSeconds > 0) {
      database.incrementDailyStats(today(), { codingSeconds });
    }
  }

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const queryAuthorized = url.searchParams.get("token") === token;

      if (!authorized(request, token) && !queryAuthorized) {
        sendJson(response, 401, { ok: false, error: "Unauthorized" });
        return;
      }

      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, { ok: true, pid: process.pid, startedAt });
        return;
      }

      if (request.method === "GET" && url.pathname === "/player") {
        response.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        });
        response.end(
          renderPlayerPage({
            token,
            videoId: memory.currentVideoId,
            title: currentShiurStatus()?.title,
            sourceUrl: currentShiurStatus()?.sourceUrl,
            initialPositionSeconds: currentShiurStatus()?.positionSeconds,
            completionPercent: currentShiurStatus()?.completionPercent,
            playbackState: memory.playbackState
          })
        );
        return;
      }

      if (request.method === "GET" && url.pathname === "/status") {
        const status: DaemonStatus = {
          ok: true,
          pid: process.pid,
          startedAt,
          playbackState: memory.playbackState,
          lastAction: memory.lastAction,
          hookEvents: database.getHookEventCount(),
          currentShiur: currentShiurStatus()
        };
        sendJson(response, 200, status);
        return;
      }

      if (request.method === "POST" && url.pathname === "/hook") {
        const fallbackEvent = url.searchParams.get("event") || "Unknown";
        const body = await readBody(request);
        const { payload, error } = parseHookPayload(body);
        const record = toHookEventRecord(payload, fallbackEvent, error);
        database.insertHookEvent(record);
        memory.lastAction = record.actionTaken;
        const guard = shouldBlockAutoPlayback(config);
        if (record.actionTaken?.startsWith("pause")) {
          flushCodingSeconds();
          memory.playbackState = "paused";
        } else if (record.actionTaken === "resume") {
          if (guard.blocked) {
            memory.playbackState = "blocked";
            memory.lastAction = guard.reason;
          } else {
            markCodingActive();
            memory.playbackState = "playing";
            if (config.autoResolveShiur && !currentShiurStatus()) {
              void resolveAndStoreShiur().catch(() => {});
            }
            if (config.autoOpenPlayer && config.openPlayerOnPrompt) {
              const address = server.address();
              if (address && typeof address !== "string") {
                openUrl(playerUrl(address.port));
              }
            }
          }
        } else if (record.actionTaken === "prepare") {
          if (guard.blocked) {
            memory.playbackState = "blocked";
            memory.lastAction = guard.reason;
          } else {
            markCodingActive();
            if (config.autoResolveShiur) {
              void resolveAndStoreShiur().catch(() => {});
            }
          }
        } else if (record.actionTaken === "close") {
          flushCodingSeconds();
        }
        sendJson(response, 200, {
          ok: true,
          eventName: record.eventName,
          actionTaken: memory.lastAction,
          parseError: error
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/resolve") {
        const date = url.searchParams.get("date") || today();
        const videoId = await resolveAndStoreShiur(date);
        sendJson(response, 200, {
          ok: true,
          currentShiur: currentShiurStatus(),
          videoId
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/video") {
        const body = JSON.parse(await readBody(request)) as { videoId?: string };
        if (!body.videoId) {
          sendJson(response, 400, { ok: false, error: "videoId is required" });
          return;
        }
        memory.currentVideoId = body.videoId;
        sendJson(response, 200, { ok: true, videoId: memory.currentVideoId });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/progress") {
        const body = JSON.parse(await readBody(request)) as {
          videoId?: string;
          positionSeconds?: number;
          durationSeconds?: number | null;
        };
        if (!body.videoId || typeof body.positionSeconds !== "number") {
          sendJson(response, 400, { ok: false, error: "videoId and positionSeconds are required" });
          return;
        }
        const duration = typeof body.durationSeconds === "number" ? body.durationSeconds : null;
        const completionPercent = duration
          ? Math.max(0, Math.min(100, (body.positionSeconds / duration) * 100))
          : 0;
        const timestamp = nowIso();
        const previousPosition = memory.lastProgressByVideo.get(body.videoId);
        const watchedDelta =
          typeof previousPosition === "number"
            ? Math.max(0, Math.min(60, body.positionSeconds - previousPosition))
            : 0;
        const completedNow = completionPercent >= 90 && !memory.completedVideos.has(body.videoId);
        if (completedNow) {
          memory.completedVideos.add(body.videoId);
        }
        memory.lastProgressByVideo.set(body.videoId, body.positionSeconds);
        database.upsertPlaybackProgress({
          videoId: body.videoId,
          positionSeconds: body.positionSeconds,
          durationSeconds: duration,
          completed: completionPercent >= 90,
          completionPercent,
          lastWatchedAt: timestamp,
          updatedAt: timestamp
        });
        database.incrementDailyStats(today(), {
          watchedSeconds: watchedDelta,
          dafimCompleted: completedNow ? 1 : 0,
          videosTouched: watchedDelta > 0 ? 1 : 0
        });
        sendJson(response, 200, { ok: true, completionPercent });
        return;
      }

      if (request.method === "POST" && ["/play", "/resume", "/pause", "/stop"].includes(url.pathname)) {
        const action = url.pathname.slice(1);
        const guard = shouldBlockAutoPlayback(config);
        memory.lastAction = action;
        memory.playbackState = action === "pause" || action === "stop" ? "paused" : "playing";
        if ((action === "play" || action === "resume") && guard.blocked) {
          memory.lastAction = guard.reason;
          memory.playbackState = "blocked";
        }
        if (memory.playbackState === "playing") {
          markCodingActive();
        } else {
          flushCodingSeconds();
        }
        const result: DaemonActionResult = {
          ok: true,
          action,
          playbackState: memory.playbackState
        };
        sendJson(response, 200, result);
        return;
      }

      sendJson(response, 404, { ok: false, error: "Not found" });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  server.listen(port, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Daemon did not bind to a TCP port");
  }

  writeDaemonState(paths, {
    host: "127.0.0.1",
    port: address.port,
    token,
    pid: process.pid,
    startedAt
  });

  return {
    server,
    token,
    port: address.port,
    startedAt,
    close: async () => {
      removeDaemonState(paths);
      database.close();
      server.close();
      await once(server, "close");
    }
  };
}

export async function runDaemon(paths: RuntimePaths): Promise<void> {
  await startDaemonServer(paths);
}
