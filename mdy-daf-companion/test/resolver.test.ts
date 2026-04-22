import assert from "node:assert/strict";
import test from "node:test";
import { parseHebcalDafResponse } from "../src/resolver/dafCalendar.js";
import type { CandidateProvider } from "../src/resolver/index.js";
import { resolveBestAvailableShiurForDate } from "../src/resolver/index.js";
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

test("rejects adjacent daf titles instead of treating them as current", () => {
  const score = scoreCandidate(
    { ...menachos98, daf: 99 },
    {
      videoId: "previous",
      title: "Daf Yomi Menachos Daf 98 by R' Eli Stefansky",
      source: "youtube-channel-page",
      durationSeconds: 3600
    },
    { language: "english", format: "full" }
  );

  assert.equal(score.confidence, 0);
  assert.deepEqual(score.reasons, ["daf-mismatch"]);
});

test("throws when only the previous daf is available", () => {
  assert.throws(
    () =>
      chooseBestCandidate(
        { ...menachos98, daf: 99 },
        [
          {
            videoId: "previous",
            title: "Daf Yomi Menachos Daf 98 by R' Eli Stefansky",
            source: "youtube-channel-page",
            durationSeconds: 3600
          }
        ],
        { language: "english", format: "full" }
      ),
    /No confident MDY shiur match/
  );
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

test("falls back to the previous date when today's exact daf is not yet uploaded", async () => {
  const byDate: Record<string, DafYomiRef> = {
    "2026-04-21": {
      date: "2026-04-21",
      masechta: "Menachos",
      daf: 101,
      source: "test"
    },
    "2026-04-20": {
      date: "2026-04-20",
      masechta: "Menachos",
      daf: 100,
      source: "test"
    }
  };

  const calendar = {
    async getDafForDate(date: string): Promise<DafYomiRef> {
      const value = byDate[date];
      if (!value) {
        throw new Error(`Unexpected date lookup: ${date}`);
      }
      return value;
    }
  };

  const provider: CandidateProvider = {
    async getCandidates(): Promise<VideoCandidate[]> {
      return [
        {
          videoId: "menachos100",
          title: "Daf Yomi Menachos Daf 100 by R' Eli Stefansky",
          source: "youtube-channel-page",
          durationSeconds: 3600
        }
      ];
    }
  };

  const resolved = await resolveBestAvailableShiurForDate({
    date: "2026-04-21",
    calendar,
    candidateProvider: provider,
    preferences: { language: "english", format: "full" },
    lookbackDays: 1
  });

  assert.equal(resolved.daf.daf, 100);
  assert.equal(resolved.daf.date, "2026-04-20");
  assert.equal(resolved.video.videoId, "menachos100");
  assert.ok(resolved.reasons.includes("date-fallback:-1"));
});

test("throws when no exact match exists in allowed lookback window", async () => {
  const calendar = {
    async getDafForDate(date: string): Promise<DafYomiRef> {
      if (date === "2026-04-21") {
        return { date, masechta: "Menachos", daf: 101, source: "test" };
      }
      throw new Error(`Unexpected date lookup: ${date}`);
    }
  };

  const provider: CandidateProvider = {
    async getCandidates(): Promise<VideoCandidate[]> {
      return [
        {
          videoId: "menachos100",
          title: "Daf Yomi Menachos Daf 100 by R' Eli Stefansky",
          source: "youtube-channel-page",
          durationSeconds: 3600
        }
      ];
    }
  };

  await assert.rejects(
    resolveBestAvailableShiurForDate({
      date: "2026-04-21",
      calendar,
      candidateProvider: provider,
      preferences: { language: "english", format: "full" },
      lookbackDays: 0
    }),
    /No confident MDY shiur match/
  );
});
