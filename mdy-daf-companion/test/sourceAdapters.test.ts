import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { RuntimePaths } from "../src/core/paths.js";
import { AppDatabase } from "../src/storage/database.js";
import { CachedCandidateProvider } from "../src/resolver/cachedProvider.js";
import { extractMdyAppCandidates } from "../src/resolver/mdyApp.js";
import { CompositeCandidateProvider } from "../src/resolver/providers.js";
import { parseIso8601DurationSeconds } from "../src/resolver/duration.js";
import { YouTubeDataApiCandidateProvider } from "../src/resolver/youtubeDataApi.js";

const daf = { date: "2026-04-19", masechta: "Menachos", daf: 98, source: "test" };

function tempPaths(): RuntimePaths {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-source-test-"));
  return {
    pluginRoot: process.cwd(),
    dataRoot,
    databasePath: path.join(dataRoot, "state.sqlite"),
    configPath: path.join(dataRoot, "config.json"),
    daemonStatePath: path.join(dataRoot, "daemon.json"),
    logPath: path.join(dataRoot, "mdy-daf.log")
  };
}

test("parseIso8601DurationSeconds parses YouTube durations", () => {
  assert.equal(parseIso8601DurationSeconds("PT1H1M26S"), 3686);
  assert.equal(parseIso8601DurationSeconds("PT39M7S"), 2347);
});

test("extractMdyAppCandidates extracts YouTube ids", () => {
  const candidates = extractMdyAppCandidates(
    '<iframe src="https://www.youtube.com/embed/2qz8rC9Yh_k"></iframe>',
    daf,
    "https://app.mdydafyomi.com/"
  );
  assert.equal(candidates[0].videoId, "2qz8rC9Yh_k");
  assert.equal(candidates[0].source, "mdy-app");
});

test("CompositeCandidateProvider dedupes candidates and ignores failing sources", async () => {
  const provider = new CompositeCandidateProvider([
    { async getCandidates() { throw new Error("source down"); } },
    { async getCandidates() { return [{ videoId: "a", title: "A", source: "one" }]; } },
    { async getCandidates() { return [{ videoId: "a", title: "A updated", source: "two" }]; } }
  ]);

  const candidates = await provider.getCandidates(daf);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].source, "two");
});

test("CachedCandidateProvider caches provider results", async () => {
  const database = new AppDatabase(tempPaths());
  database.migrate();
  let calls = 0;
  const provider = new CachedCandidateProvider(
    database,
    {
      async getCandidates() {
        calls += 1;
        return [{ videoId: "a", title: "A", source: "test" }];
      }
    },
    12
  );

  assert.equal((await provider.getCandidates(daf)).length, 1);
  assert.equal((await provider.getCandidates(daf)).length, 1);
  assert.equal(calls, 1);
  database.close();
});

test("YouTubeDataApiCandidateProvider returns empty without API key", async () => {
  const provider = new YouTubeDataApiCandidateProvider(undefined);
  assert.deepEqual(await provider.getCandidates(daf), []);
});

test("YouTubeDataApiCandidateProvider fetches search results and durations", async () => {
  const provider = new YouTubeDataApiCandidateProvider("key", async (input) => {
    const url = String(input);
    if (url.includes("/search")) {
      return new Response(
        JSON.stringify({
          items: [
            {
              id: { videoId: "2qz8rC9Yh_k" },
              snippet: {
                title: "Daf Yomi Menachos Daf 98 by R' Eli Stefansky",
                publishedAt: "2026-04-19T10:00:00Z"
              }
            }
          ]
        }),
        { status: 200 }
      );
    }
    return new Response(
      JSON.stringify({
        items: [{ id: "2qz8rC9Yh_k", contentDetails: { duration: "PT1H1M26S" } }]
      }),
      { status: 200 }
    );
  });

  const candidates = await provider.getCandidates(daf);
  assert.equal(candidates[0].durationSeconds, 3686);
  assert.equal(candidates[0].source, "youtube-data");
});

