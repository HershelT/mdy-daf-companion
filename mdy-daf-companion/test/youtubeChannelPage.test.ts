import assert from "node:assert/strict";
import test from "node:test";
import { extractYouTubeChannelCandidates } from "../src/resolver/youtubeChannelPage.js";

test("extractYouTubeChannelCandidates parses renderer candidates", () => {
  const html = `
    "videoRenderer":{
      "videoId":"2qz8rC9Yh_k",
      "title":{"runs":[{"text":"English Full Daf Menachos Daf 98"}]},
      "publishedTimeText":{"simpleText":"1 day ago"},
      "lengthText":{"accessibility":{"accessibilityData":{"label":"1 hour, 1 minute, 26 seconds"}}}
    },"trackingParams":"abc"
    "videoRenderer":{
      "videoId":"x7k9w2hUzXA",
      "title":{"runs":[{"text":"English Chazarah Menachos Daf 98"}]},
      "lengthText":{"accessibility":{"accessibilityData":{"label":"39 minutes, 7 seconds"}}}
    },"trackingParams":"def"
  `;

  const candidates = extractYouTubeChannelCandidates(html);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].videoId, "2qz8rC9Yh_k");
  assert.equal(candidates[0].durationSeconds, 3686);
  assert.equal(candidates[1].title, "English Chazarah Menachos Daf 98");
});

test("extractYouTubeChannelCandidates falls back to loose nearby titles", () => {
  const html = `
    {"videoId":"abc123XYZ","other":"value","title":{"runs":[{"text":"Hebrew Menachos Daf 99"}]}}
  `;

  const candidates = extractYouTubeChannelCandidates(html);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "Hebrew Menachos Daf 99");
});

