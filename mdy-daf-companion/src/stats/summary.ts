import { loadConfig } from "../core/config.js";
import { resolveRuntimePaths } from "../core/paths.js";
import { civilDateInTimezone } from "../core/time.js";
import { withDatabase, type DailyStatsRecord } from "../storage/database.js";

export interface StatsSummary {
  date: string;
  watchedMinutes: number;
  codingMinutes: number;
  dafimCompleted: number;
  videosTouched: number;
  watchToCodingRatio: number | null;
}

export function summarizeDailyStats(record: DailyStatsRecord): StatsSummary {
  const watchedMinutes = roundMinutes(record.watchedSeconds);
  const codingMinutes = roundMinutes(record.codingSeconds);
  return {
    date: record.date,
    watchedMinutes,
    codingMinutes,
    dafimCompleted: record.dafimCompleted,
    videosTouched: record.videosTouched,
    watchToCodingRatio:
      record.codingSeconds > 0 ? Number((record.watchedSeconds / record.codingSeconds).toFixed(2)) : null
  };
}

export function getTodayStatsSummary(now = new Date()): StatsSummary {
  const paths = resolveRuntimePaths();
  const config = loadConfig(paths);
  const date = civilDateInTimezone(now, config.timezone);
  return withDatabase(paths, (database) => summarizeDailyStats(database.getDailyStats(date)));
}

export function formatStatsSummary(summary: StatsSummary): string {
  const ratio = summary.watchToCodingRatio === null ? "n/a" : `${summary.watchToCodingRatio}x`;
  return [
    `MDY stats for ${summary.date}`,
    `watched: ${summary.watchedMinutes}m`,
    `coding: ${summary.codingMinutes}m`,
    `ratio: ${ratio}`,
    `dafim completed: ${summary.dafimCompleted}`,
    `videos touched: ${summary.videosTouched}`
  ].join(" | ");
}

function roundMinutes(seconds: number): number {
  return Number((seconds / 60).toFixed(1));
}

