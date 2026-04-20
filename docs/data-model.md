# Data Model

Database: SQLite at `CLAUDE_PLUGIN_DATA/state.sqlite`.

## Tables

### settings

Stores user configuration.

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### dafim

Stores Daf Yomi calendar mappings.

```sql
CREATE TABLE dafim (
  date TEXT PRIMARY KEY,
  masechta TEXT NOT NULL,
  daf INTEGER NOT NULL,
  calendar_source TEXT NOT NULL,
  timezone TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### videos

Stores resolved video metadata.

```sql
CREATE TABLE videos (
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
```

### playback_progress

Tracks latest progress per video.

```sql
CREATE TABLE playback_progress (
  video_id TEXT PRIMARY KEY,
  position_seconds REAL NOT NULL,
  duration_seconds REAL,
  completed INTEGER NOT NULL DEFAULT 0,
  completion_percent REAL NOT NULL DEFAULT 0,
  last_watched_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### watch_segments

Tracks actual watch intervals.

```sql
CREATE TABLE watch_segments (
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
```

### coding_sessions

Tracks Claude Code session timing.

```sql
CREATE TABLE coding_sessions (
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
```

### hook_events

Stores compact event audit trail for debugging.

```sql
CREATE TABLE hook_events (
  id TEXT PRIMARY KEY,
  claude_session_id TEXT,
  event_name TEXT NOT NULL,
  matcher TEXT,
  received_at TEXT NOT NULL,
  action_taken TEXT,
  payload_hash TEXT,
  error TEXT
);
```

### source_cache

Caches source responses and resolver decisions.

```sql
CREATE TABLE source_cache (
  cache_key TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  value_json TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### daily_stats

Materialized day-level stats for fast display.

```sql
CREATE TABLE daily_stats (
  date TEXT PRIMARY KEY,
  watched_seconds REAL NOT NULL DEFAULT 0,
  coding_seconds REAL NOT NULL DEFAULT 0,
  dafim_completed INTEGER NOT NULL DEFAULT 0,
  videos_touched INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
```

## Derived Metrics

- Watch-to-coding ratio: `watched_seconds / coding_seconds`.
- Daf completion: latest `playback_progress.completion_percent`.
- Streak: consecutive dates with completed daf or configured threshold.
- Catch-up queue: calendar dates with missing completion before today.
- Focus windows: grouped active coding sessions with overlapping watch segments.

## Privacy Defaults

- Store `cwd_hash`, not raw `cwd`, unless the user opts into project names.
- Do not store prompt text.
- Do not store source file paths from tool calls.
- Do not store transcript contents.

