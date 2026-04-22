# Progress Ledger

Last updated: April 22, 2026.

## Completed

- Product research and MDY domain overview.
- Claude Code plugin research as of April 2026.
- Claude Code surface compatibility research for CLI, Desktop, VS Code, SSH, and remote/cloud.
- Plugin scaffold with manifest, commands, skills, agents, hooks, and scripts.
- TypeScript runtime with strict build.
- SQLite storage with migrations.
- Hook event ingestion.
- Local authenticated daemon.
- Playback action API.
- Current shiur persistence.
- Daf Yomi calendar lookup through Hebcal.
- MDY YouTube channel page extraction.
- Optional YouTube Data API adapter.
- MDY app page extraction adapter.
- Composite fail-open candidate provider.
- SQLite source cache.
- Resolver scoring across daf, masechta, language, format, source, duration, and exclusions.
- Local YouTube IFrame player shell.
- Player resume position.
- Player seek controls.
- Mark-watched control.
- Electron-only companion route with no regular browser player fallback.
- In-companion Stats dashboard with current shiur and watched/coding metrics.
- Daily watched/coding stats.
- Optional setup command with no-setup-required defaults.
- Shabbos guard by local timezone.
- Hebcal Yom Tov guard adapter.
- Remote/cloud environment guard.
- Cross-platform player launcher.
- Cross-platform CLI wrappers.
- Electron Packager scripts for Windows, macOS, and Linux companion bundles.
- Release verification scripts for current-Daf first-run behavior, optional packaged companion presence, and npm package surface.
- Packaged companion detection in `mdy-daf doctor`.
- Release-surface tests that block browser opener/dashboard regressions.
- Date-level resolver fallback for post-midnight pre-upload gaps while preserving strict exact-daf scoring.
- Stale detached-daemon restart guard based on runtime identity and build freshness.
- Daemon startup hydration of in-memory current-shiur state from persisted settings.
- Companion page bootstrap for late-arriving shiur video IDs after initial empty render.
- Plugin `userConfig` schema.
- npm package metadata, public files allowlist, executable `mdy-daf` bin wrapper, and GitHub release workflow using trusted publishing.
- npm package guard that blocks generated Electron `out/` bundles from public publish.
- Release/privacy docs.
- Install/compatibility guide.
- Smoke script.
- Rich git history with no co-author trailers.

## Verified

- `npm run check` passes.
- `claude plugin validate .` passes.
- `npm run smoke` passes.
- 69 automated tests pass.
- `npm run verify:current-daf` passes on a clean first-run data directory.
- Live Daf lookup for April 21, 2026 returns Menachos 100 and resolves to `Mv-DhwmEAFE`.
- Live Daf lookup for April 20, 2026 returns Menachos 99.
- Live resolver has successfully matched April 19, 2026 Menachos 98 to `2qz8rC9Yh_k`.
- Windows packaged companion smoke test resolved April 20, 2026 Menachos 99 to `H9vgAHT7aKo`, opened `out/mdy-daf-companion-win32-x64/mdy-daf-companion.exe`, and rendered nonblank YouTube content.
- Real Claude Code CLI smoke with Haiku loaded the plugin through `--plugin-dir`, exposed the slash commands, and showed `SessionStart`, `UserPromptSubmit`, and `Stop` hooks returning `prepare`, `resume`, and `pause_done`.
- `npm run verify:npm-package` passed locally with generated `out/` bundles excluded from the tarball; public publishing now uses npm trusted publishing without a long-lived `NPM_TOKEN`.
- GitHub Actions publish failure `24757445924` was diagnosed as oversized tarball publication, not token authentication; release workflow now publishes the lean runtime-dependency package.
- Electron companion logs now redact URL tokens and API-key-like query parameters; debug renderer screenshots require `MDY_DAF_DEBUG_CAPTURE=1`.
- Commit log was scanned for `Co-authored-by` trailers and none were present.
- Targeted resolver/daemon/player regression suites pass for date fallback, stale-daemon replacement, Windows path-case handling, and persisted-current-shiur companion bootstrap.

## Remaining Real-World Validation

These cannot be fully proven from one Windows local workspace alone:

- Install through Claude Desktop plugin UI in a local session.
- Run hooks from Claude Desktop local session.
- Run plugin from VS Code extension local chat panel, not just shared CLI settings.
- Validate Desktop SSH behavior and document port-forwarding path.
- Validate VS Code Remote SSH/dev container behavior.
- Test macOS local Electron companion launch.
- Test Linux CLI Electron companion launch.
- Confirm Node availability in Desktop environment on macOS and Windows.
- Sign/notarize macOS release bundles and sign Windows release bundles before public distribution.
- Brand/legal review before public marketing.
- Direct MDY permission or partnership outreach.

## Next Product Enhancements

- Better catch-up queue based on historical Daf Yomi rows.
- More polished dashboard charts beyond the current compact Stats view.
- Optional cloud sync/supporter features.
- Optional future GitHub release assets for signed native bundles.
