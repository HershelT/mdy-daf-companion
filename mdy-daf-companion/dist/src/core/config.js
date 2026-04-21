import fs from "node:fs";
export const defaultConfig = {
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
export function loadConfig(paths) {
    const fileConfig = fs.existsSync(paths.configPath)
        ? JSON.parse(fs.readFileSync(paths.configPath, "utf8"))
        : {};
    const { playerSurface: _legacyPlayerSurface, ...normalizedFileConfig } = fileConfig;
    return validateConfig({ ...defaultConfig, ...normalizedFileConfig, ...pluginEnvConfig(process.env) });
}
export function saveConfig(paths, config) {
    fs.writeFileSync(paths.configPath, `${JSON.stringify(validateConfig(config), null, 2)}\n`, "utf8");
}
export function validateConfig(config) {
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
export function pluginEnvConfig(env) {
    const config = {};
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
