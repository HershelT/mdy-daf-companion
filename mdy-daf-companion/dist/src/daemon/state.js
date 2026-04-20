import crypto from "node:crypto";
import fs from "node:fs";
import { ensureRuntimeDirs } from "../core/paths.js";
export function createDaemonToken() {
    return crypto.randomBytes(32).toString("hex");
}
export function readDaemonState(paths) {
    if (!fs.existsSync(paths.daemonStatePath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(paths.daemonStatePath, "utf8"));
    }
    catch {
        return null;
    }
}
export function writeDaemonState(paths, state) {
    ensureRuntimeDirs(paths);
    fs.writeFileSync(paths.daemonStatePath, `${JSON.stringify(state, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600
    });
}
export function removeDaemonState(paths) {
    if (fs.existsSync(paths.daemonStatePath)) {
        fs.rmSync(paths.daemonStatePath, { force: true });
    }
}
