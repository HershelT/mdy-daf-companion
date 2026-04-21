import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { applySetupOptions, formatSetupSummary } from "../src/settings/setup.js";

test("applySetupOptions writes first-run preferences", () => {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-setup-test-"));
  const previous = process.env.CLAUDE_PLUGIN_DATA;
  process.env.CLAUDE_PLUGIN_DATA = dataRoot;

  try {
    const config = applySetupOptions([
      "--language",
      "hebrew",
      "--format",
      "chazarah",
      "--timezone",
      "America/Chicago",
      "--guard",
      "true",
      "--auto-open",
      "false"
    ]);
    assert.equal(config.language, "hebrew");
    assert.equal(config.format, "chazarah");
    assert.equal(config.autoOpenPlayer, false);
    assert.match(formatSetupSummary(config), /language=hebrew/);
    assert.match(formatSetupSummary(config), /player=electron-companion/);
  } finally {
    if (previous === undefined) {
      delete process.env.CLAUDE_PLUGIN_DATA;
    } else {
      process.env.CLAUDE_PLUGIN_DATA = previous;
    }
  }
});

test("applySetupOptions rejects invalid booleans", () => {
  assert.throws(() => applySetupOptions(["--guard", "maybe"]), /true or false/);
});
