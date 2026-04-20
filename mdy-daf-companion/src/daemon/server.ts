import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import type { RuntimePaths } from "../core/paths.js";
import { nowIso } from "../core/time.js";
import { AppDatabase } from "../storage/database.js";
import { parseHookPayload, toHookEventRecord } from "../hooks/events.js";
import type { DaemonActionResult, DaemonStatus, PlaybackState } from "./protocol.js";
import { createDaemonToken, removeDaemonState, writeDaemonState } from "./state.js";

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
    lastAction: null
  };

  const database = new AppDatabase(paths);
  database.migrate();

  const server = http.createServer(async (request, response) => {
    try {
      if (!authorized(request, token)) {
        sendJson(response, 401, { ok: false, error: "Unauthorized" });
        return;
      }

      const url = new URL(request.url || "/", "http://127.0.0.1");

      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, { ok: true, pid: process.pid, startedAt });
        return;
      }

      if (request.method === "GET" && url.pathname === "/status") {
        const status: DaemonStatus = {
          ok: true,
          pid: process.pid,
          startedAt,
          playbackState: memory.playbackState,
          lastAction: memory.lastAction,
          hookEvents: database.getHookEventCount()
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
        if (record.actionTaken?.startsWith("pause")) {
          memory.playbackState = "paused";
        } else if (record.actionTaken === "resume") {
          memory.playbackState = "playing";
        }
        sendJson(response, 200, {
          ok: true,
          eventName: record.eventName,
          actionTaken: record.actionTaken,
          parseError: error
        });
        return;
      }

      if (request.method === "POST" && ["/play", "/resume", "/pause", "/stop"].includes(url.pathname)) {
        const action = url.pathname.slice(1);
        memory.lastAction = action;
        memory.playbackState = action === "pause" || action === "stop" ? "paused" : "playing";
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

