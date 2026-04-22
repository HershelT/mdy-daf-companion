import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import type { RuntimePaths } from "../core/paths.js";

export interface CompanionCommand {
  command: string;
  args: string[];
  shell?: boolean;
  packaged?: boolean;
  runtimePath?: string;
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

  const packaged = getPackagedCompanionExecutable(paths, platform, process.arch);
  if (packaged) {
    return { command: packaged, args: ["--"], packaged: true };
  }

  const localCli = path.join(paths.pluginRoot, "node_modules", "electron", "cli.js");
  if (fs.existsSync(localCli)) {
    return { command: process.execPath, args: [localCli, appPath, "--"], runtimePath: localCli };
  }

  const cachedCli = findClaudeNpmCacheElectronCli(paths.pluginRoot, env);
  if (cachedCli) {
    return { command: process.execPath, args: [cachedCli, appPath, "--"], runtimePath: cachedCli };
  }

  return null;
}

export function findClaudeNpmCacheElectronCli(
  pluginRoot: string,
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const roots = new Set<string>();
  const configuredCache = env.CLAUDE_CODE_PLUGIN_CACHE_DIR;
  if (configuredCache) {
    roots.add(configuredCache);
  }

  const parts = path.resolve(pluginRoot).split(path.sep);
  const cacheIndex = parts.lastIndexOf("cache");
  if (cacheIndex > 0) {
    roots.add(parts.slice(0, cacheIndex).join(path.sep));
  }

  for (const root of roots) {
    const candidate = path.join(root, "npm-cache", "node_modules", "electron", "cli.js");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function getPackagedCompanionExecutable(
  paths: RuntimePaths,
  platform: NodeJS.Platform = process.platform,
  arch = process.arch
): string | null {
  const appDisplayName = "MDY Daf Companion";
  const appPackageName = "mdy-daf-companion";
  const platformFolders = [
    `${appPackageName}-${platform}-${arch}`,
    `${appDisplayName}-${platform}-${arch}`
  ];
  const outRoot = path.join(paths.pluginRoot, "out");
  const candidates = platformFolders.flatMap((platformFolder) =>
    platform === "win32"
      ? [
          path.join(outRoot, platformFolder, `${appPackageName}.exe`),
          path.join(outRoot, platformFolder, `${appDisplayName}.exe`)
        ]
      : platform === "darwin"
        ? [
            path.join(outRoot, platformFolder, `${appPackageName}.app`, "Contents", "MacOS", appPackageName),
            path.join(outRoot, platformFolder, `${appDisplayName}.app`, "Contents", "MacOS", appDisplayName)
          ]
        : [
            path.join(outRoot, platformFolder, appPackageName),
            path.join(outRoot, platformFolder, appDisplayName)
          ]
  );

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
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
      reason:
        "Electron companion was not found. Refresh the plugin install, run npm run package:companion for release builds, or run npm install for local development."
    };
  }

  const child = spawn(command.command, command.args, {
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
