# Implementation Roadmap

This roadmap is intentionally more complete than an MVP. It still sequences work so each phase leaves the project healthier and testable.

## Phase 1: Foundations

- Validate current Claude Code plugin schema with `claude plugin validate`.
- Set up TypeScript project inside `mdy-daf-companion`.
- Create cross-platform `mdy-daf` CLI.
- Implement config loader and plugin data paths.
- Implement SQLite migrations.
- Implement hook dispatcher that records events and exits fast.
- Add unit tests for config, time, and hook parsing.

Exit criteria:

- Plugin validates.
- Hooks can be invoked with sample JSON.
- Events persist locally without starting playback.

## Phase 2: Daemon And IPC

- Implement daemon process and lockfile.
- Add local HTTP or IPC API with auth token.
- Add `start-daemon`, `health`, `status`, `pause`, `resume`.
- Make hooks start daemon idempotently.
- Add crash recovery and logs.

Exit criteria:

- Repeated hooks do not create duplicate daemons.
- CLI can control daemon.
- Broken daemon never blocks Claude.

## Phase 3: Resolver

- Implement Daf Yomi calendar adapter.
- Implement YouTube Data API adapter.
- Implement MDY app metadata adapter if stable.
- Implement title parser and confidence scoring.
- Implement cache.
- Add resolver CLI and tests with recorded fixtures.

Exit criteria:

- Resolver returns correct current video for known dates.
- It can distinguish full Daf, chazarah, English, and Hebrew.
- It has a clear fallback when unsure.

## Phase 4: Player

- Build local player page.
- Embed YouTube IFrame API.
- Implement play, pause, seek, progress events.
- Persist position.
- Add window launch/reuse strategy.
- Add manual controls.

Exit criteria:

- Video opens and can be controlled by daemon.
- Progress survives player close and Claude restart.

## Phase 5: Lifecycle Automation

- Map Claude events to playback states.
- Tune pause/resume policy.
- Implement idle and permission prompt behavior.
- Add Shabbos/Yom Tov guard.
- Add status line formatter.

Exit criteria:

- Real Claude Code session plays while working and pauses when waiting.
- Guard prevents configured auto-start.
- Status line stays current.

## Phase 6: Stats

- Implement watch segments.
- Implement coding session segments.
- Materialize daily stats.
- Add stats commands.
- Add dashboard stats.
- Add catch-up queue.

Exit criteria:

- User can see today/week/cycle stats.
- Stats are accurate across pause/resume and restarts.

## Phase 7: Product Polish

- First-run setup.
- Settings UI or guided command.
- Design pass for player and dashboard.
- Error states and `doctor` command.
- README, privacy policy, marketplace listing.
- Optional supporter tier messaging.

Exit criteria:

- New user can install, configure, and succeed without reading internal specs.
- Public release assets are ready.

## Phase 8: Release

- Cross-platform packaging.
- Marketplace metadata.
- Versioning and changelog.
- Beta testing with real Claude Code users.
- Legal/brand review.
- Optional MDY partnership outreach.

Exit criteria:

- Stable public release candidate.
- Clear free/supporter model.
- No unresolved privacy or licensing concerns.

