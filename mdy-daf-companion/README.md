# MDY Daf Companion

MDY Daf Companion is a Claude Code plugin for Daf Yomi learners. It resolves the correct Rabbi Eli Stefansky / Mercaz Daf Yomi shiur, opens a floating Electron companion while Claude Code works, pauses when Claude waits for you, saves progress, and keeps local watch/coding stats.

This is an independent project. It is not affiliated with or endorsed by Mercaz Daf Yomi, Rabbi Eli Stefansky, YouTube, Google, Anthropic, or Claude unless a future partnership is explicitly announced.

## Highlights

- Resolves the current Daf Yomi through Hebcal.
- Finds the best matching MDY shiur from layered MDY/YouTube source adapters.
- Uses a floating, movable, always-on-top Electron companion with the official YouTube iframe.
- Starts or resumes playback from Claude Code lifecycle hooks.
- Pauses and saves progress when Claude stops, idles, asks for permission, or ends a session.
- Keeps the companion open and paused after Claude stops, so the learner can keep watching manually.
- Shows Stats inside the Electron companion. There is no browser dashboard.
- Stores settings, progress, and aggregate stats locally by default.
- Includes Shabbos/Yom Tov guard behavior.
- Ships commands, skills, agents, hooks, local daemon, SQLite storage, and packaged Electron scripts.

## Requirements

- Claude Code with plugin support.
- Node.js 24 or newer.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.
- A local Claude Code session for automatic Electron playback.
- A packaged Electron companion for release installs, or the local `electron` dev dependency for development.

Remote/cloud Claude sessions are not supported for local playback. SSH/dev-container sessions are partial because the daemon and Electron companion run wherever Claude Code runs.

## Install

From the repository root:

```bash
cd mdy-daf-companion
npm install
npm run package:companion:win
npm run check
cd ..
claude plugin validate .
claude plugin marketplace add . --scope local
claude plugin install mdy-daf-companion@mdy-daf-companion --scope local
```

On macOS or Linux, replace the packaging command:

```bash
npm run package:companion:mac
npm run package:companion:linux
```

For one-session development without installing into a marketplace:

```bash
claude --plugin-dir ./mdy-daf-companion
```

After install, reload plugins if Claude Code is already running:

```text
/reload-plugins
```

## First Run

Inside Claude Code:

```text
/mdy-daf-companion:setup
/mdy-daf-companion:prepare
/mdy-daf-companion:play
```

Open the in-companion stats view:

```text
/mdy-daf-companion:dashboard
```

Check health:

```text
/mdy-daf-companion:status
```

Equivalent direct CLI setup:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
mdy-daf prepare
mdy-daf open-player
mdy-daf open-dashboard
mdy-daf doctor
```

## How Automatic Playback Works

Claude Code fires lifecycle hooks. MDY Daf Companion maps those events to daemon actions:

| Claude Code event | Companion behavior |
| --- | --- |
| `SessionStart` | Start daemon and prepare today's shiur. |
| `UserPromptSubmit` | Resume playback and auto-open companion if enabled and safe. |
| `Notification` permission/idle prompt | Pause and save progress. |
| `Stop` | Pause and save progress. |
| `StopFailure` | Pause and save progress. |
| `PreCompact` / `PostCompact` | Flush state. |
| `SessionEnd` | Pause/flush state. |

The companion intentionally stays open when Claude stops. Best practice here is to pause, save, and leave the learner in control. Auto-closing would interrupt someone who wants to keep watching, and it would make the window jump in and out during normal Claude turns. Use the visible top-right `X` to close it, `_` to minimize, or the pin control to toggle always-on-top.

## Window Behavior

- The video fills the companion window.
- The companion can be dragged by the top overlay area.
- Pin, minimize, and close controls are always available in the top-right corner.
- Playback controls appear as an overlay while hovering or focusing the window.
- The `Stats` button switches the same Electron companion into the dashboard view.
- Window size, position, and always-on-top state are saved locally.
- Closing the companion does not stop the daemon. The next prompt or `/play` can reopen it.

## Commands

| Command | Purpose |
| --- | --- |
| `mdy-daf doctor` | Validate runtime, plugin files, Electron companion, data directory, and SQLite. |
| `mdy-daf setup` | Save language, format, timezone, guard, and auto-open preferences. |
| `mdy-daf today` | Print the Daf Yomi for a date. |
| `mdy-daf resolve` | Resolve a date to the best MDY video candidate. |
| `mdy-daf prepare` | Resolve and store the current shiur. |
| `mdy-daf open-player` | Start daemon and open the floating Electron companion. |
| `mdy-daf open-dashboard` | Open the same Electron companion directly to Stats. |
| `mdy-daf play` / `resume` | Set daemon playback state to playing. |
| `mdy-daf pause` | Pause and save progress. |
| `mdy-daf stats` | Print today's local watched/coding stats. |
| `mdy-daf status` | Print daemon, current daf, and progress status. |

## Slash Commands

After installation, use:

```text
/mdy-daf-companion:setup
/mdy-daf-companion:prepare
/mdy-daf-companion:play
/mdy-daf-companion:pause
/mdy-daf-companion:dashboard
/mdy-daf-companion:stats
/mdy-daf-companion:status
```

## Configuration

Claude Code plugin config can provide:

- `language`: `english` or `hebrew`.
- `format`: `full` or `chazarah`.
- `timezone`: IANA timezone for Daf Yomi and daily stats.
- `auto_open_player`: whether prompt-submit should open the companion automatically.
- `youtube_api_key`: optional sensitive key for stronger YouTube Data API metadata lookup.

Direct CLI setup:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
```

## How Shiur Resolution Works

The resolver does not blindly pick the newest upload. It:

1. Gets the Daf Yomi for the configured date/timezone from Hebcal.
2. Collects candidates from MDY app/page extraction, optional YouTube Data API, and MDY YouTube channel fallback.
3. Parses titles for masechta, daf, language, format, duration, and exclusion hints.
4. Excludes events, promos, unrelated shorts, donation clips, and announcements.
5. Scores daf match, masechta match, language preference, format preference, source confidence, and duration.
6. Stores the selected shiur and playback progress in local SQLite.

## Compatibility

| Surface | Status | Notes |
| --- | --- | --- |
| Claude Code CLI local | Supported | Best-tested path. |
| Claude Desktop local | Supported target | Validate Node visibility in Desktop's local environment. |
| VS Code extension local | Supported target | Manage plugin with `/plugins`; verify hooks from the chat panel. |
| Desktop SSH | Partial | Plugin runs on the SSH host. Electron appears there unless a local bridge is added. |
| VS Code Remote SSH/dev container | Partial | Same remote-host caveat. |
| Desktop remote/cloud | Unsupported | Plugins are not available for Desktop remote sessions. |
| Claude Code web/cloud | Unsupported | No local daemon/Electron surface. |

Detailed Desktop and VS Code steps are in [DESKTOP_AND_VSCODE_VALIDATION.md](DESKTOP_AND_VSCODE_VALIDATION.md).

## Development

```bash
npm install
npm run build
npm test
npm run validate:plugin
npm run smoke
npm run check
```

Useful local commands:

```bash
node dist/src/cli.js doctor
node dist/src/cli.js prepare
node dist/src/cli.js open-player
node dist/src/cli.js open-dashboard
```

Package commands:

```bash
npm run package:companion:win
npm run package:companion:mac
npm run package:companion:linux
```

`out/` contains generated Electron bundles and is intentionally ignored by git.

## Privacy

Default behavior is local-only. The plugin stores:

- Settings.
- Resolved shiur metadata.
- Playback progress.
- Hook event categories.
- Daily watched/coding aggregates.

The plugin does not store prompt text, source code, transcript content, file contents, raw tool inputs, or raw project paths by default.

See [PRIVACY.md](PRIVACY.md).

## Security

- Local daemon binds to `127.0.0.1`.
- Local API calls require a random bearer token.
- Electron blocks external navigation and popups.
- No regular browser playback fallback is shipped.
- YouTube videos are embedded, not downloaded or redistributed.
- No telemetry is implemented.

See [SECURITY.md](SECURITY.md).

## Support

Start with:

```bash
mdy-daf doctor
mdy-daf status
```

For development:

```bash
npm run check
npm audit
```

See [SUPPORT.md](SUPPORT.md).

## Release Status

This is a local beta release candidate. Automated tests, plugin validation, smoke checks, Windows packaged companion launch, and real Claude Code CLI hook smoke have passed. Remaining public-release validation includes hands-on Claude Desktop local, VS Code extension local, macOS package launch/signing, Linux package launch, and brand/legal review.

## License

MIT. See [LICENSE](LICENSE).
