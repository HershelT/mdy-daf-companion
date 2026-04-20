import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { nowIso } from "../core/time.js";
import type { RuntimePaths } from "../core/paths.js";
import { ensureRuntimeDirs } from "../core/paths.js";
import { migrations } from "./migrations.js";

export interface HookEventRecord {
  claudeSessionId: string | null;
  eventName: string;
  matcher: string | null;
  receivedAt: string;
  actionTaken: string | null;
  payloadHash: string | null;
  error: string | null;
}

export interface PlaybackProgressRecord {
  videoId: string;
  positionSeconds: number;
  durationSeconds: number | null;
  completed: boolean;
  completionPercent: number;
  lastWatchedAt: string;
  updatedAt: string;
}

export interface DailyStatsRecord {
  date: string;
  watchedSeconds: number;
  codingSeconds: number;
  dafimCompleted: number;
  videosTouched: number;
  updatedAt: string;
}

export interface StoredVideoRecord {
  id: string;
  videoId: string;
  source: string;
  sourceUrl: string;
  title: string;
  language: string;
  format: string;
  masechta: string | null;
  daf: number | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  confidence: number;
  rawMetadataJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export class AppDatabase {
  private db: DatabaseSync;

  constructor(private readonly paths: RuntimePaths) {
    ensureRuntimeDirs(paths);
    this.db = new DatabaseSync(paths.databasePath);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  }

  migrate(): void {
    this.db.exec("BEGIN");
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL
        );
      `);

      const appliedRows = this.db
        .prepare("SELECT id FROM schema_migrations")
        .all() as Array<{ id: number }>;
      const applied = new Set(appliedRows.map((row) => row.id));

      for (const migration of migrations) {
        if (applied.has(migration.id)) {
          continue;
        }
        this.db.exec(migration.sql);
        this.db
          .prepare("INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)")
          .run(migration.id, migration.name, nowIso());
      }

      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  insertHookEvent(record: HookEventRecord): string {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO hook_events (
          id,
          claude_session_id,
          event_name,
          matcher,
          received_at,
          action_taken,
          payload_hash,
          error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        record.claudeSessionId,
        record.eventName,
        record.matcher,
        record.receivedAt,
        record.actionTaken,
        record.payloadHash,
        record.error
      );
    return id;
  }

  getHookEventCount(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM hook_events").get() as { count: number };
    return row.count;
  }

  getLatestHookEvent(): HookEventRecord | null {
    const row = this.db
      .prepare(
        `SELECT
          claude_session_id AS claudeSessionId,
          event_name AS eventName,
          matcher,
          received_at AS receivedAt,
          action_taken AS actionTaken,
          payload_hash AS payloadHash,
          error
        FROM hook_events
        ORDER BY received_at DESC
        LIMIT 1`
      )
      .get() as HookEventRecord | undefined;
    return row || null;
  }

  upsertPlaybackProgress(record: PlaybackProgressRecord): void {
    this.db
      .prepare(
        `INSERT INTO playback_progress (
          video_id,
          position_seconds,
          duration_seconds,
          completed,
          completion_percent,
          last_watched_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(video_id) DO UPDATE SET
          position_seconds = excluded.position_seconds,
          duration_seconds = excluded.duration_seconds,
          completed = excluded.completed,
          completion_percent = excluded.completion_percent,
          last_watched_at = excluded.last_watched_at,
          updated_at = excluded.updated_at`
      )
      .run(
        record.videoId,
        record.positionSeconds,
        record.durationSeconds,
        record.completed ? 1 : 0,
        record.completionPercent,
        record.lastWatchedAt,
        record.updatedAt
      );
  }

  getPlaybackProgress(videoId: string): PlaybackProgressRecord | null {
    const row = this.db
      .prepare(
        `SELECT
          video_id AS videoId,
          position_seconds AS positionSeconds,
          duration_seconds AS durationSeconds,
          completed,
          completion_percent AS completionPercent,
          last_watched_at AS lastWatchedAt,
          updated_at AS updatedAt
        FROM playback_progress
        WHERE video_id = ?`
      )
      .get(videoId) as
      | (Omit<PlaybackProgressRecord, "completed"> & { completed: number })
      | undefined;

    return row ? { ...row, completed: row.completed === 1 } : null;
  }

  incrementDailyStats(
    date: string,
    patch: {
      watchedSeconds?: number;
      codingSeconds?: number;
      dafimCompleted?: number;
      videosTouched?: number;
    },
    updatedAt = nowIso()
  ): void {
    this.db
      .prepare(
        `INSERT INTO daily_stats (
          date,
          watched_seconds,
          coding_seconds,
          dafim_completed,
          videos_touched,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          watched_seconds = watched_seconds + excluded.watched_seconds,
          coding_seconds = coding_seconds + excluded.coding_seconds,
          dafim_completed = dafim_completed + excluded.dafim_completed,
          videos_touched = videos_touched + excluded.videos_touched,
          updated_at = excluded.updated_at`
      )
      .run(
        date,
        patch.watchedSeconds || 0,
        patch.codingSeconds || 0,
        patch.dafimCompleted || 0,
        patch.videosTouched || 0,
        updatedAt
      );
  }

  getDailyStats(date: string): DailyStatsRecord {
    const row = this.db
      .prepare(
        `SELECT
          date,
          watched_seconds AS watchedSeconds,
          coding_seconds AS codingSeconds,
          dafim_completed AS dafimCompleted,
          videos_touched AS videosTouched,
          updated_at AS updatedAt
        FROM daily_stats
        WHERE date = ?`
      )
      .get(date) as DailyStatsRecord | undefined;

    return (
      row || {
        date,
        watchedSeconds: 0,
        codingSeconds: 0,
        dafimCompleted: 0,
        videosTouched: 0,
        updatedAt: nowIso()
      }
    );
  }

  setSetting(key: string, value: unknown, updatedAt = nowIso()): void {
    this.db
      .prepare(
        `INSERT INTO settings (key, value_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at`
      )
      .run(key, JSON.stringify(value), updatedAt);
  }

  getSetting<T>(key: string): T | null {
    const row = this.db
      .prepare("SELECT value_json AS valueJson FROM settings WHERE key = ?")
      .get(key) as { valueJson: string } | undefined;
    return row ? (JSON.parse(row.valueJson) as T) : null;
  }

  upsertVideo(record: Omit<StoredVideoRecord, "createdAt" | "updatedAt">, timestamp = nowIso()): void {
    this.db
      .prepare(
        `INSERT INTO videos (
          id,
          video_id,
          source,
          source_url,
          title,
          language,
          format,
          masechta,
          daf,
          duration_seconds,
          published_at,
          confidence,
          raw_metadata_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          video_id = excluded.video_id,
          source = excluded.source,
          source_url = excluded.source_url,
          title = excluded.title,
          language = excluded.language,
          format = excluded.format,
          masechta = excluded.masechta,
          daf = excluded.daf,
          duration_seconds = excluded.duration_seconds,
          published_at = excluded.published_at,
          confidence = excluded.confidence,
          raw_metadata_json = excluded.raw_metadata_json,
          updated_at = excluded.updated_at`
      )
      .run(
        record.id,
        record.videoId,
        record.source,
        record.sourceUrl,
        record.title,
        record.language,
        record.format,
        record.masechta,
        record.daf,
        record.durationSeconds,
        record.publishedAt,
        record.confidence,
        record.rawMetadataJson,
        timestamp,
        timestamp
      );
  }

  getVideo(id: string): StoredVideoRecord | null {
    const row = this.db
      .prepare(
        `SELECT
          id,
          video_id AS videoId,
          source,
          source_url AS sourceUrl,
          title,
          language,
          format,
          masechta,
          daf,
          duration_seconds AS durationSeconds,
          published_at AS publishedAt,
          confidence,
          raw_metadata_json AS rawMetadataJson,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM videos
        WHERE id = ?`
      )
      .get(id) as StoredVideoRecord | undefined;
    return row || null;
  }

  close(): void {
    this.db.close();
  }
}

export function withDatabase<T>(paths: RuntimePaths, fn: (database: AppDatabase) => T): T {
  const database = new AppDatabase(paths);
  try {
    database.migrate();
    return fn(database);
  } finally {
    database.close();
  }
}
