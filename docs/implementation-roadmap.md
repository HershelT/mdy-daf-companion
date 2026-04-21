# Implementation Roadmap

This roadmap tracks the full product build, not a minimal MVP.

## Phase 1: Foundations

- Completed: Validate current Claude Code plugin schema with `claude plugin validate`.
- Completed: Set up TypeScript project inside `mdy-daf-companion`.
- Completed: Create cross-platform `mdy-daf` CLI.
- Completed: Implement config loader and plugin data paths.
- Completed: Implement SQLite migrations.
- Completed: Implement hook dispatcher that records events and exits fast.
- Completed: Add unit tests for config, time, and hook parsing.

Exit status: complete.

## Phase 2: Daemon And IPC

- Completed: Implement daemon process and state file.
- Completed: Add local HTTP API with auth token.
- Completed: Add `start-daemon`, `health`, `status`, `pause`, `resume`.
- Completed: Make hooks start daemon idempotently.
- Partial: Add crash recovery and logs.

Exit status: product-capable foundation complete.

## Phase 3: Resolver

- Completed: Implement Daf Yomi calendar adapter.
- Completed: Implement YouTube Data API adapter.
- Completed: Implement MDY app metadata adapter.
- Completed: Implement MDY YouTube channel adapter.
- Completed: Implement title parser and confidence scoring.
- Completed: Implement source cache.
- Completed: Add resolver CLI and tests with fixtures.

Exit status: complete, with the caveat that YouTube/MDY source surfaces can change and should be monitored.

## Phase 4: Player

- Completed: Build floating Electron companion page.
- Completed: Embed YouTube IFrame API.
- Completed: Implement play, pause, seek, progress events.
- Completed: Persist position.
- Completed: Add packaged Electron window launch strategy.
- Completed: Add manual controls.
- Completed: Add mark-watched control.
- Completed: Remove regular browser player and browser fallback behavior.
- Completed: Block external Electron navigations instead of opening a browser.

Exit status: complete enough for beta.

## Phase 5: Lifecycle Automation

- Completed: Map Claude events to playback states.
- Completed: Tune pause/resume policy.
- Completed: Implement idle and permission prompt behavior.
- Completed: Add Shabbos guard.
- Completed: Add Hebcal Yom Tov guard adapter.
- Completed: Add status line formatter.

Exit status: beta-ready; full Yom Tov daemon blocking should be deepened after beta.

## Phase 6: Stats

- Partial: Implement watch segments.
- Partial: Implement coding session segments.
- Completed: Materialize daily stats.
- Completed: Add stats commands.
- Completed: Add in-companion Stats dashboard.
- Pending: Add full catch-up queue.

Exit status: useful local stats implemented; catch-up planning remains a product enhancement.

## Phase 7: Product Polish

- Completed: Optional setup command with no-setup-required defaults.
- Completed: Settings guided command.
- Completed: Design pass for player and dashboard.
- Completed: Error states and `doctor` command.
- Completed: README, privacy policy, marketplace listing draft.
- Completed: Optional supporter tier messaging in release docs.

Exit status: beta-ready.

## Phase 8: Release

- Completed: Cross-platform packaging wrappers.
- Completed: Electron Packager release scripts and Windows packaged companion smoke.
- Completed: Plugin user configuration.
- Completed: npm-backed marketplace metadata.
- Completed: GitHub Actions release workflow for platform packaging and npm publish.
- Completed: Current-Daf first-run verifier.
- Completed: Versioning and changelog.
- Pending: Beta testing with real Claude Code users.
- Pending: Legal/brand review.
- Pending: Optional MDY partnership outreach.

Exit status: local beta release candidate.
