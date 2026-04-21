import http from "node:http";
import { once } from "node:events";
import { nowIso } from "../core/time.js";
import { AppDatabase } from "../storage/database.js";
import { loadConfig } from "../core/config.js";
import { civilDateInTimezone } from "../core/time.js";
import { parseHookPayload, toHookEventRecord } from "../hooks/events.js";
import { createDaemonToken, removeDaemonState, writeDaemonState } from "./state.js";
import { renderPlayerPage } from "../player/page.js";
import { openCompanionPlayer } from "../player/companionLauncher.js";
import { HebcalDafCalendar } from "../resolver/dafCalendar.js";
import { chooseBestCandidate } from "../resolver/scoring.js";
import { createDefaultCandidateProvider } from "../resolver/defaultProvider.js";
import { storeResolvedShiur, CURRENT_SHIUR_SETTING } from "../resolver/persist.js";
import { shouldBlockAutoPlayback } from "../guard/shabbosGuard.js";
import { summarizeDailyStats } from "../stats/summary.js";
async function readBody(request) {
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
function sendJson(response, status, value) {
    response.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
    });
    response.end(`${JSON.stringify(value)}\n`);
}
function authorized(request, token) {
    return request.headers.authorization === `Bearer ${token}`;
}
export async function startDaemonServer(paths, port = 0, options = {}) {
    const token = createDaemonToken();
    const startedAt = nowIso();
    const memory = {
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
    let pendingCurrentShiurResolve = null;
    async function resolveAndStoreShiur(date = today()) {
        if (options.resolveAndStoreShiur) {
            const videoId = await options.resolveAndStoreShiur(date, database);
            memory.currentVideoId = videoId;
            return videoId;
        }
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
    function scheduleCurrentShiurResolve() {
        if (!config.autoResolveShiur || currentShiurStatus() || pendingCurrentShiurResolve) {
            return;
        }
        pendingCurrentShiurResolve = resolveAndStoreShiur()
            .catch(() => "")
            .finally(() => {
            pendingCurrentShiurResolve = null;
        });
    }
    function currentShiurStatus() {
        const currentVideoId = memory.currentVideoId || database.getSetting(CURRENT_SHIUR_SETTING);
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
    function dashboardSnapshot() {
        const date = today();
        const rows = database.getDailyStatsRange(date, date);
        const todayStats = summarizeDailyStats(database.getDailyStats(date));
        const weekStats = summarizeDailyStats({
            date,
            watchedSeconds: rows.reduce((sum, row) => sum + row.watchedSeconds, 0),
            codingSeconds: rows.reduce((sum, row) => sum + row.codingSeconds, 0),
            dafimCompleted: rows.reduce((sum, row) => sum + row.dafimCompleted, 0),
            videosTouched: rows.reduce((sum, row) => sum + row.videosTouched, 0),
            updatedAt: nowIso()
        });
        return {
            playbackState: memory.playbackState,
            currentShiur: currentShiurStatus(),
            stats: { today: todayStats, week: weekStats }
        };
    }
    function markCodingActive() {
        memory.activeCodingStartedAt ??= Date.now();
    }
    function companionUrl(port) {
        return `http://127.0.0.1:${port}/companion?token=${encodeURIComponent(token)}`;
    }
    function flushCodingSeconds() {
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
            if (request.method === "GET" && url.pathname === "/favicon.ico") {
                response.writeHead(204, { "cache-control": "public, max-age=86400" });
                response.end();
                return;
            }
            if (!authorized(request, token) && !queryAuthorized) {
                sendJson(response, 401, { ok: false, error: "Unauthorized" });
                return;
            }
            if (request.method === "GET" && url.pathname === "/health") {
                sendJson(response, 200, { ok: true, pid: process.pid, startedAt });
                return;
            }
            if (request.method === "GET" && url.pathname === "/companion") {
                response.writeHead(200, {
                    "content-type": "text/html; charset=utf-8",
                    "cache-control": "no-store",
                    "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; frame-src https://www.youtube.com; img-src 'self' https: data:; connect-src 'self' https://www.youtube.com https://*.youtube.com; media-src https: blob:"
                });
                response.end(renderPlayerPage({
                    token,
                    videoId: memory.currentVideoId,
                    title: currentShiurStatus()?.title,
                    initialPositionSeconds: currentShiurStatus()?.positionSeconds,
                    completionPercent: currentShiurStatus()?.completionPercent,
                    playbackState: memory.playbackState,
                    companionMode: true
                }));
                return;
            }
            if (request.method === "GET" && url.pathname === "/api/dashboard") {
                sendJson(response, 200, { ok: true, ...dashboardSnapshot() });
                return;
            }
            if (request.method === "GET" && url.pathname === "/status") {
                const status = {
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
                }
                else if (record.actionTaken === "resume") {
                    if (guard.blocked) {
                        memory.playbackState = "blocked";
                        memory.lastAction = guard.reason;
                    }
                    else {
                        markCodingActive();
                        memory.playbackState = "playing";
                        scheduleCurrentShiurResolve();
                        if (config.autoOpenPlayer && config.openPlayerOnPrompt) {
                            const address = server.address();
                            if (address && typeof address !== "string") {
                                (options.openCompanionPlayer || openCompanionPlayer)(paths, companionUrl(address.port));
                            }
                        }
                    }
                }
                else if (record.actionTaken === "prepare") {
                    if (guard.blocked) {
                        memory.playbackState = "blocked";
                        memory.lastAction = guard.reason;
                    }
                    else {
                        markCodingActive();
                        scheduleCurrentShiurResolve();
                    }
                }
                else if (record.actionTaken === "close") {
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
                const body = JSON.parse(await readBody(request));
                if (!body.videoId) {
                    sendJson(response, 400, { ok: false, error: "videoId is required" });
                    return;
                }
                memory.currentVideoId = body.videoId;
                sendJson(response, 200, { ok: true, videoId: memory.currentVideoId });
                return;
            }
            if (request.method === "POST" && url.pathname === "/api/progress") {
                const body = JSON.parse(await readBody(request));
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
                const watchedDelta = typeof previousPosition === "number"
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
                    scheduleCurrentShiurResolve();
                }
                else {
                    flushCodingSeconds();
                }
                const result = {
                    ok: true,
                    action,
                    playbackState: memory.playbackState
                };
                sendJson(response, 200, result);
                return;
            }
            sendJson(response, 404, { ok: false, error: "Not found" });
        }
        catch (error) {
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
export async function runDaemon(paths) {
    await startDaemonServer(paths);
}
