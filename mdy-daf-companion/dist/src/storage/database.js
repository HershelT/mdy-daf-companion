import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { nowIso } from "../core/time.js";
import { ensureRuntimeDirs } from "../core/paths.js";
import { migrations } from "./migrations.js";
export class AppDatabase {
    paths;
    db;
    constructor(paths) {
        this.paths = paths;
        ensureRuntimeDirs(paths);
        this.db = new DatabaseSync(paths.databasePath);
        this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    }
    migrate() {
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
                .all();
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
        }
        catch (error) {
            this.db.exec("ROLLBACK");
            throw error;
        }
    }
    insertHookEvent(record) {
        const id = crypto.randomUUID();
        this.db
            .prepare(`INSERT INTO hook_events (
          id,
          claude_session_id,
          event_name,
          matcher,
          received_at,
          action_taken,
          payload_hash,
          error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(id, record.claudeSessionId, record.eventName, record.matcher, record.receivedAt, record.actionTaken, record.payloadHash, record.error);
        return id;
    }
    getHookEventCount() {
        const row = this.db.prepare("SELECT COUNT(*) AS count FROM hook_events").get();
        return row.count;
    }
    getLatestHookEvent() {
        const row = this.db
            .prepare(`SELECT
          claude_session_id AS claudeSessionId,
          event_name AS eventName,
          matcher,
          received_at AS receivedAt,
          action_taken AS actionTaken,
          payload_hash AS payloadHash,
          error
        FROM hook_events
        ORDER BY received_at DESC
        LIMIT 1`)
            .get();
        return row || null;
    }
    upsertPlaybackProgress(record) {
        this.db
            .prepare(`INSERT INTO playback_progress (
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
          updated_at = excluded.updated_at`)
            .run(record.videoId, record.positionSeconds, record.durationSeconds, record.completed ? 1 : 0, record.completionPercent, record.lastWatchedAt, record.updatedAt);
    }
    getPlaybackProgress(videoId) {
        const row = this.db
            .prepare(`SELECT
          video_id AS videoId,
          position_seconds AS positionSeconds,
          duration_seconds AS durationSeconds,
          completed,
          completion_percent AS completionPercent,
          last_watched_at AS lastWatchedAt,
          updated_at AS updatedAt
        FROM playback_progress
        WHERE video_id = ?`)
            .get(videoId);
        return row ? { ...row, completed: row.completed === 1 } : null;
    }
    incrementDailyStats(date, patch, updatedAt = nowIso()) {
        this.db
            .prepare(`INSERT INTO daily_stats (
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
          updated_at = excluded.updated_at`)
            .run(date, patch.watchedSeconds || 0, patch.codingSeconds || 0, patch.dafimCompleted || 0, patch.videosTouched || 0, updatedAt);
    }
    getDailyStats(date) {
        const row = this.db
            .prepare(`SELECT
          date,
          watched_seconds AS watchedSeconds,
          coding_seconds AS codingSeconds,
          dafim_completed AS dafimCompleted,
          videos_touched AS videosTouched,
          updated_at AS updatedAt
        FROM daily_stats
        WHERE date = ?`)
            .get(date);
        return (row || {
            date,
            watchedSeconds: 0,
            codingSeconds: 0,
            dafimCompleted: 0,
            videosTouched: 0,
            updatedAt: nowIso()
        });
    }
    getDailyStatsRange(startDate, endDate) {
        return this.db
            .prepare(`SELECT
          date,
          watched_seconds AS watchedSeconds,
          coding_seconds AS codingSeconds,
          dafim_completed AS dafimCompleted,
          videos_touched AS videosTouched,
          updated_at AS updatedAt
        FROM daily_stats
        WHERE date >= ? AND date <= ?
        ORDER BY date ASC`)
            .all(startDate, endDate);
    }
    setSetting(key, value, updatedAt = nowIso()) {
        this.db
            .prepare(`INSERT INTO settings (key, value_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at`)
            .run(key, JSON.stringify(value), updatedAt);
    }
    getSetting(key) {
        const row = this.db
            .prepare("SELECT value_json AS valueJson FROM settings WHERE key = ?")
            .get(key);
        return row ? JSON.parse(row.valueJson) : null;
    }
    upsertVideo(record, timestamp = nowIso()) {
        this.db
            .prepare(`INSERT INTO videos (
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
          updated_at = excluded.updated_at`)
            .run(record.id, record.videoId, record.source, record.sourceUrl, record.title, record.language, record.format, record.masechta, record.daf, record.durationSeconds, record.publishedAt, record.confidence, record.rawMetadataJson, timestamp, timestamp);
    }
    getVideo(id) {
        const row = this.db
            .prepare(`SELECT
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
        WHERE id = ?`)
            .get(id);
        return row || null;
    }
    setSourceCache(cacheKey, source, value, expiresAt, timestamp = nowIso()) {
        this.db
            .prepare(`INSERT INTO source_cache (cache_key, source, value_json, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
          source = excluded.source,
          value_json = excluded.value_json,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at`)
            .run(cacheKey, source, JSON.stringify(value), expiresAt, timestamp, timestamp);
    }
    getSourceCache(cacheKey, now = nowIso()) {
        const row = this.db
            .prepare(`SELECT value_json AS valueJson, expires_at AS expiresAt
        FROM source_cache
        WHERE cache_key = ?`)
            .get(cacheKey);
        if (!row) {
            return null;
        }
        if (row.expiresAt && row.expiresAt <= now) {
            return null;
        }
        return JSON.parse(row.valueJson);
    }
    close() {
        this.db.close();
    }
}
export function withDatabase(paths, fn) {
    const database = new AppDatabase(paths);
    try {
        database.migrate();
        return fn(database);
    }
    finally {
        database.close();
    }
}
