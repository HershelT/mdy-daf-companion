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

Use real Electron companion smoke tests sparingly:

- Player page is nonblank.
- Controls are visible.
- YouTube iframe loads.
- Window layout works on small and large screens.
- `mdy-daf open-dashboard` opens the same Electron companion in Stats mode.
- No regular browser fallback exists when Electron is unavailable.

## Release Surface Tests

Guard the product decisions that should not regress:

- `/player` and `/dashboard` standalone HTML routes return 404.
- `/api/dashboard` remains available for the Electron companion.
- Runtime source does not call `shell.openExternal` or other browser opener fallbacks.
- Electron blocks external navigation instead of launching a browser.
- Packaged companion lookup prefers `out/mdy-daf-companion-<platform>-<arch>` over the development Electron runtime.
- Public npm package verification excludes generated `out/` bundles and fails on oversized tarballs.

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
- Run `npm run verify:current-daf`.
- Run `npm run verify:npm-package`.
- Optionally run `npm run package:companion:win`, `npm run package:companion:mac`, and `npm run package:companion:linux` on appropriate build hosts for native bundle smoke tests.
- Run Windows, macOS, and Linux smoke tests.
- Launch the companion through `mdy-daf open-player` and inspect the Electron capture/log.
- Confirm no secrets or API keys are committed.
- Verify README installation instructions.
- Verify uninstall leaves user data policy clear.
