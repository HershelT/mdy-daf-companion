import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { RuntimePaths } from "../src/core/paths.js";
import { AppDatabase } from "../src/storage/database.js";

function tempPaths(): RuntimePaths {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-storage-test-"));
  return {
    pluginRoot: process.cwd(),
    dataRoot,
    databasePath: path.join(dataRoot, "state.sqlite"),
    configPath: path.join(dataRoot, "config.json"),
    daemonStatePath: path.join(dataRoot, "daemon.json"),
    logPath: path.join(dataRoot, "mdy-daf.log")
  };
}

test("database migrates and records hook events", () => {
  const database = new AppDatabase(tempPaths());
  database.migrate();
  const id = database.insertHookEvent({
    claudeSessionId: "abc",
    eventName: "Stop",
    matcher: null,
    receivedAt: "2026-04-19T00:00:00.000Z",
    actionTaken: "pause_done",
    payloadHash: "hash",
    error: null
  });
  assert.ok(id);
  assert.equal(database.getHookEventCount(), 1);
  assert.equal(database.getLatestHookEvent()?.eventName, "Stop");
  database.close();
});

test("database upserts playback progress", () => {
  const database = new AppDatabase(tempPaths());
  database.migrate();
  database.upsertPlaybackProgress({
    videoId: "video-1",
    positionSeconds: 30,
    durationSeconds: 100,
    completed: false,
    completionPercent: 30,
    lastWatchedAt: "2026-04-19T00:00:00.000Z",
    updatedAt: "2026-04-19T00:00:00.000Z"
  });
  database.upsertPlaybackProgress({
    videoId: "video-1",
    positionSeconds: 95,
    durationSeconds: 100,
    completed: true,
    completionPercent: 95,
    lastWatchedAt: "2026-04-19T00:01:00.000Z",
    updatedAt: "2026-04-19T00:01:00.000Z"
  });
  const progress = database.getPlaybackProgress("video-1");
  assert.equal(progress?.positionSeconds, 95);
  assert.equal(progress?.completed, true);
  database.close();
});
