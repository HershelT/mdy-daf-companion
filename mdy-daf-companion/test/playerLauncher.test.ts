import assert from "node:assert/strict";
import test from "node:test";
import { getOpenCommand } from "../src/player/launcher.js";

test("getOpenCommand uses Windows start command", () => {
  const command = getOpenCommand("http://127.0.0.1/player", "win32");
  assert.equal(command.command, "cmd");
  assert.deepEqual(command.args.slice(0, 3), ["/c", "start", ""]);
});

test("getOpenCommand uses macOS open command", () => {
  const command = getOpenCommand("http://127.0.0.1/player", "darwin");
  assert.equal(command.command, "open");
});

test("getOpenCommand uses xdg-open elsewhere", () => {
  const command = getOpenCommand("http://127.0.0.1/player", "linux");
  assert.equal(command.command, "xdg-open");
});

