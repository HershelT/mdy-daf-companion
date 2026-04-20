import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { RuntimePaths } from "../src/core/paths.js";
import { sendDaemonAction, sendHookToDaemon } from "../src/daemon/client.js";
import { startDaemonServer } from "../src/daemon/server.js";
import { AppDatabase } from "../src/storage/database.js";
import { civilDateInTimezone } from "../src/core/time.js";

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

test("daemon serves favicon without auth noise", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    const response = await fetch(`http://127.0.0.1:${daemon.port}/favicon.ico`);
    assert.equal(response.status, 204);
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

test("daemon stores current video and renders resume position in player", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    const setVideo = await fetch(`http://127.0.0.1:${daemon.port}/api/video`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${daemon.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ videoId: "video-1" })
    });
    assert.equal(setVideo.status, 200);

    const database = new AppDatabase(paths);
    database.migrate();
    database.upsertVideo({
      id: "video-1",
      videoId: "video-1",
      source: "test",
      sourceUrl: "https://www.youtube.com/watch?v=video-1",
      title: "Daf Yomi Menachos Daf 98",
      language: "english",
      format: "full",
      masechta: "Menachos",
      daf: 98,
      durationSeconds: 100,
      publishedAt: null,
      confidence: 1,
      rawMetadataJson: null
    });
    database.upsertPlaybackProgress({
      videoId: "video-1",
      positionSeconds: 42,
      durationSeconds: 100,
      completed: false,
      completionPercent: 42,
      lastWatchedAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z"
    });
    database.close();

    const response = await fetch(`http://127.0.0.1:${daemon.port}/player?token=${daemon.token}`);
    const html = await response.text();
    assert.match(html, /Daf Yomi Menachos Daf 98/);
    assert.match(html, /initialPositionSeconds: 42/);
  } finally {
    await daemon.close();
  }
});

test("daemon serves dashboard with stats and current shiur", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    const database = new AppDatabase(paths);
    database.migrate();
    database.setSetting("currentShiurVideoId", "video-1");
    database.upsertVideo({
      id: "video-1",
      videoId: "video-1",
      source: "test",
      sourceUrl: "https://www.youtube.com/watch?v=video-1",
      title: "Daf Yomi Menachos Daf 98",
      language: "english",
      format: "full",
      masechta: "Menachos",
      daf: 98,
      durationSeconds: 100,
      publishedAt: null,
      confidence: 1,
      rawMetadataJson: null
    });
    database.incrementDailyStats(civilDateInTimezone(new Date(), "UTC"), {
      watchedSeconds: 1800,
      codingSeconds: 3600,
      dafimCompleted: 1
    });
    database.close();

    const response = await fetch(`http://127.0.0.1:${daemon.port}/dashboard?token=${daemon.token}`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Daf Yomi Menachos Daf 98/);
    assert.match(html, /Watched Today/);
  } finally {
    await daemon.close();
  }
});


test("daemon aggregates watched seconds from forward progress", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    for (const positionSeconds of [10, 25]) {
      const response = await fetch(`http://127.0.0.1:${daemon.port}/api/progress`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${daemon.token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          videoId: "video-2",
          positionSeconds,
          durationSeconds: 100
        })
      });
      assert.equal(response.status, 200);
    }
  } finally {
    await daemon.close();
  }

  const database = new AppDatabase(paths);
  database.migrate();
  const today = civilDateInTimezone(
    new Date(),
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  assert.equal(database.getDailyStats(today).watchedSeconds, 15);
  database.close();
});

test("daemon counts completed daf once per video", async () => {
  const paths = tempPaths();
  const daemon = await startDaemonServer(paths);
  try {
    for (const positionSeconds of [91, 95]) {
      const response = await fetch(`http://127.0.0.1:${daemon.port}/api/progress`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${daemon.token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          videoId: "video-complete",
          positionSeconds,
          durationSeconds: 100
        })
      });
      assert.equal(response.status, 200);
    }
  } finally {
    await daemon.close();
  }

  const database = new AppDatabase(paths);
  database.migrate();
  const today = civilDateInTimezone(
    new Date(),
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  assert.equal(database.getDailyStats(today).dafimCompleted, 1);
  database.close();
});
