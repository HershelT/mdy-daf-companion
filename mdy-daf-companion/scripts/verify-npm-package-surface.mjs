#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const maxPackageBytes = 50 * 1024 * 1024;

const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath ? process.execPath : "npm";
const npmArgs = npmExecPath
  ? [npmExecPath, "pack", "--dry-run", "--json"]
  : ["pack", "--dry-run", "--json"];
const result = spawnSync(npmCommand, npmArgs, {
  cwd: pluginRoot,
  encoding: "utf8"
});

if (result.status !== 0) {
  if (result.error) {
    console.error(result.error.message);
  }
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  process.exit(result.status || 1);
}

let pack;
try {
  const jsonStart = result.stdout.indexOf("[");
  if (jsonStart < 0) {
    throw new Error("npm pack did not return a JSON array");
  }
  pack = JSON.parse(result.stdout.slice(jsonStart))[0];
} catch (error) {
  console.error("Could not parse npm pack dry-run JSON output.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const files = (pack.files || []).map((file) => String(file.path || "").replace(/\\/g, "/"));
const requiredFiles = [
  ".claude-plugin/plugin.json",
  "bin/mdy-daf.mjs",
  "desktop/electron/main.cjs",
  "dist/src/cli.js",
  "README.md"
];
const forbiddenPrefixes = [
  "out/",
  "dist/test/",
  "src/",
  "test/",
  ".smoke-data/"
];

const missing = requiredFiles.filter((file) => !files.includes(file));
const forbidden = files.filter((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix)));

if (missing.length > 0) {
  console.error("npm package dry-run is missing required release files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

if (forbidden.length > 0) {
  console.error("npm package dry-run includes files that must not be published:");
  for (const file of forbidden.slice(0, 25)) {
    console.error(`- ${file}`);
  }
  if (forbidden.length > 25) {
    console.error(`...and ${forbidden.length - 25} more`);
  }
  process.exit(1);
}

if (Number(pack.size || 0) > maxPackageBytes) {
  console.error(
    `npm package dry-run is too large: ${Math.round(pack.size / 1024 / 1024)} MB. ` +
      "The public plugin package should install Electron as a dependency instead of bundling platform apps."
  );
  process.exit(1);
}

console.log(
  `Verified npm package surface: ${pack.filename}, ${Math.round(pack.size / 1024)} KB, ${files.length} files.`
);
