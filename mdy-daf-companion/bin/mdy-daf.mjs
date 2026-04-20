#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const compiledCli = path.join(pluginRoot, "dist", "src", "cli.js");

if (!fs.existsSync(compiledCli)) {
  console.error("MDY Daf Companion runtime has not been built yet. Run `npm install && npm run build` in the plugin directory.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [compiledCli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: process.env.CLAUDE_PLUGIN_ROOT || pluginRoot
  }
});

process.exit(result.status ?? 1);
