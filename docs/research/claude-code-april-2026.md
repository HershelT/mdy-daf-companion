# Claude Code Extension Surface As Of April 19, 2026

Research date: April 19, 2026.

Primary official docs consulted:

- `https://code.claude.com/docs/en/plugins`
- `https://code.claude.com/docs/en/plugins-reference`
- `https://code.claude.com/docs/en/hooks`
- `https://code.claude.com/docs/en/statusline`
- `https://code.claude.com/docs/en/skills`
- `https://code.claude.com/docs/en/mcp`
- Claude Code "What's New" pages for late March and April 2026.

## Recommended Packaging

Use a Claude Code plugin, not a loose project-level `.claude/` setup.

Why:

- Plugins are designed for reusable, shareable extensions.
- Plugins are namespaced.
- Plugins can bundle skills, agents, hooks, commands, MCP servers, monitors, settings, and executables.
- Plugins can be tested locally with `claude --plugin-dir ./mdy-daf-companion`.
- Plugins are the right path for marketplace distribution or public release.

Canonical structure:

```text
mdy-daf-companion/
  .claude-plugin/
    plugin.json
  skills/
  commands/
  agents/
  hooks/
    hooks.json
  monitors/
    monitors.json
  bin/
  scripts/
  settings.json
```

Only `plugin.json` belongs inside `.claude-plugin/`. Other component directories belong at the plugin root.

## Hooks

Claude Code hooks are the right trigger mechanism for playback lifecycle.

Relevant events:

- `SessionStart`: start or resume a session.
- `UserPromptSubmit`: user has submitted a new prompt, which is a good moment to resume playback if enabled.
- `Notification`: fires for events such as permission prompts and idle prompts. Use this to pause playback when Claude is waiting for the user.
- `Stop`: Claude finished responding. Pause and save progress.
- `StopFailure`: Claude hit a stop failure. Pause and save progress.
- `SessionEnd`: final cleanup and stats close-out.
- `PreCompact` and `PostCompact`: save state around context compaction.
- `SubagentStart` and `SubagentStop`: optional future signal for background agent activity.
- `PreToolUse` and `PostToolUse`: useful for timing coding activity, but should be sampled or handled lightly.

Hook design:

- Hook scripts receive JSON on stdin.
- Hook scripts should forward events to the local daemon and exit fast.
- Hook failures should never block Claude Code.
- Use event idempotency by session id, hook event name, timestamp, and optional transcript path.

## Plugin Data And Root Variables

Claude Code plugin hooks can use plugin-scoped paths such as:

- `CLAUDE_PLUGIN_ROOT`: plugin installation root.
- `CLAUDE_PLUGIN_DATA`: plugin data directory.

Store state under `CLAUDE_PLUGIN_DATA`, not in the user's project.

## `bin/` Executables

Recent Claude Code plugin support adds plugin `bin/` executables to PATH while the plugin is enabled. This lets commands and hooks call a short command name such as:

```bash
mdy-daf status
mdy-daf pause
mdy-daf resume
```

The production implementation should ship a cross-platform executable strategy:

- Node entrypoint for all platforms.
- Shell wrapper for macOS/Linux if needed.
- `.cmd` wrapper for Windows if needed.

## Skills

Skills in plugins live under `skills/<skill-name>/SKILL.md` and are namespaced by the plugin name. This project should use skills for user-facing Claude behaviors, not as the main playback engine.

Useful skills:

- Resolve or explain today's daf/shiur.
- Manage playback state through the CLI/daemon.
- Analyze watch and coding stats.
- Help configure release-safe settings.

## Agents

Custom agents are useful for development and public contribution workflows:

- Plugin engineer.
- Player engineer.
- Resolver/research engineer.
- Stats/data engineer.
- QA/release engineer.

They should not be required for normal end-user playback.

## Status Line

Claude Code supports custom status line commands. The docs describe a refresh interval that can re-run the status command every N seconds. This product should expose a compact status formatter:

```text
MDY Menachos 99  18m/61m  coding 42m  daf streak 6
```

Status line output should be short, local-only, and resilient if the daemon is not running.

## Monitors

Plugin monitors can run background commands and send notifications to Claude. This product should be careful with monitors because the primary background process is a playback daemon, not a stream of messages to Claude.

Use monitors only if they improve reliability, such as:

- Confirm the daemon is healthy.
- Notify Claude if plugin setup is incomplete.

Avoid noisy monitor output.

## User Config

Recent plugin docs/release notes point to plugin `userConfig` support. The public release should expose user-configurable settings for:

- Language preference.
- Shiur format preference.
- Start behavior.
- Pause behavior.
- Shabbos/Yom Tov guard.
- Browser profile/window mode.
- Stats privacy.
- Optional YouTube API key.

Until the exact manifest schema is finalized for implementation, keep config schema documented in `docs/product-spec.md` and validate against official docs before release.

## Design Decision

The product should be a Claude Code plugin with:

- Native hooks for lifecycle signals.
- Local daemon for durable playback and stats.
- YouTube IFrame player for compliant playback.
- SQLite local database.
- Skills and commands for user-facing control.
- Status line integration for glanceable progress.

