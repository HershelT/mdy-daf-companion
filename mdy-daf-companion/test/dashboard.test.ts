import assert from "node:assert/strict";
import test from "node:test";
import { renderDashboardPage } from "../src/dashboard/page.js";

test("renderDashboardPage shows current shiur and stats", () => {
  const html = renderDashboardPage({
    token: "token",
    playbackState: "playing",
    currentShiur: {
      videoId: "video",
      title: "Daf Yomi Menachos Daf 98",
      sourceUrl: "https://www.youtube.com/watch?v=video",
      masechta: "Menachos",
      daf: 98,
      positionSeconds: 120,
      completionPercent: 25
    },
    stats: {
      today: {
        date: "2026-04-20",
        watchedMinutes: 30,
        codingMinutes: 60,
        dafimCompleted: 1,
        videosTouched: 1,
        watchToCodingRatio: 0.5
      },
      week: {
        date: "week",
        watchedMinutes: 120,
        codingMinutes: 300,
        dafimCompleted: 4,
        videosTouched: 5,
        watchToCodingRatio: 0.4
      }
    }
  });

  assert.match(html, /Daf Yomi Menachos Daf 98/);
  assert.match(html, /Watched Today/);
  assert.match(html, /Open Player/);
});

