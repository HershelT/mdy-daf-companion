import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function findPluginRoot(startUrl = import.meta.url) {
    let current = path.dirname(fileURLToPath(startUrl));
    while (current !== path.dirname(current)) {
        if (fs.existsSync(path.join(current, ".claude-plugin", "plugin.json"))) {
            return current;
        }
        current = path.dirname(current);
    }
    return process.cwd();
}
export function resolveRuntimePaths(env = process.env) {
    const pluginRoot = env.CLAUDE_PLUGIN_ROOT || findPluginRoot();
    const dataRoot = env.CLAUDE_PLUGIN_DATA ||
        path.join(os.homedir(), ".mdy-daf-companion");
    return {
        pluginRoot,
        dataRoot,
        databasePath: path.join(dataRoot, "state.sqlite"),
        configPath: path.join(dataRoot, "config.json"),
        daemonStatePath: path.join(dataRoot, "daemon.json"),
        logPath: path.join(dataRoot, "mdy-daf.log")
    };
}
export function ensureRuntimeDirs(paths) {
    fs.mkdirSync(paths.dataRoot, { recursive: true });
}
