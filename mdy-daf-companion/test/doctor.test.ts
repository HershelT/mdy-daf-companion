import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { formatDoctorReport, runDoctor } from "../src/doctor/doctor.js";

test("doctor report passes in plugin workspace with temp data root", () => {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-doctor-test-"));
  const previousData = process.env.CLAUDE_PLUGIN_DATA;
  const previousRoot = process.env.CLAUDE_PLUGIN_ROOT;
  process.env.CLAUDE_PLUGIN_DATA = dataRoot;
  process.env.CLAUDE_PLUGIN_ROOT = process.cwd();

  try {
    const report = runDoctor();
    assert.equal(report.ok, true);
    assert.ok(report.checks.some((item) => item.name === "sqlite" && item.status === "pass"));
    assert.match(formatDoctorReport(report), /doctor: ok/);
  } finally {
    if (previousData === undefined) {
      delete process.env.CLAUDE_PLUGIN_DATA;
    } else {
      process.env.CLAUDE_PLUGIN_DATA = previousData;
    }
    if (previousRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = previousRoot;
    }
  }
});

