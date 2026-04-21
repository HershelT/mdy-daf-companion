import { loadConfig, saveConfig } from "../core/config.js";
import { resolveRuntimePaths } from "../core/paths.js";
export function applySetupOptions(args) {
    const paths = resolveRuntimePaths();
    const current = loadConfig(paths);
    const next = { ...current };
    setString(args, "--language", (value) => {
        if (value !== "english" && value !== "hebrew") {
            throw new Error("--language must be english or hebrew");
        }
        next.language = value;
    });
    setString(args, "--format", (value) => {
        if (value !== "full" && value !== "chazarah") {
            throw new Error("--format must be full or chazarah");
        }
        next.format = value;
    });
    setString(args, "--timezone", (value) => {
        next.timezone = value;
    });
    setBoolean(args, "--guard", (value) => {
        next.shabbosYomTovGuard = value;
    });
    setBoolean(args, "--strict-guard", (value) => {
        next.strictGuard = value;
    });
    setBoolean(args, "--auto-open", (value) => {
        next.autoOpenPlayer = value;
    });
    setBoolean(args, "--auto-resolve", (value) => {
        next.autoResolveShiur = value;
    });
    setBoolean(args, "--open-on-prompt", (value) => {
        next.openPlayerOnPrompt = value;
    });
    saveConfig(paths, next);
    return next;
}
export function formatSetupSummary(config) {
    return [
        "MDY Daf Companion configured",
        `language=${config.language}`,
        `format=${config.format}`,
        `timezone=${config.timezone}`,
        `guard=${config.shabbosYomTovGuard}`,
        `autoOpen=${config.autoOpenPlayer}`,
        `autoResolve=${config.autoResolveShiur}`,
        "player=electron-companion"
    ].join(" | ");
}
function setString(args, name, setter) {
    const index = args.indexOf(name);
    if (index >= 0) {
        const value = args[index + 1];
        if (!value) {
            throw new Error(`${name} requires a value`);
        }
        setter(value);
    }
}
function setBoolean(args, name, setter) {
    const index = args.indexOf(name);
    if (index >= 0) {
        const value = args[index + 1];
        if (!value || !["true", "false"].includes(value)) {
            throw new Error(`${name} requires true or false`);
        }
        setter(value === "true");
    }
}
