import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface RuntimePaths {
  pluginRoot: string;
  dataRoot: string;
  databasePath: string;
  configPath: string;
  daemonStatePath: string;
  logPath: string;
}

export function findPluginRoot(startUrl = import.meta.url): string {
  let current = path.dirname(fileURLToPath(startUrl));

  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, ".claude-plugin", "plugin.json"))) {
      return current;
    }
    current = path.dirname(current);
  }

  return process.cwd();
}

export function resolveRuntimePaths(env: NodeJS.ProcessEnv = process.env): RuntimePaths {
  const pluginRoot = env.CLAUDE_PLUGIN_ROOT || findPluginRoot();
  const dataRoot =
    env.CLAUDE_PLUGIN_DATA ||
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

export function ensureRuntimeDirs(paths: RuntimePaths): void {
  fs.mkdirSync(paths.dataRoot, { recursive: true });
}
