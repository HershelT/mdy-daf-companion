import fs from "node:fs";
import type { RuntimePaths } from "./paths.js";

export type ShiurLanguage = "english" | "hebrew";
export type ShiurFormat = "full" | "chazarah";
export type PlaybackMode = "on_prompt_until_stop" | "manual" | "tool_activity";

export interface AppConfig {
  language: ShiurLanguage;
  format: ShiurFormat;
  playbackMode: PlaybackMode;
  timezone: string;
  israelDateMode: boolean;
  shabbosYomTovGuard: boolean;
  strictGuard: boolean;
  autoOpenPlayer: boolean;
  autoResolveShiur: boolean;
  openPlayerOnPrompt: boolean;
  storeRawProjectPaths: boolean;
  progressFlushSeconds: number;
  resolverCacheHours: number;
}

export const defaultConfig: AppConfig = {
  language: "english",
  format: "full",
  playbackMode: "on_prompt_until_stop",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  israelDateMode: false,
  shabbosYomTovGuard: true,
  strictGuard: false,
  autoOpenPlayer: true,
  autoResolveShiur: true,
  openPlayerOnPrompt: true,
  storeRawProjectPaths: false,
  progressFlushSeconds: 5,
  resolverCacheHours: 12
};

export function loadConfig(paths: RuntimePaths): AppConfig {
  const fileConfig = fs.existsSync(paths.configPath)
    ? (JSON.parse(fs.readFileSync(paths.configPath, "utf8")) as Partial<AppConfig>)
    : {};
  const { playerSurface: _legacyPlayerSurface, ...normalizedFileConfig } = fileConfig as Partial<AppConfig> & {
    playerSurface?: unknown;
  };

  return validateConfig({ ...defaultConfig, ...normalizedFileConfig, ...pluginEnvConfig(process.env) });
}

export function saveConfig(paths: RuntimePaths, config: AppConfig): void {
  fs.writeFileSync(paths.configPath, `${JSON.stringify(validateConfig(config), null, 2)}\n`, "utf8");
}

export function validateConfig(config: AppConfig): AppConfig {
  if (!["english", "hebrew"].includes(config.language)) {
    throw new Error(`Invalid language: ${config.language}`);
  }
  if (!["full", "chazarah"].includes(config.format)) {
    throw new Error(`Invalid format: ${config.format}`);
  }
  if (!["on_prompt_until_stop", "manual", "tool_activity"].includes(config.playbackMode)) {
    throw new Error(`Invalid playbackMode: ${config.playbackMode}`);
  }
  if (!config.timezone || typeof config.timezone !== "string") {
    throw new Error("timezone is required");
  }
  if (config.progressFlushSeconds < 1 || config.progressFlushSeconds > 120) {
    throw new Error("progressFlushSeconds must be between 1 and 120");
  }
  if (config.resolverCacheHours < 1 || config.resolverCacheHours > 168) {
    throw new Error("resolverCacheHours must be between 1 and 168");
  }
  return config;
}

export function pluginEnvConfig(env: NodeJS.ProcessEnv): Partial<AppConfig> {
  const config: Partial<AppConfig> = {};

  if (env.CLAUDE_PLUGIN_OPTION_language === "english" || env.CLAUDE_PLUGIN_OPTION_language === "hebrew") {
    config.language = env.CLAUDE_PLUGIN_OPTION_language;
  }
  if (env.CLAUDE_PLUGIN_OPTION_format === "full" || env.CLAUDE_PLUGIN_OPTION_format === "chazarah") {
    config.format = env.CLAUDE_PLUGIN_OPTION_format;
  }
  if (env.CLAUDE_PLUGIN_OPTION_timezone) {
    config.timezone = env.CLAUDE_PLUGIN_OPTION_timezone;
  }
  if (env.CLAUDE_PLUGIN_OPTION_auto_open_player === "true") {
    config.autoOpenPlayer = true;
  }
  if (env.CLAUDE_PLUGIN_OPTION_auto_open_player === "false") {
    config.autoOpenPlayer = false;
  }

  return config;
}
