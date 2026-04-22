import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuntimePaths } from "../core/paths.js";
import { isClaudeRemoteEnvironment } from "../core/environment.js";
import type { DaemonActionResult, DaemonStatus } from "./protocol.js";
import { readDaemonState, removeDaemonState, type DaemonStateFile } from "./state.js";

export class DaemonUnavailableError extends Error {
  constructor(message = "Daemon is not running") {
    super(message);
  }
}

async function daemonFetch<T>(
  state: DaemonStateFile,
  pathname: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`http://${state.host}:${state.port}${pathname}`, {
    ...init,
    headers: {
      authorization: `Bearer ${state.token}`,
      ...(init.headers || {})
    }
  });

  const json = (await response.json()) as T & { ok?: boolean; error?: string };
  if (!response.ok || json.ok === false) {
    throw new Error(json.error || `Daemon request failed with ${response.status}`);
  }
  return json;
}

export async function readDaemonStatus(paths: RuntimePaths): Promise<DaemonStatus> {
  const state = readDaemonState(paths);
  if (!state) {
    throw new DaemonUnavailableError();
  }
  return daemonFetch(state, "/status");
}

export async function sendDaemonAction(paths: RuntimePaths, action: string): Promise<DaemonActionResult> {
  const state = readDaemonState(paths);
  if (!state) {
    throw new DaemonUnavailableError();
  }
  return daemonFetch(state, `/${action}`, { method: "POST" });
}

export async function resolveCurrentShiur(paths: RuntimePaths, date?: string): Promise<unknown> {
  const state = readDaemonState(paths);
  if (!state) {
    throw new DaemonUnavailableError();
  }
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return daemonFetch(state, `/api/resolve${query}`, { method: "POST" });
}

export async function getCompanionPlayerUrl(paths: RuntimePaths): Promise<string> {
  const state = readDaemonState(paths);
  if (!state) {
    throw new DaemonUnavailableError();
  }
  return `http://${state.host}:${state.port}/companion?token=${encodeURIComponent(state.token)}`;
}

export function redactDaemonUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.searchParams.has("token")) {
      url.searchParams.set("token", "[redacted]");
    }
    return url.toString().replace(/token=%5Bredacted%5D/gi, "token=[redacted]");
  } catch {
    return value.replace(/([?&]token=)[^&\s]+/gi, "$1[redacted]");
  }
}

export async function sendHookToDaemon(
  paths: RuntimePaths,
  fallbackEvent: string,
  body: string
): Promise<unknown> {
  const state = readDaemonState(paths);
  if (!state) {
    throw new DaemonUnavailableError();
  }
  return daemonFetch(state, `/hook?event=${encodeURIComponent(fallbackEvent)}`, {
    method: "POST",
    body
  });
}

export async function isDaemonHealthy(paths: RuntimePaths): Promise<boolean> {
  const state = readDaemonState(paths);
  if (!state) {
    return false;
  }

  try {
    await daemonFetch(state, "/health");
    return true;
  } catch {
    return false;
  }
}

function daemonStartedAtMs(state: DaemonStateFile): number {
  const startedMs = Date.parse(state.startedAt);
  return Number.isFinite(startedMs) ? startedMs : 0;
}

function cliBuildMtimeMs(cliPath: string): number {
  try {
    return fs.statSync(cliPath).mtimeMs;
  } catch {
    return 0;
  }
}

function normalizePathForComparison(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

export function shouldRestartHealthyDaemon(
  state: DaemonStateFile,
  paths: RuntimePaths,
  cliPath: string
): boolean {
  const normalizedPluginRoot = normalizePathForComparison(paths.pluginRoot);
  if (!state.pluginRoot || normalizePathForComparison(state.pluginRoot) !== normalizedPluginRoot) {
    return true;
  }

  return cliBuildMtimeMs(cliPath) > daemonStartedAtMs(state);
}

function tryStopDaemon(state: DaemonStateFile): void {
  try {
    process.kill(state.pid);
  } catch {
    // Ignore. A missing process is handled by clearing daemon state.
  }
}

export async function startDaemonProcess(paths: RuntimePaths): Promise<void> {
  if (isClaudeRemoteEnvironment()) {
    throw new DaemonUnavailableError("Daemon is disabled in Claude remote/cloud environments");
  }

  const currentFile = fileURLToPath(import.meta.url);
  const distRoot = path.resolve(path.dirname(currentFile), "..");
  const cliPath = path.join(distRoot, "cli.js");
  const state = readDaemonState(paths);

  if (state) {
    let healthy = false;
    try {
      await daemonFetch(state, "/health");
      healthy = true;
    } catch {
      healthy = false;
    }

    if (healthy && !shouldRestartHealthyDaemon(state, paths, cliPath)) {
      return;
    }

    tryStopDaemon(state);
    removeDaemonState(paths);
  }

  const child = spawn(process.execPath, [cliPath, "daemon"], {
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: paths.pluginRoot,
      CLAUDE_PLUGIN_DATA: paths.dataRoot
    }
  });
  child.unref();

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (await isDaemonHealthy(paths)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new DaemonUnavailableError("Daemon did not become healthy within 5 seconds");
}
