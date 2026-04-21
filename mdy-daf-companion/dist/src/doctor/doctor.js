import fs from "node:fs";
import { isClaudeRemoteEnvironment, isProbablySshEnvironment } from "../core/environment.js";
import { resolveRuntimePaths } from "../core/paths.js";
import { getCompanionCommand } from "../player/companionLauncher.js";
import { AppDatabase } from "../storage/database.js";
export function runDoctor() {
    const paths = resolveRuntimePaths();
    const checks = [];
    checks.push(check("node-version", process.versions.node.startsWith("24."), `Node ${process.versions.node}`));
    checks.push({
        name: "surface",
        status: isClaudeRemoteEnvironment() ? "warn" : "pass",
        detail: isClaudeRemoteEnvironment()
            ? "Claude remote/cloud environment detected; local player daemon is disabled"
            : isProbablySshEnvironment()
                ? "SSH/container-like environment detected; player may need port forwarding or remote-safe mode"
                : "Local Claude Code environment"
    });
    checks.push(check("plugin-manifest", fs.existsSync(`${paths.pluginRoot}/.claude-plugin/plugin.json`), "Plugin manifest is present"));
    checks.push(check("hook-config", fs.existsSync(`${paths.pluginRoot}/hooks/hooks.json`), "Hook config is present"));
    checks.push(check("cli-wrappers", fs.existsSync(`${paths.pluginRoot}/bin/mdy-daf.mjs`) &&
        fs.existsSync(`${paths.pluginRoot}/bin/mdy-daf`) &&
        fs.existsSync(`${paths.pluginRoot}/bin/mdy-daf.cmd`), "Cross-platform CLI wrappers are present"));
    const companionCommand = getCompanionCommand(paths);
    checks.push({
        name: "electron-companion",
        status: companionCommand ? "pass" : "fail",
        detail: companionCommand
            ? companionCommand.packaged
                ? `Packaged companion found at ${companionCommand.command}`
                : `Development Electron runtime found at ${companionCommand.command}`
            : "No packaged companion or development Electron runtime found"
    });
    try {
        fs.mkdirSync(paths.dataRoot, { recursive: true });
        fs.accessSync(paths.dataRoot, fs.constants.W_OK);
        checks.push({ name: "data-directory", status: "pass", detail: paths.dataRoot });
    }
    catch (error) {
        checks.push({
            name: "data-directory",
            status: "fail",
            detail: error instanceof Error ? error.message : String(error)
        });
    }
    try {
        const database = new AppDatabase(paths);
        database.migrate();
        database.close();
        checks.push({ name: "sqlite", status: "pass", detail: "SQLite migrations applied" });
    }
    catch (error) {
        checks.push({
            name: "sqlite",
            status: "fail",
            detail: error instanceof Error ? error.message : String(error)
        });
    }
    return {
        ok: checks.every((item) => item.status !== "fail"),
        checks
    };
}
export function formatDoctorReport(report) {
    const lines = report.checks.map((item) => `${item.status.toUpperCase().padEnd(4)} ${item.name}: ${item.detail}`);
    return [`MDY Daf Companion doctor: ${report.ok ? "ok" : "needs attention"}`, ...lines].join("\n");
}
function check(name, passed, detail) {
    return {
        name,
        status: passed ? "pass" : "fail",
        detail
    };
}
