import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import type { RuntimePaths } from "../core/paths.js";

export interface CompanionCommand {
  command: string;
  args: string[];
  shell?: boolean;
}

export interface PlayerLaunchResult {
  surface: "companion";
  opened: boolean;
  reason: string | null;
}

export function companionUrl(playerUrl: string): string {
  const url = new URL(playerUrl);
  url.pathname = "/companion";
  url.searchParams.delete("shell");
  return url.toString();
}

export function getCompanionCommand(
  paths: RuntimePaths,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): CompanionCommand | null {
  const appPath = path.join(paths.pluginRoot, "desktop", "electron");
  const mainPath = path.join(appPath, "main.cjs");
  if (!fs.existsSync(mainPath) || !fs.existsSync(path.join(appPath, "package.json"))) {
    return null;
  }

  const override = env.MDY_DAF_ELECTRON;
  if (override) {
    return fs.existsSync(override) ? { command: override, args: [appPath, "--"] } : null;
  }

  const localCli = path.join(paths.pluginRoot, "node_modules", "electron", "cli.js");
  if (fs.existsSync(localCli)) {
    return { command: process.execPath, args: [localCli, appPath, "--"] };
  }

  return null;
}

export function openCompanionPlayer(paths: RuntimePaths, playerUrl: string): PlayerLaunchResult {
  const command = getCompanionCommand(paths);
  const url = companionUrl(playerUrl);
  if (!command) {
    return {
      surface: "companion",
      opened: false,
      reason: "Electron runtime was not found. Run npm install in the plugin directory or package the companion app before launch."
    };
  }

  const child = spawn(command.command, [...command.args, "--url", url, "--data-root", paths.dataRoot], {
    detached: true,
    stdio: "ignore",
    shell: command.shell || false,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: paths.pluginRoot,
      CLAUDE_PLUGIN_DATA: paths.dataRoot,
      MDY_DAF_COMPANION_URL: url,
      MDY_DAF_COMPANION_DATA: paths.dataRoot
    }
  });
  child.unref();

  return {
    surface: "companion",
    opened: true,
    reason: null
  };
}
