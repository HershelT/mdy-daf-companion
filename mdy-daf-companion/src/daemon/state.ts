import crypto from "node:crypto";
import fs from "node:fs";
import type { RuntimePaths } from "../core/paths.js";
import { ensureRuntimeDirs } from "../core/paths.js";

export interface DaemonStateFile {
  host: "127.0.0.1";
  port: number;
  token: string;
  pid: number;
  startedAt: string;
}

export function createDaemonToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function readDaemonState(paths: RuntimePaths): DaemonStateFile | null {
  if (!fs.existsSync(paths.daemonStatePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(paths.daemonStatePath, "utf8")) as DaemonStateFile;
  } catch {
    return null;
  }
}

export function writeDaemonState(paths: RuntimePaths, state: DaemonStateFile): void {
  ensureRuntimeDirs(paths);
  fs.writeFileSync(paths.daemonStatePath, `${JSON.stringify(state, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
}

export function removeDaemonState(paths: RuntimePaths): void {
  if (fs.existsSync(paths.daemonStatePath)) {
    fs.rmSync(paths.daemonStatePath, { force: true });
  }
}

