import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { defaultConfig, loadConfig, saveConfig, validateConfig } from "../src/core/config.js";
import type { RuntimePaths } from "../src/core/paths.js";

function tempPaths(): RuntimePaths {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-config-test-"));
  return {
    pluginRoot: process.cwd(),
    dataRoot,
    databasePath: path.join(dataRoot, "state.sqlite"),
    configPath: path.join(dataRoot, "config.json"),
    daemonStatePath: path.join(dataRoot, "daemon.json"),
    logPath: path.join(dataRoot, "mdy-daf.log")
  };
}

test("loadConfig returns defaults when no config exists", () => {
  const paths = tempPaths();
  assert.equal(loadConfig(paths).language, defaultConfig.language);
});

test("saveConfig and loadConfig round trip valid config", () => {
  const paths = tempPaths();
  const config = { ...defaultConfig, language: "hebrew" as const, format: "chazarah" as const };
  saveConfig(paths, config);
  assert.deepEqual(loadConfig(paths), config);
});

test("default config enables production automation conservatively", () => {
  assert.equal(defaultConfig.autoOpenPlayer, true);
  assert.equal(defaultConfig.autoResolveShiur, true);
  assert.equal(defaultConfig.shabbosYomTovGuard, true);
});

test("validateConfig rejects invalid progress flush interval", () => {
  assert.throws(
    () => validateConfig({ ...defaultConfig, progressFlushSeconds: 0 }),
    /progressFlushSeconds/
  );
});
