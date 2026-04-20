import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { RuntimePaths } from "../src/core/paths.js";
import { sendDaemonAction, sendHookToDaemon } from "../src/daemon/client.js";
import { startDaemonServer } from "../src/daemon/server.js";
import { AppDatabase } from "../src/storage/database.js";

function tempPaths(): RuntimePaths {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-daemon-test-"));
  return {
    pluginRoot: process.cwd(),
    dataRoot,
    databasePath: path.join(dataRoot, "state.sqlite"),
    configPath: path.join(dataRoot, "config.json"),
    daemonStatePath: path.join(dataRoot, "daemon.json"),
    logPath: path.join(dataRoot, "mdy-daf.log")
  };
}

test("daemon rejects unauthenticated requests", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    const response = await fetch(`http://127.0.0.1:${daemon.port}/status`);
    assert.equal(response.status, 401);
  } finally {
    await daemon.close();
  }
});

test("daemon accepts playback actions through client", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    const result = (await sendDaemonAction(paths, "pause")) as { playbackState: string };
    assert.equal(result.playbackState, "paused");
  } finally {
    await daemon.close();
  }
});

test("daemon records hook events and updates playback state", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    const hook = (await sendHookToDaemon(
      paths,
      "Stop",
      JSON.stringify({ session_id: "abc", hook_event_name: "Stop" })
    )) as { actionTaken: string };
    assert.equal(hook.actionTaken, "pause_done");

    const statusResponse = await fetch(`http://127.0.0.1:${daemon.port}/status`, {
      headers: { authorization: `Bearer ${daemon.token}` }
    });
    const status = (await statusResponse.json()) as { hookEvents: number; playbackState: string };
    assert.equal(status.hookEvents, 1);
    assert.equal(status.playbackState, "paused");
  } finally {
    await daemon.close();
  }
});

test("daemon serves token-protected player page", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    const unauthorized = await fetch(`http://127.0.0.1:${daemon.port}/player`);
    assert.equal(unauthorized.status, 401);

    const response = await fetch(`http://127.0.0.1:${daemon.port}/player?token=${daemon.token}`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /youtube\.com\/iframe_api/);
    assert.match(html, /MDY Daf Companion/);
  } finally {
    await daemon.close();
  }
});

test("daemon records player progress", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    const response = await fetch(`http://127.0.0.1:${daemon.port}/api/progress`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${daemon.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        videoId: "video-1",
        positionSeconds: 45,
        durationSeconds: 100
      })
    });
    assert.equal(response.status, 200);
  } finally {
    await daemon.close();
  }

  const database = new AppDatabase(paths);
  database.migrate();
  assert.equal(database.getPlaybackProgress("video-1")?.completionPercent, 45);
  database.close();
});

