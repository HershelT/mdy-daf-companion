# MDY Daf Companion Plugin

MDY Daf Companion is a Claude Code plugin that plays the latest Rabbi Eli Stefansky / Mercaz Daf Yomi shiur in a floating Electron companion while Claude Code works, pauses when Claude waits for you, saves progress, and tracks local Daf Yomi/coding stats.

This plugin is independent and is not affiliated with or endorsed by Mercaz Daf Yomi unless a future partnership is established.

## What It Does

- Resolves today’s Daf Yomi.
- Finds the best matching MDY shiur.
- Opens a floating, movable Electron companion with an embedded YouTube IFrame player.
- Pauses when Claude Code stops, asks for permission, idles, or ends the session.
- Resumes from saved progress.
- Tracks watched minutes, coding minutes, dafim completed, and watch/coding ratio.
- Shows stats inside the Electron companion.
- Keeps stats local by default.

## Quick Start

For a packaged local test, build the runtime and companion first:

```bash
npm install
npm run package:companion:win     # Windows x64
npm run package:companion:mac     # macOS arm64 + x64
npm run package:companion:linux   # Linux x64
npm run check
```

After installation, run these inside Claude Code:

```text
/mdy-daf-companion:setup
/mdy-daf-companion:prepare
/mdy-daf-companion:play
/mdy-daf-companion:dashboard
/mdy-daf-companion:stats
```

Equivalent CLI commands:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
mdy-daf prepare
mdy-daf open-player
mdy-daf open-dashboard
mdy-daf stats
mdy-daf doctor
```

## Configuration

Claude Code prompts for these plugin options when supported by the installation surface:

- `language`: `english` or `hebrew`.
- `format`: `full` or `chazarah`.
- `timezone`: for Daf Yomi date and daily stats.
- `auto_open_player`: whether Claude work should open the player automatically.
- `youtube_api_key`: optional, improves YouTube metadata lookup.

You can also configure directly:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
```

## Commands

| Command | Purpose |
| --- | --- |
| `mdy-daf doctor` | Validate runtime, plugin files, data directory, and SQLite. |
| `mdy-daf setup` | Save language, format, timezone, guard, and autoplay preferences. |
| `mdy-daf today` | Print the Daf Yomi for a date. |
| `mdy-daf resolve` | Resolve a date to the best MDY video candidate. |
| `mdy-daf prepare` | Resolve and store the current shiur for playback. |
| `mdy-daf open-player` | Start daemon and open the floating Electron companion. |
| `mdy-daf open-dashboard` | Start daemon and open the Electron companion directly to Stats. |
| `mdy-daf stats` | Print today’s local watched/coding stats. |

## Runtime Model

- Hooks forward Claude lifecycle events to a local daemon.
- The daemon binds to `127.0.0.1` and requires a random bearer token.
- Persistent data goes under `${CLAUDE_PLUGIN_DATA}`.
- The Electron companion uses the YouTube IFrame API.
- Video files are never downloaded, mirrored, or redistributed.
- No regular browser player or browser dashboard is shipped. `open-dashboard` opens the Stats view inside the same Electron companion.

## Compatibility

Supported targets:

- Claude Code CLI local sessions.
- Claude Desktop local sessions.
- Claude Code VS Code extension local sessions.

Partial targets:

- Desktop SSH sessions.
- VS Code Remote SSH/dev containers.

Unsupported:

- Claude Desktop remote/cloud sessions.
- Claude Code web/cloud sessions for local playback.

## Development

```bash
npm install
npm run check
```

`npm run check` builds TypeScript, runs tests, validates the plugin manifest, and runs smoke checks.

`npm run package:companion:win`, `npm run package:companion:mac`, and `npm run package:companion:linux` produce platform folders under `out/`. Release archives should include the matching packaged folder; source-only development can fall back to the local `electron` dependency after `npm install`.

## Privacy

See [PRIVACY.md](PRIVACY.md). Default behavior is local-only and does not store prompt text, source code, transcript content, file contents, or raw tool inputs.
