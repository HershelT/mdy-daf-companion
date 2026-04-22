import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import type { RuntimePaths } from "../src/core/paths.js";
import { redactDaemonUrl, shouldRestartHealthyDaemon } from "../src/daemon/client.js";
import type { DaemonStateFile } from "../src/daemon/state.js";

const paths: RuntimePaths = {
  pluginRoot: path.resolve("C:/repo/mdy-daf-companion"),
  dataRoot: path.resolve("C:/repo/.data"),
  databasePath: path.resolve("C:/repo/.data/state.sqlite"),
  configPath: path.resolve("C:/repo/.data/config.json"),
  daemonStatePath: path.resolve("C:/repo/.data/daemon.json"),
  logPath: path.resolve("C:/repo/.data/mdy-daf.log")
};

const cliPath = path.resolve("C:/repo/mdy-daf-companion/dist/src/cli.js");

test("restart is required when daemon state lacks plugin root metadata", () => {
  const state: DaemonStateFile = {
    host: "127.0.0.1",
    port: 12345,
    token: "token",
    pid: 123,
    startedAt: "2026-04-22T02:00:00.000Z"
  };

  const restart = shouldRestartHealthyDaemon(state, paths, cliPath);
  assert.equal(restart, true);
});

test("restart is required when daemon plugin root mismatches runtime", () => {
  const state: DaemonStateFile = {
    host: "127.0.0.1",
    port: 12345,
    token: "token",
    pid: 123,
    startedAt: "2026-04-22T02:00:00.000Z",
    pluginRoot: path.resolve("C:/repo/other-plugin")
  };

  const restart = shouldRestartHealthyDaemon(state, paths, cliPath);
  assert.equal(restart, true);
});

test("plugin root comparison tolerates casing differences on Windows", () => {
  const samePathDifferentCase = process.platform === "win32"
    ? paths.pluginRoot.toUpperCase()
    : paths.pluginRoot;

  const state: DaemonStateFile = {
    host: "127.0.0.1",
    port: 12345,
    token: "token",
    pid: 123,
    startedAt: "2099-04-22T02:00:00.000Z",
    pluginRoot: samePathDifferentCase
  };

  const restart = shouldRestartHealthyDaemon(state, paths, cliPath);
  assert.equal(restart, false);
});

test("redactDaemonUrl removes bearer token from companion URLs", () => {
  assert.equal(
    redactDaemonUrl("http://127.0.0.1:1234/companion?token=secret#stats"),
    "http://127.0.0.1:1234/companion?token=[redacted]#stats"
  );
  assert.equal(
    redactDaemonUrl("http://127.0.0.1:1234/companion?token=secret&view=stats"),
    "http://127.0.0.1:1234/companion?token=[redacted]&view=stats"
  );
});
