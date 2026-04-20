import assert from "node:assert/strict";
import test from "node:test";
import { renderPlayerPage } from "../src/player/page.js";

test("player page contains YouTube iframe API and local progress endpoint", () => {
  const html = renderPlayerPage({
    token: "test-token",
    videoId: "2qz8rC9Yh_k",
    playbackState: "paused"
  });

  assert.match(html, /youtube\.com\/iframe_api/);
  assert.match(html, /2qz8rC9Yh_k/);
  assert.match(html, /\/api\/progress/);
  assert.match(html, /authorization/);
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

