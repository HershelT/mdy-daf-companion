#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(pluginRoot, "dist", "src", "cli.js");

for (const args of [
  ["doctor"],
  ["today", "--date", "2026-04-20"],
  ["stats"]
]) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: pluginRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: pluginRoot,
      CLAUDE_PLUGIN_DATA: path.join(pluginRoot, ".smoke-data")
    }
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

