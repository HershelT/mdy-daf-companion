import assert from "node:assert/strict";
import test from "node:test";
import { defaultConfig } from "../src/core/config.js";
import { HebcalYomTovGuard, isShabbosByLocalDate, shouldBlockAutoPlayback } from "../src/guard/shabbosGuard.js";

test("isShabbosByLocalDate detects Saturday in configured timezone", () => {
  assert.equal(isShabbosByLocalDate(new Date("2026-04-25T18:00:00Z"), "America/Chicago"), true);
  assert.equal(isShabbosByLocalDate(new Date("2026-04-24T18:00:00Z"), "America/Chicago"), false);
});

test("shouldBlockAutoPlayback respects disabled guard", () => {
  const decision = shouldBlockAutoPlayback(
    { ...defaultConfig, shabbosYomTovGuard: false },
    new Date("2026-04-25T18:00:00Z")
  );
  assert.equal(decision.blocked, false);
});

test("shouldBlockAutoPlayback blocks Shabbos", () => {
  const decision = shouldBlockAutoPlayback(
    { ...defaultConfig, timezone: "America/Chicago" },
    new Date("2026-04-25T18:00:00Z")
  );
  assert.equal(decision.blocked, true);
  assert.match(decision.reason || "", /Shabbos/);
});

test("HebcalYomTovGuard detects yom tov item", async () => {
  const guard = new HebcalYomTovGuard(async () =>
    new Response(
      JSON.stringify({
        items: [{ title: "Pesach I", category: "holiday", subcat: "major", yomtov: true }]
      }),
      { status: 200 }
    )
  );
  const decision = await guard.isYomTov("2026-04-02");
  assert.equal(decision.blocked, true);
});

