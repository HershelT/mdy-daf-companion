export const migrations = [
    {
        id: 1,
        name: "initial_schema",
        sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS dafim (
        date TEXT PRIMARY KEY,
        masechta TEXT NOT NULL,
        daf INTEGER NOT NULL,
        calendar_source TEXT NOT NULL,
        timezone TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        source TEXT NOT NULL,
        source_url TEXT NOT NULL,
        title TEXT NOT NULL,
        language TEXT NOT NULL,
        format TEXT NOT NULL,
        masechta TEXT,
        daf INTEGER,
        duration_seconds INTEGER,
        published_at TEXT,
        confidence REAL NOT NULL,
        raw_metadata_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playback_progress (
        video_id TEXT PRIMARY KEY,
        position_seconds REAL NOT NULL,
        duration_seconds REAL,
        completed INTEGER NOT NULL DEFAULT 0,
        completion_percent REAL NOT NULL DEFAULT 0,
        last_watched_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS watch_segments (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        video_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        start_position_seconds REAL,
        end_position_seconds REAL,
        watched_seconds REAL DEFAULT 0,
        pause_reason TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS coding_sessions (
        id TEXT PRIMARY KEY,
        claude_session_id TEXT,
        cwd_hash TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        active_seconds REAL DEFAULT 0,
        waiting_seconds REAL DEFAULT 0,
        model TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hook_events (
        id TEXT PRIMARY KEY,
        claude_session_id TEXT,
        event_name TEXT NOT NULL,
        matcher TEXT,
        received_at TEXT NOT NULL,
        action_taken TEXT,
        payload_hash TEXT,
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS source_cache (
        cache_key TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        value_json TEXT NOT NULL,
        expires_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        watched_seconds REAL NOT NULL DEFAULT 0,
        coding_seconds REAL NOT NULL DEFAULT 0,
        dafim_completed INTEGER NOT NULL DEFAULT 0,
        videos_touched INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_hook_events_session ON hook_events(claude_session_id);
      CREATE INDEX IF NOT EXISTS idx_hook_events_received ON hook_events(received_at);
      CREATE INDEX IF NOT EXISTS idx_watch_segments_session ON watch_segments(session_id);
      CREATE INDEX IF NOT EXISTS idx_coding_sessions_claude ON coding_sessions(claude_session_id);
    `
    }
];
