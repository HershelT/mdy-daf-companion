import assert from "node:assert/strict";
import test from "node:test";
import { formatStatsSummary, summarizeDailyStats } from "../src/stats/summary.js";

test("summarizeDailyStats formats minutes and ratio", () => {
  const summary = summarizeDailyStats({
    date: "2026-04-19",
    watchedSeconds: 1800,
    codingSeconds: 3600,
    dafimCompleted: 1,
    videosTouched: 2,
    updatedAt: "2026-04-19T00:00:00.000Z"
  });

  assert.equal(summary.watchedMinutes, 30);
  assert.equal(summary.codingMinutes, 60);
  assert.equal(summary.watchToCodingRatio, 0.5);
});

test("formatStatsSummary stays compact for status and commands", () => {
  const text = formatStatsSummary({
    date: "2026-04-19",
    watchedMinutes: 30,
    codingMinutes: 60,
    watchToCodingRatio: 0.5,
    dafimCompleted: 1,
    videosTouched: 2
  });

  assert.match(text, /watched: 30m/);
  assert.match(text, /coding: 60m/);
});

