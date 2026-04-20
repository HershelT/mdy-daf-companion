# Testing Strategy

## Test Philosophy

This plugin should fail gently. A broken resolver or player should never interrupt Claude Code work. Tests should focus on lifecycle correctness, date correctness, privacy, and graceful degradation.

## Unit Tests

Areas:

- Hook JSON parsing.
- Event-to-action mapping.
- Config validation.
- Timezone and date handling.
- Daf Yomi date mapping.
- YouTube title parsing.
- Confidence scoring.
- SQLite migrations.
- Stats aggregation.

## Integration Tests

Areas:

- Hook dispatcher starts daemon and posts event.
- Daemon API accepts commands and updates state.
- CLI reads status from daemon.
- Progress updates persist to SQLite.
- Resolver uses cache when offline.
- Status formatter returns quickly.

## Player Tests

Use mocked YouTube IFrame API for deterministic tests:

- Load video.
- Play.
- Pause.
- Seek.
- Emit progress.
- Save completion.

Use real browser smoke tests sparingly:

- Player page is nonblank.
- Controls are visible.
- YouTube iframe loads.
- Window layout works on small and large screens.

## Claude Code Hook Contract Tests

Create fixtures for:

- `SessionStart`
- `UserPromptSubmit`
- `Notification` with `permission_prompt`
- `Notification` with `idle_prompt`
- `Stop`
- `StopFailure`
- `PreCompact`
- `PostCompact`
- `SessionEnd`

Each fixture should assert:

- Hook exits 0.
- Hook returns quickly.
- Daemon event is recorded.
- Expected playback action is queued.

## Date And Calendar Tests

Cover:

- Local date around midnight.
- Israel date option.
- Daylight saving changes.
- April 19, 2026 and April 20, 2026 Menachos boundary.
- Missed daf catch-up behavior.
- Shabbos/Yom Tov guard windows.

## Privacy Tests

Assert by default:

- No prompt text is stored.
- No transcript content is stored.
- No source code or file contents are stored.
- CWD is hashed or omitted.
- Network calls are limited to configured source adapters.

## Release Validation

Before release:

- Run `claude plugin validate`.
- Run unit and integration tests.
- Run Windows, macOS, and Linux smoke tests.
- Confirm no secrets or API keys are committed.
- Verify README installation instructions.
- Verify uninstall leaves user data policy clear.

