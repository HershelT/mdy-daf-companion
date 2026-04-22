# MDY Daf Companion

[![npm version](https://img.shields.io/npm/v/mdy-daf-companion.svg)](https://www.npmjs.com/package/mdy-daf-companion)
[![release](https://github.com/HershelT/mdy-daf-companion/actions/workflows/release.yml/badge.svg)](https://github.com/HershelT/mdy-daf-companion/actions/workflows/release.yml)
[![license](https://img.shields.io/npm/l/mdy-daf-companion.svg)](LICENSE)

Claude Code plugin for Daf Yomi learners. MDY Daf Companion resolves the current Rabbi Eli Stefansky / Mercaz Daf Yomi shiur, opens it in a floating Electron companion, plays while Claude Code works, pauses when Claude waits for you, saves progress, and shows local learning/coding stats.

This package is distributed through npm for Claude Code marketplace installation. Most users should install it from Claude Code, not with `npm install`.

Independent community project. Not affiliated with or endorsed by Mercaz Daf Yomi, Rabbi Eli Stefansky, YouTube, Google, Anthropic, or Claude unless a future partnership is explicitly announced.

## Install

```bash
claude plugin marketplace add HershelT/mdy-daf-companion
claude plugin install mdy-daf-companion@mdy-daf-companion
```

Inside Claude Code, the equivalent commands are:

```text
/plugin marketplace add HershelT/mdy-daf-companion
/plugin install mdy-daf-companion@mdy-daf-companion
```

After installation, submit any normal Claude Code prompt. The plugin starts its local daemon, resolves today's Daf Yomi, and opens the Electron companion when playback is allowed.

Links:

| Surface | Link |
| --- | --- |
| GitHub marketplace/source | [github.com/HershelT/mdy-daf-companion](https://github.com/HershelT/mdy-daf-companion) |
| npm package | [npmjs.com/package/mdy-daf-companion](https://www.npmjs.com/package/mdy-daf-companion) |
| Issues | [GitHub Issues](https://github.com/HershelT/mdy-daf-companion/issues) |

## Requirements

- Claude Code with plugin support.
- Node.js 24 or newer visible to the local Claude environment.
- Local Windows, macOS, or Linux desktop session for the Electron companion.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.

Remote/cloud Claude sessions are not supported for local playback. SSH and dev-container sessions are partial because the daemon and Electron companion run wherever Claude Code runs.

## What You Get

- Automatic current Daf Yomi lookup through Hebcal.
- MDY shiur resolution through layered MDY/YouTube source adapters.
- Exact daf matching so an adjacent upload is not silently accepted.
- Floating, movable, always-on-top Electron companion with the YouTube iframe.
- Automatic play/resume on Claude Code prompt submit.
- Automatic pause and progress save when Claude stops, idles, asks for permission, or ends a session.
- In-companion Stats view; no browser dashboard.
- Local SQLite storage for settings, source cache, playback progress, and aggregate stats.
- Shabbos/Yom Tov guard.

## Commands

| Slash command | Purpose |
| --- | --- |
| `/mdy-daf-companion:status` | Show daemon state, current daf, video, and progress. |
| `/mdy-daf-companion:play` | Open or refocus the companion and start playback. |
| `/mdy-daf-companion:pause` | Pause and save progress. |
| `/mdy-daf-companion:dashboard` | Open the Stats view inside the Electron companion. |
| `/mdy-daf-companion:stats` | Print local watched/coding stats. |
| `/mdy-daf-companion:setup` | Optional preferences for language, format, timezone, guard, and auto-open. |

CLI commands are also exposed through `mdy-daf` when available in the plugin environment:

```bash
mdy-daf status
mdy-daf play
mdy-daf pause
mdy-daf stats
mdy-daf doctor
```

## Defaults

No setup command is required.

| Setting | Default |
| --- | --- |
| Language | English |
| Format | Full Daf |
| Timezone | Local machine timezone |
| Auto-open companion | Enabled |
| Shabbos/Yom Tov guard | Enabled |
| YouTube Data API key | Optional |

Change preferences with `/mdy-daf-companion:setup`.

## Companion Behavior

The Electron companion is the only playback surface. It fills the window with the YouTube video, reveals controls on hover/focus, remembers its size and position, and can switch to the Stats view without opening a browser.

The companion intentionally stays open when Claude finishes a turn. It pauses and saves progress, leaving you free to continue watching, close the window, or let the next prompt resume automatically.

## How The Shiur Is Chosen

The resolver does not blindly choose the newest upload. It:

1. Computes the current Daf Yomi date in your configured timezone.
2. Asks Hebcal for the expected masechta and daf.
3. Collects candidates from MDY app/page data, optional YouTube Data API metadata, and public MDY YouTube channel data.
4. Parses titles for masechta, daf, language, format, duration, and exclusion hints.
5. Rejects mismatched daf/masechta, events, promos, unrelated shorts, donation clips, and announcements.
6. Stores the selected video and playback progress locally.

## Privacy And Security

- Local daemon binds to `127.0.0.1`.
- Local API requests require a random bearer token.
- Prompt text, source code, file contents, transcript content, raw tool input, and raw project paths are not stored by default.
- No telemetry is implemented.
- YouTube videos are embedded, not downloaded or redistributed.
- External Electron navigation and popups are blocked.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), and [SUPPORT.md](SUPPORT.md).

## Compatibility

| Surface | Status |
| --- | --- |
| Claude Code CLI local | Supported |
| Claude Desktop local | Supported target |
| VS Code extension local | Supported target |
| SSH/dev container | Partial |
| Claude web/cloud | Unsupported |

Detailed validation notes are in [DESKTOP_AND_VSCODE_VALIDATION.md](DESKTOP_AND_VSCODE_VALIDATION.md).

## Troubleshooting

Run:

```text
/mdy-daf-companion:status
```

Or, from a terminal with the plugin command available:

```bash
mdy-daf doctor
```

Common fixes:

- Reload plugins with `/reload-plugins` after installation or update.
- Confirm Node.js 24+ is visible to the local Claude environment.
- Use a local Claude session if you expect the Electron companion to open on your desktop.
- Check internet access to Hebcal, YouTube, and public MDY metadata surfaces.

## Development

```bash
git clone https://github.com/HershelT/mdy-daf-companion.git
cd mdy-daf-companion/mdy-daf-companion
npm install
npm run release:prepare
```

Run locally before marketplace installation:

```bash
cd ..
claude --plugin-dir ./mdy-daf-companion
```

Release checks:

```bash
npm run check
npm run verify:current-daf
npm run verify:npm-package
```

This package is published with npm Trusted Publishing from GitHub Actions. Generated native Electron `out/` bundles are optional smoke-test artifacts and are excluded from the npm package.

## License

MIT. See [LICENSE](LICENSE).
