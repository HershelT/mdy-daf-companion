import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuntimePaths } from "../core/paths.js";
import { isClaudeRemoteEnvironment } from "../core/environment.js";
import { readDaemonState, type DaemonStateFile } from "./state.js";

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

export async function readDaemonStatus(paths: RuntimePaths): Promise<unknown> {
  const state = readDaemonState(paths);
  if (!state) {
    throw new DaemonUnavailableError();
  }
  return daemonFetch(state, "/status");
}

export async function sendDaemonAction(paths: RuntimePaths, action: string): Promise<unknown> {
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

export async function startDaemonProcess(paths: RuntimePaths): Promise<void> {
  if (isClaudeRemoteEnvironment()) {
    throw new DaemonUnavailableError("Daemon is disabled in Claude remote/cloud environments");
  }

  if (await isDaemonHealthy(paths)) {
    return;
  }

  const currentFile = fileURLToPath(import.meta.url);
  const distRoot = path.resolve(path.dirname(currentFile), "..");
  const cliPath = path.join(distRoot, "cli.js");
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
