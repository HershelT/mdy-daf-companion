import assert from "node:assert/strict";
import test from "node:test";
import { parseHebcalDafResponse } from "../src/resolver/dafCalendar.js";
import { normalizeMasechta } from "../src/resolver/masechtot.js";
import { chooseBestCandidate, scoreCandidate } from "../src/resolver/scoring.js";
import { parseVideoTitle } from "../src/resolver/titleParser.js";
import type { DafYomiRef, VideoCandidate } from "../src/resolver/types.js";

const menachos98: DafYomiRef = {
  date: "2026-04-19",
  masechta: "Menachos",
  daf: 98,
  source: "test"
};

test("normalizes common Sephardic/Ashkenazic masechta spellings", () => {
  assert.equal(normalizeMasechta("Menachot"), "Menachos");
  assert.equal(normalizeMasechta("Bava Batra"), "Bava Basra");
  assert.equal(normalizeMasechta("Shevuot"), "Shevuos");
});

test("parses Hebcal Daf Yomi response", () => {
  const daf = parseHebcalDafResponse(
    {
      items: [
        {
          title: "Menachot 99",
          date: "2026-04-20",
          category: "dafyomi"
        }
      ]
    },
    "2026-04-20"
  );
  assert.equal(daf.masechta, "Menachos");
  assert.equal(daf.daf, 99);
});

test("parses English full daf title", () => {
  const parsed = parseVideoTitle("English Full Daf Menachos Daf 98");
  assert.equal(parsed.masechta, "Menachos");
  assert.equal(parsed.daf, 98);
  assert.equal(parsed.language, "english");
  assert.equal(parsed.format, "full");
});

test("parses live MDY Daf Yomi title pattern", () => {
  const parsed = parseVideoTitle("Daf Yomi Menachos Daf 98 by R' Eli Stefansky");
  assert.equal(parsed.masechta, "Menachos");
  assert.equal(parsed.daf, 98);
  assert.equal(parsed.format, "full");
});

test("parses chazarah and Hebrew title hints", () => {
  const parsed = parseVideoTitle("Hebrew Chazarah Menachos Daf 98");
  assert.equal(parsed.language, "hebrew");
  assert.equal(parsed.format, "chazarah");
});

test("scores excluded event videos at zero confidence", () => {
  const score = scoreCandidate(
    menachos98,
    {
      videoId: "event",
      title: "MDY Siyum Event Menachos 98",
      source: "youtube-data"
    },
    { language: "english", format: "full" }
  );
  assert.equal(score.confidence, 0);
  assert.equal(score.parsed.excludedReason, "siyum");
});

test("chooses matching full English daf over newer Hebrew or chazarah videos", () => {
  const candidates: VideoCandidate[] = [
    {
      videoId: "hebrew99",
      title: "Hebrew Menachos Daf 99",
      source: "youtube-data",
      durationSeconds: 3500
    },
    {
      videoId: "chazarah98",
      title: "English Chazarah Menachos Daf 98",
      source: "youtube-data",
      durationSeconds: 2300
    },
    {
      videoId: "full98",
      title: "English Full Daf Menachos Daf 98",
      source: "youtube-data",
      durationSeconds: 3686
    }
  ];

  const resolved = chooseBestCandidate(menachos98, candidates, {
    language: "english",
    format: "full"
  });

  assert.equal(resolved.video.videoId, "full98");
  assert.ok(resolved.confidence >= 0.9);
});
