# MDY Daf Companion

MDY Daf Companion is a Claude Code plugin that plays the latest Rabbi Eli Stefansky / Mercaz Daf Yomi shiur while Claude Code works, pauses when Claude Code waits for the user, saves progress, and tracks local learning and coding stats.

This plugin is an independent companion and is not affiliated with or endorsed by Mercaz Daf Yomi unless a future partnership is established.

## Current Runtime

Implemented:

- Claude Code plugin manifest and hook config.
- TypeScript CLI runtime.
- Local authenticated daemon.
- Hook ingestion and playback lifecycle actions.
- Daf Yomi calendar lookup through Hebcal.
- MDY YouTube channel candidate extraction.
- Resolver scoring for daf, masechta, language, format, duration, and source.
- Local YouTube IFrame player shell.
- Playback progress persistence.
- Daily watched/coding stats.
- Doctor checks.
- Cross-platform player URL launcher.

## Install For Development

```bash
npm install
npm run check
npm run smoke
claude --plugin-dir .
```

## Commands

```bash
node dist/src/cli.js doctor
node dist/src/cli.js today --date 2026-04-20
node dist/src/cli.js resolve --date 2026-04-19
node dist/src/cli.js start-daemon
node dist/src/cli.js player-url
node dist/src/cli.js open-player
node dist/src/cli.js open-dashboard
node dist/src/cli.js stats
```

## Privacy Defaults

- Stats are local-only.
- Data is stored under the Claude plugin data directory or `~/.mdy-daf-companion` in development.
- The plugin does not store prompt text, transcript content, source code, or raw tool inputs by default.
- The local daemon binds to `127.0.0.1` and uses a random bearer token.

See `PRIVACY.md`.

## Release Status

This is a strong foundation but not a public stable release yet. Remaining release work:

- Validate plugin user config schema against the exact Claude Code release target.
- Package cross-platform executable wrappers.
- Add automatic resolved-video handoff into the player.
- Add first-run settings flow.
- Run beta testing on Windows, macOS, and Linux.
- Complete brand/legal review before using MDY marks in public marketing.

## Claude Code Surface Compatibility

Best-supported targets:

- Claude Code CLI local sessions.
- Claude Code Desktop local sessions.
- Claude Code VS Code extension local sessions, pending hands-on validation.

Partial targets:

- Desktop SSH sessions.
- VS Code Remote SSH/dev containers.

Unsupported target:

- Claude Code Desktop remote/cloud sessions, because plugins are not available there.

The runtime includes a guard for `CLAUDE_CODE_REMOTE=true` and will not start the local player daemon in Claude remote/cloud environments.
