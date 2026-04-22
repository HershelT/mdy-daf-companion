import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  companionUrl,
  findClaudeNpmCacheElectronCli,
  getCompanionCommand,
  getPackagedCompanionExecutable,
  openCompanionPlayer
} from "../src/player/companionLauncher.js";

test("companionUrl marks player URL for desktop shell", () => {
  const url = companionUrl("http://127.0.0.1:1234/player?token=abc");
  assert.equal(url, "http://127.0.0.1:1234/companion?token=abc");
});

test("openCompanionPlayer reports missing Electron without browser fallback", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-companion-missing-"));
  const result = openCompanionPlayer(
    {
      pluginRoot: root,
      dataRoot: root,
      databasePath: path.join(root, "state.sqlite"),
      configPath: path.join(root, "config.json"),
      daemonStatePath: path.join(root, "daemon.json"),
      logPath: path.join(root, "mdy.log")
    },
    "http://127.0.0.1:1234/companion?token=abc"
  );

  assert.equal(result.opened, false);
  assert.equal(result.surface, "companion");
  assert.match(result.reason || "", /Electron companion was not found/);
});

test("getPackagedCompanionExecutable finds Windows release build", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-companion-packaged-win-"));
  const exe = path.join(root, "out", "mdy-daf-companion-win32-x64", "mdy-daf-companion.exe");
  fs.mkdirSync(path.dirname(exe), { recursive: true });
  fs.writeFileSync(exe, "", "utf8");

  const found = getPackagedCompanionExecutable(
    {
      pluginRoot: root,
      dataRoot: root,
      databasePath: path.join(root, "state.sqlite"),
      configPath: path.join(root, "config.json"),
      daemonStatePath: path.join(root, "daemon.json"),
      logPath: path.join(root, "mdy.log")
    },
    "win32",
    "x64"
  );

  assert.equal(found, exe);
});

test("getCompanionCommand prefers packaged companion over dev Electron", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-companion-packaged-first-"));
  const packaged = path.join(root, "out", "mdy-daf-companion-win32-x64", "mdy-daf-companion.exe");
  const electronCli = path.join(root, "node_modules", "electron", "cli.js");
  const mainPath = path.join(root, "desktop", "electron", "main.cjs");
  fs.mkdirSync(path.dirname(packaged), { recursive: true });
  fs.mkdirSync(path.dirname(electronCli), { recursive: true });
  fs.mkdirSync(path.dirname(mainPath), { recursive: true });
  fs.writeFileSync(packaged, "", "utf8");
  fs.writeFileSync(electronCli, "", "utf8");
  fs.writeFileSync(mainPath, "", "utf8");
  fs.writeFileSync(path.join(path.dirname(mainPath), "package.json"), "{}", "utf8");

  const command = getCompanionCommand(
    {
      pluginRoot: root,
      dataRoot: root,
      databasePath: path.join(root, "state.sqlite"),
      configPath: path.join(root, "config.json"),
      daemonStatePath: path.join(root, "daemon.json"),
      logPath: path.join(root, "mdy.log")
    },
    "win32",
    {}
  );

  assert.equal(command?.command, packaged);
  assert.deepEqual(command?.args, ["--"]);
  assert.equal(command?.packaged, true);
});

test("getCompanionCommand finds electron override when shell exists", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-companion-command-"));
  const electronPath = path.join(root, process.platform === "win32" ? "electron.cmd" : "electron");
  const mainPath = path.join(root, "desktop", "electron", "main.cjs");
  const appPath = path.dirname(mainPath);
  fs.mkdirSync(path.dirname(mainPath), { recursive: true });
  fs.writeFileSync(mainPath, "", "utf8");
  fs.writeFileSync(path.join(appPath, "package.json"), "{}", "utf8");
  fs.writeFileSync(electronPath, "", "utf8");

  const command = getCompanionCommand(
    {
      pluginRoot: root,
      dataRoot: root,
      databasePath: path.join(root, "state.sqlite"),
      configPath: path.join(root, "config.json"),
      daemonStatePath: path.join(root, "daemon.json"),
      logPath: path.join(root, "mdy.log")
    },
    process.platform,
    { MDY_DAF_ELECTRON: electronPath }
  );

  assert.equal(command?.command, electronPath);
  assert.deepEqual(command?.args, [appPath, "--"]);
});

test("getCompanionCommand uses Electron cli.js for local installs", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-companion-local-"));
  const electronCli = path.join(root, "node_modules", "electron", "cli.js");
  const mainPath = path.join(root, "desktop", "electron", "main.cjs");
  const appPath = path.dirname(mainPath);
  fs.mkdirSync(path.dirname(electronCli), { recursive: true });
  fs.mkdirSync(path.dirname(mainPath), { recursive: true });
  fs.writeFileSync(electronCli, "", "utf8");
  fs.writeFileSync(mainPath, "", "utf8");
  fs.writeFileSync(path.join(appPath, "package.json"), "{}", "utf8");

  const command = getCompanionCommand(
    {
      pluginRoot: root,
      dataRoot: root,
      databasePath: path.join(root, "state.sqlite"),
      configPath: path.join(root, "config.json"),
      daemonStatePath: path.join(root, "daemon.json"),
      logPath: path.join(root, "mdy.log")
    },
    process.platform,
    {}
  );

  assert.equal(command?.command, process.execPath);
  assert.deepEqual(command?.args, [electronCli, appPath, "--"]);
  assert.equal(command?.runtimePath, electronCli);
});

test("getCompanionCommand finds Electron in Claude marketplace npm cache", () => {
  const pluginsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-claude-plugins-"));
  const pluginRoot = path.join(
    pluginsRoot,
    "cache",
    "mdy-daf-companion",
    "mdy-daf-companion",
    "0.1.4"
  );
  const electronCli = path.join(pluginsRoot, "npm-cache", "node_modules", "electron", "cli.js");
  const mainPath = path.join(pluginRoot, "desktop", "electron", "main.cjs");
  const appPath = path.dirname(mainPath);
  fs.mkdirSync(path.dirname(electronCli), { recursive: true });
  fs.mkdirSync(path.dirname(mainPath), { recursive: true });
  fs.writeFileSync(electronCli, "", "utf8");
  fs.writeFileSync(mainPath, "", "utf8");
  fs.writeFileSync(path.join(appPath, "package.json"), "{}", "utf8");

  const command = getCompanionCommand(
    {
      pluginRoot,
      dataRoot: pluginRoot,
      databasePath: path.join(pluginRoot, "state.sqlite"),
      configPath: path.join(pluginRoot, "config.json"),
      daemonStatePath: path.join(pluginRoot, "daemon.json"),
      logPath: path.join(pluginRoot, "mdy.log")
    },
    process.platform,
    {}
  );

  assert.equal(findClaudeNpmCacheElectronCli(pluginRoot, {}), electronCli);
  assert.equal(command?.command, process.execPath);
  assert.deepEqual(command?.args, [electronCli, appPath, "--"]);
  assert.equal(command?.runtimePath, electronCli);
});
