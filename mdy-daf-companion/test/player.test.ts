import assert from "node:assert/strict";
import test from "node:test";
import { renderPlayerPage } from "../src/player/page.js";

test("player page contains YouTube iframe API and local progress endpoint", () => {
  const html = renderPlayerPage({
    token: "test-token",
    videoId: "2qz8rC9Yh_k",
    title: "Daf Yomi Menachos Daf 98",
    sourceUrl: "https://www.youtube.com/watch?v=2qz8rC9Yh_k",
    initialPositionSeconds: 120,
    completionPercent: 25,
    playbackState: "paused"
  });

  assert.match(html, /youtube\.com\/iframe_api/);
  assert.match(html, /youtube\.com\/embed\/2qz8rC9Yh_k/);
  assert.match(html, /enablejsapi=1/);
  assert.match(html, /2qz8rC9Yh_k/);
  assert.match(html, /\/api\/progress/);
  assert.match(html, /\/status/);
  assert.match(html, /authorization/);
  assert.match(html, /seekTo\(MDY_DAF.initialPositionSeconds/);
  assert.match(html, /applyDesiredPlaybackState/);
  assert.match(html, /Mark watched/);
  assert.match(html, /YouTube/);
});

test("player page escapes injected video id", () => {
  const html = renderPlayerPage({
    token: "token",
    videoId: "\"><script>alert(1)</script>",
    playbackState: "idle"
  });

  assert.doesNotMatch(html, /"><script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("player page renders companion shell controls", () => {
  const html = renderPlayerPage({
    token: "token",
    videoId: "2qz8rC9Yh_k",
    playbackState: "playing",
    companionMode: true
  });

  assert.match(html, /class="companion"/);
  assert.match(html, /window-actions/);
  assert.match(html, /dashboard-toggle/);
  assert.match(html, /dashboard-view/);
  assert.match(html, /\/api\/dashboard/);
  assert.match(html, /window\.location\.hash === "#stats"/);
  assert.match(html, /mdyCompanion/);
});

test("playing companion page requests YouTube autoplay", () => {
  const html = renderPlayerPage({
    token: "token",
    videoId: "2qz8rC9Yh_k",
    playbackState: "playing",
    companionMode: true
  });

  assert.match(html, /autoplay=1/);
});
