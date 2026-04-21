# AGENTS.md

## Project Mission

Build a polished Claude Code plugin called `mdy-daf-companion` that keeps the latest Mercaz Daf Yomi shiur available while Claude Code works. The product should open and control the correct Rabbi Eli Stefansky Daf Yomi video, pause when Claude Code stops or asks the user for input, save playback progress, and turn daily coding time into a meaningful Daf Yomi learning rhythm.

This is not an MVP project. Treat every design and implementation choice as if the plugin may be released publicly, used by serious learners, and possibly marketed with a free tier plus optional supporter or team features.

## Non-Negotiables

- Respect Torah content and the MDY brand. Do not impersonate Mercaz Daf Yomi, Rabbi Stefansky, or official MDY apps.
- Do not download, mirror, strip, or redistribute YouTube videos. Use official YouTube playback surfaces and respect YouTube terms.
- Prefer official or public MDY sources for shiur metadata: MDY app/site, MDY YouTube channel, and stable calendar APIs.
- Build around Claude Code's native plugin system as of April 19, 2026: `.claude-plugin/plugin.json`, `skills/`, `agents/`, `hooks/hooks.json`, `monitors/`, `bin/`, and optional `userConfig`.
- Hooks must be fast and non-blocking. Long-lived playback and stats work belongs in a background daemon/process.
- Preserve user control. The plugin should be easy to pause, mute, disable, configure, or uninstall.
- Include Shabbos and Yom Tov safety controls. The default should be conservative and locally configurable.
- Store personal watch/coding stats locally by default. Any cloud sync, telemetry, or leaderboards must be explicit opt-in.
- Treat date boundaries carefully. Daf Yomi is date-sensitive, and the user may code in one time zone while MDY records in Israel.

## Product Shape

The complete product should include:

- Claude Code plugin packaging for release and local testing.
- Hooks that understand Claude's working lifecycle: session start, user prompt submit, tool loops, notifications, stop, stop failure, idle, and session end.
- A small local daemon that owns playback, YouTube state, stats, and persistence.
- A dedicated floating Electron companion window using the YouTube IFrame API.
- A resolver that finds the correct shiur for today's daf, language, and format.
- A status line or command output showing current daf, watch progress, coding time, and learning streak.
- Slash commands or skills for status, pause/resume, today's daf, stats, backfill, and settings.
- Rich local stats: watched dafim, minutes today, coding minutes today, daf streak, skipped sessions, completion percent, format breakdown, and project-level correlations.
- Release materials: README, marketplace description, privacy model, pricing/supporter options, and onboarding copy.

## Recommended Architecture

Use Node.js/TypeScript for the plugin runtime unless there is a strong reason not to. Claude Code users already run cross-platform CLI tooling, and Node gives good support for child processes, local HTTP servers, SQLite bindings, Electron launching, and JSON hook contracts.

High-level components:

- `plugin manifest`: package identity, config, and release metadata.
- `hooks`: tiny scripts that forward Claude Code events to the daemon.
- `daemon`: local HTTP/IPC server, process supervisor, resolver scheduler, stats writer.
- `player`: Electron-only floating companion app that embeds YouTube, tracks state through the IFrame API, remembers window placement, and responds to daemon commands.
- `resolver`: maps date and preferences to the best MDY video.
- `database`: SQLite in `CLAUDE_PLUGIN_DATA`.
- `status`: short formatter for Claude Code status line or `/mdy-daf-companion:status`.

## Source Notes

The current research snapshot is in:

- `docs/research/mdy-domain-research.md`
- `docs/research/claude-code-april-2026.md`

Keep those files current when new facts change the product design.

## Engineering Rules

- Use structured APIs where possible. Avoid scraping HTML if YouTube Data API, MDY app data, or a stable JSON endpoint can answer the question.
- If scraping is required, isolate it behind a source adapter with caching and tests.
- Every hook script must exit quickly and must fail open. A broken Daf plugin should never break the user's coding session.
- Never block Claude Code waiting for YouTube, Electron startup, networking, or stats writes.
- Do not add a browser video player or browser fallback. The released playback surface is the floating Electron companion; if Electron is unavailable, report setup guidance and keep Claude Code running.
- Use idempotent event handling. Claude hooks may run repeatedly or after resume.
- Design for Windows, macOS, and Linux.
- Prefer small, testable modules over one large script.
- Do not log transcript content or code diffs unless the user explicitly opts into advanced analytics. Default coding stats should use timing and event categories, not project contents.

## Release Criteria

Before public release:

- `claude plugin validate` passes.
- Hook contract tests pass for all configured lifecycle events.
- Resolver tests cover current daf, previous daf, Hebrew/English, full shiur/chazarah, and fallback behavior.
- Playback tests verify pause/resume/progress persistence with a mocked YouTube player.
- Cross-platform smoke tests cover Windows PowerShell, macOS zsh, and Linux bash.
- Privacy policy, README, and marketplace listing are present.
- No API keys are committed.

## Collaboration

When a future agent works here, read the specs first, then make a narrow implementation plan. If the work touches user-facing behavior, update the product spec or technical architecture as part of the same change.
