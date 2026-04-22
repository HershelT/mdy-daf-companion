# Changelog

## 0.1.3 - 2026-04-22

- Added resolver-level previous-date fallback (1-day lookback) when exact current-date shiur is not yet uploaded.
- Kept strict exact daf/masechta scoring while shifting fallback logic to date orchestration.
- Hardened daemon startup to restart stale healthy daemons when runtime build metadata is newer or plugin roots do not match.
- Hydrated daemon in-memory current shiur from persisted settings at startup.
- Fixed companion player bootstrap so a shiur arriving after initial page load creates the YouTube player instead of remaining on "No shiur loaded yet".
- Added regression tests for date fallback, stale-daemon restart guards, Windows path casing handling, and persisted current-shiur companion bootstrap.
- Bumped package, plugin, marketplace, and companion shell metadata to `0.1.3`.

## 0.1.2 - 2026-04-22

- Added release/versioning guidance for future agents.
- Bumped package, plugin, and marketplace metadata to `0.1.2`.
- Hardened Electron companion URL validation, token redaction, and debug screenshot behavior.
- Removed the legacy npm token bootstrap release path now that trusted publishing is configured.
- Added a comprehensive security and stale-artifact audit prompt for future review passes.

## 0.1.0 - 2026-04-22

- Added Claude Code plugin scaffold.
- Added TypeScript runtime and Node test suite.
- Added SQLite-backed local storage.
- Added hook event ingestion.
- Added localhost daemon with bearer-token auth.
- Added playback action API.
- Added Daf Yomi calendar lookup via Hebcal.
- Added MDY YouTube channel candidate extraction.
- Added resolver scoring and title parsing.
- Added floating Electron companion with YouTube IFrame playback.
- Added playback progress persistence.
- Added daily watched/coding stats.
- Added doctor checks.
- Added packaged Electron companion detection.
- Added Electron-only launcher with no regular browser fallback.
- Added optional setup command with no-setup-required defaults.
- Added Shabbos guard and Hebcal Yom Tov guard adapter.
- Added multi-source resolver providers and SQLite cache.
- Added in-companion Stats dashboard.
- Added cross-platform CLI wrappers.
- Added Claude plugin user configuration.
- Added smoke checks and install/compatibility documentation.
- Added clean first-run current-Daf verification.
- Added npm package publishing metadata and GitHub Actions release workflow.
- Added release-surface tests to keep `/player` and `/dashboard` browser routes removed.
- Added security, support, and Desktop/VS Code validation docs.
