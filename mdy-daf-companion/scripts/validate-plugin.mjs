#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();

function hasCommand(command) {
  const result =
    process.platform === "win32"
      ? spawnSync("where.exe", [command], { cwd, encoding: "utf8", stdio: "ignore" })
      : spawnSync("sh", ["-c", `command -v ${command}`], { cwd, encoding: "utf8", stdio: "ignore" });
  return result.status === 0;
}

function runClaudeValidator() {
  const result =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", "claude plugin validate ."], {
          cwd,
          encoding: "utf8",
          stdio: "inherit",
        })
      : spawnSync("claude", ["plugin", "validate", "."], {
          cwd,
          encoding: "utf8",
          stdio: "inherit",
        });
  return result.status ?? 1;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON at ${path}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateLocalManifest() {
  const manifestPath = join(cwd, ".claude-plugin", "plugin.json");
  const hooksPath = join(cwd, "hooks", "hooks.json");
  const binPath = join(cwd, "bin", process.platform === "win32" ? "mdy-daf.cmd" : "mdy-daf");
  const runtimePath = join(cwd, "dist", "src", "cli.js");

  assert(existsSync(manifestPath), "Missing .claude-plugin/plugin.json");
  assert(existsSync(hooksPath), "Missing hooks/hooks.json");
  assert(existsSync(binPath), `Missing CLI wrapper ${binPath}`);
  assert(existsSync(runtimePath), "Missing built runtime dist/src/cli.js");

  const manifest = readJson(manifestPath);
  assert(manifest.name === "mdy-daf-companion", "Plugin name must be mdy-daf-companion");
  assert(typeof manifest.description === "string" && manifest.description.length > 0, "Plugin description is required");
  assert(typeof manifest.version === "string" && /^\d+\.\d+\.\d+/.test(manifest.version), "Plugin semver version is required");
  assert(manifest.repository === "https://github.com/HershelT/mdy-daf-companion", "Plugin repository URL is incorrect");
  assert(manifest.userConfig && typeof manifest.userConfig === "object", "Plugin userConfig is required");

  const hooks = readJson(hooksPath);
  assert(hooks.hooks && typeof hooks.hooks === "object", "hooks/hooks.json must define hooks");

  console.log("Claude CLI not found; completed CI-safe plugin manifest validation.");
}

if (hasCommand("claude")) {
  process.exit(runClaudeValidator());
}

try {
  validateLocalManifest();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
