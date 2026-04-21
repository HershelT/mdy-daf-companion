import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(testDir, "..", "..");

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.join(pluginRoot, relativePath), "utf8");
}

test("runtime has no browser opener fallback", () => {
  const files = [
    "src/cli.ts",
    "src/player/companionLauncher.ts",
    "desktop/electron/main.cjs"
  ].map(readProjectFile);
  const combined = files.join("\n");

  assert.doesNotMatch(combined, /openExternal/);
  assert.doesNotMatch(combined, /shell\.open/);
  assert.doesNotMatch(combined, /start\s+.*https?:\/\//i);
});

test("daemon keeps dashboard user interface inside companion route", () => {
  const server = readProjectFile("src/daemon/server.ts");
  const player = readProjectFile("src/player/page.ts");

  assert.doesNotMatch(server, /url\.pathname === ["']\/dashboard["']/);
  assert.match(server, /url\.pathname === ["']\/api\/dashboard["']/);
  assert.match(player, /id=["']dashboard-view["']/);
  assert.match(player, /fetch\(["']\/api\/dashboard["']/);
});
