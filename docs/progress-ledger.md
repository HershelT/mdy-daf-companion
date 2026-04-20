# Progress Ledger

Last updated: April 20, 2026.

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
- YouTube source link.
- Local dashboard with current shiur and stats.
- Daily watched/coding stats.
- First-run setup command.
- Shabbos guard by local timezone.
- Hebcal Yom Tov guard adapter.
- Remote/cloud environment guard.
- Cross-platform player launcher.
- Cross-platform CLI wrappers.
- Plugin `userConfig` schema.
- Release/privacy docs.
- Install/compatibility guide.
- Smoke script.
- Rich git history with no co-author trailers.

## Verified

- `npm run check` passes.
- `claude plugin validate .` passes.
- `npm run smoke` passes.
- 56 automated tests pass.
- Live Daf lookup for April 20, 2026 returns Menachos 99.
- Live resolver has successfully matched April 19, 2026 Menachos 98 to `2qz8rC9Yh_k`.
- Commit log was scanned for `Co-authored-by` trailers and none were present.

## Remaining Real-World Validation

These cannot be fully proven from one Windows local workspace alone:

- Install through Claude Desktop plugin UI in a local session.
- Run hooks from Claude Desktop local session.
- Run plugin from VS Code extension local chat panel, not just shared CLI settings.
- Validate Desktop SSH behavior and document port-forwarding path.
- Validate VS Code Remote SSH/dev container behavior.
- Test macOS local browser launch.
- Test Linux CLI browser launch.
- Confirm Node availability in Desktop environment on macOS and Windows.
- Brand/legal review before public marketing.
- Direct MDY permission or partnership outreach.

## Next Product Enhancements

- Full Yom Tov blocking in daemon using cached Hebcal guard result.
- Better catch-up queue based on historical Daf Yomi rows.
- More polished dashboard charts.
- Optional cloud sync/supporter features.
- Real marketplace publishing flow.

