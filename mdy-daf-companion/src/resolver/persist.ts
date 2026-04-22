import type { AppDatabase } from "../storage/database.js";
import type { ResolvedShiur } from "./types.js";

export const CURRENT_SHIUR_SETTING = "currentShiurVideoId";
export const CURRENT_SHIUR_DATE_SETTING = "currentShiurResolvedDafDate";

export function storeResolvedShiur(database: AppDatabase, resolved: ResolvedShiur): void {
  database.upsertVideo({
    id: resolved.video.videoId,
    videoId: resolved.video.videoId,
    source: resolved.video.source,
    sourceUrl: resolved.video.url || `https://www.youtube.com/watch?v=${resolved.video.videoId}`,
    title: resolved.video.title,
    language: resolved.parsed.language || "english",
    format: resolved.parsed.format || "full",
    masechta: resolved.daf.masechta,
    daf: resolved.daf.daf,
    durationSeconds: resolved.video.durationSeconds || null,
    publishedAt: resolved.video.publishedAt || null,
    confidence: resolved.confidence,
    rawMetadataJson: JSON.stringify(resolved)
  });
  database.setSetting(CURRENT_SHIUR_SETTING, resolved.video.videoId);
  database.setSetting(CURRENT_SHIUR_DATE_SETTING, resolved.daf.date);
}

