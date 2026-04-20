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

export interface StatsDashboardSummary {
  today: StatsSummary;
  week: StatsSummary;
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

export function getDashboardStatsSummary(now = new Date()): StatsDashboardSummary {
  const paths = resolveRuntimePaths();
  const config = loadConfig(paths);
  const date = civilDateInTimezone(now, config.timezone);
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const startDate = civilDateInTimezone(start, config.timezone);

  return withDatabase(paths, (database) => {
    const today = summarizeDailyStats(database.getDailyStats(date));
    const rows = database.getDailyStatsRange(startDate, date);
    const week = summarizeDailyStats({
      date: `${startDate}..${date}`,
      watchedSeconds: rows.reduce((sum, row) => sum + row.watchedSeconds, 0),
      codingSeconds: rows.reduce((sum, row) => sum + row.codingSeconds, 0),
      dafimCompleted: rows.reduce((sum, row) => sum + row.dafimCompleted, 0),
      videosTouched: rows.reduce((sum, row) => sum + row.videosTouched, 0),
      updatedAt: now.toISOString()
    });
    return { today, week };
  });
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
