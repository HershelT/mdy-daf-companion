# Progress Ledger

Last updated: April 21, 2026.

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
- Release verification scripts for current-Daf first-run behavior and packaged companion presence.
- Packaged companion detection in `mdy-daf doctor`.
- Release-surface tests that block browser opener/dashboard regressions.
- Plugin `userConfig` schema.
- npm package metadata, public files allowlist, executable `mdy-daf` bin wrapper, and GitHub release workflow with bootstrap-token and trusted-publishing modes.
- Release/privacy docs.
- Install/compatibility guide.
- Smoke script.
- Rich git history with no co-author trailers.

## Verified

- `npm run check` passes.
- `claude plugin validate .` passes.
- `npm run smoke` passes.
- 66 automated tests pass.
- `npm run verify:current-daf` passes on a clean first-run data directory.
- Live Daf lookup for April 21, 2026 returns Menachos 100 and resolves to `Mv-DhwmEAFE`.
- Live Daf lookup for April 20, 2026 returns Menachos 99.
- Live resolver has successfully matched April 19, 2026 Menachos 98 to `2qz8rC9Yh_k`.
- Windows packaged companion smoke test resolved April 20, 2026 Menachos 99 to `H9vgAHT7aKo`, opened `out/mdy-daf-companion-win32-x64/mdy-daf-companion.exe`, and captured a nonblank YouTube render.
- Real Claude Code CLI smoke with Haiku loaded the plugin through `--plugin-dir`, exposed the slash commands, and showed `SessionStart`, `UserPromptSubmit`, and `Stop` hooks returning `prepare`, `resume`, and `pause_done`.
- `npm publish --dry-run` passed locally; first publish requires bootstrap token or manual npm auth, and later publishes can use npm trusted publishing.
- Commit log was scanned for `Co-authored-by` trailers and none were present.

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
- Public GitHub marketplace publishing after npm authentication is configured.
