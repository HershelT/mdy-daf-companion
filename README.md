# MDY Daf Companion

[![npm version](https://img.shields.io/npm/v/mdy-daf-companion.svg)](https://www.npmjs.com/package/mdy-daf-companion)
[![release](https://github.com/HershelT/mdy-daf-companion/actions/workflows/release.yml/badge.svg)](https://github.com/HershelT/mdy-daf-companion/actions/workflows/release.yml)
[![license](https://img.shields.io/npm/l/mdy-daf-companion.svg)](mdy-daf-companion/LICENSE)

MDY Daf Companion is a Claude Code plugin for Daf Yomi learners. It finds the current Rabbi Eli Stefansky / Mercaz Daf Yomi shiur, opens it in a movable floating Electron companion, plays while Claude Code is working, pauses when Claude waits for you, saves progress, and keeps local watch/coding stats.

This is an independent community project. It is not affiliated with or endorsed by Mercaz Daf Yomi, Rabbi Eli Stefansky, YouTube, Google, Anthropic, or Claude unless a future partnership is explicitly announced.

## Install

Install through the Claude Code marketplace:

```bash
claude plugin marketplace add HershelT/mdy-daf-companion
claude plugin install mdy-daf-companion@mdy-daf-companion
```

You can run the same commands from inside Claude Code:

```text
/plugin marketplace add HershelT/mdy-daf-companion
/plugin install mdy-daf-companion@mdy-daf-companion
```

Then start Claude Code normally and submit a prompt. The companion should open automatically when the local hook receives `UserPromptSubmit`.

Download and source locations:

| Surface | Link |
| --- | --- |
| Claude marketplace repository | [github.com/HershelT/mdy-daf-companion](https://github.com/HershelT/mdy-daf-companion) |
| npm package | [npmjs.com/package/mdy-daf-companion](https://www.npmjs.com/package/mdy-daf-companion) |
| Issues and support | [GitHub Issues](https://github.com/HershelT/mdy-daf-companion/issues) |

The npm package is the plugin distribution artifact used by the marketplace. Most users should install through Claude Code rather than running `npm install` directly.

## Requirements

- Claude Code with plugin support.
- Node.js 24 or newer available to the local Claude environment.
- Windows, macOS, or Linux local desktop session for the Electron companion.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.

Remote/cloud Claude sessions are not supported for local playback. SSH and dev-container sessions are partial because the daemon and Electron companion run wherever Claude Code is running.

## First Run

No setup command is required.

1. Claude Code loads the plugin hooks.
2. The first prompt starts or contacts the local daemon.
3. The daemon gets today's Daf Yomi from Hebcal using the configured timezone.
4. The resolver searches MDY/YouTube sources and rejects adjacent daf, chazarah, event, and unrelated videos when they do not match your preference.
5. The Electron companion opens with the YouTube shiur and resumes from saved progress if you have watched it before.
6. When Claude stops, idles, asks for permission, or ends the session, playback pauses and progress is saved.

If the companion does not open, run:

```text
/mdy-daf-companion:status
```

For a deeper local health check:

```bash
mdy-daf doctor
```

## Daily Use

Common slash commands:

| Command | What it does |
| --- | --- |
| `/mdy-daf-companion:status` | Show daemon state, current daf, video, and progress. |
| `/mdy-daf-companion:play` | Open or refocus the companion and start playback. |
| `/mdy-daf-companion:pause` | Pause and save progress. |
| `/mdy-daf-companion:dashboard` | Open the in-companion Stats view. |
| `/mdy-daf-companion:stats` | Print watched minutes, coding minutes, ratio, and daf totals. |
| `/mdy-daf-companion:setup` | Optional preferences for language, format, timezone, guard, and auto-open. |

The companion is video-first: the YouTube player fills the window, controls appear on hover/focus, the window can be dragged, and the Stats view opens inside the same Electron app. There is no regular browser player and no browser fallback.

## Preferences

Defaults are intentionally usable:

- Language: English
- Format: full Daf
- Timezone: local machine timezone
- Auto-open on prompt submit: enabled
- Shabbos/Yom Tov guard: enabled
- YouTube Data API key: optional

Change preferences with:

```text
/mdy-daf-companion:setup
```

Or from a terminal where the plugin command is available:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
```

## Privacy

MDY Daf Companion is local-first.

- The daemon binds to `127.0.0.1`.
- Local API requests use a random bearer token.
- Settings, progress, resolved metadata, and aggregate stats are stored locally.
- Prompt text, source code, file contents, transcript content, raw tool input, and raw project paths are not stored by default.
- No telemetry, cloud sync, leaderboard, or analytics service is implemented.
- YouTube videos are embedded through YouTube and are not downloaded, mirrored, transcoded, or redistributed.

Read the full policies:

- [Privacy](mdy-daf-companion/PRIVACY.md)
- [Security](mdy-daf-companion/SECURITY.md)
- [Support](mdy-daf-companion/SUPPORT.md)

## Compatibility

| Claude surface | Status | Notes |
| --- | --- | --- |
| Claude Code CLI local | Supported | Primary install and test path. |
| Claude Desktop local | Supported target | Requires Node.js to be visible to Desktop's local environment. |
| VS Code extension local | Supported target | Uses the same Claude Code plugin system; install from `/plugins`. |
| SSH/dev container | Partial | Plugin and Electron run on the remote host unless you add display/forwarding support. |
| Claude web/cloud | Unsupported | No local daemon or Electron surface. |

See [Install And Compatibility](docs/install-and-compatibility.md) for validation details.

## Update Or Remove

Update the marketplace and plugin:

```bash
claude plugin marketplace update mdy-daf-companion
claude plugin update mdy-daf-companion@mdy-daf-companion
```

Remove the plugin:

```bash
claude plugin uninstall mdy-daf-companion@mdy-daf-companion
```

Use Claude Code's plugin UI if you installed from Claude Desktop or the VS Code extension.

## Development

Clone the repository:

```bash
git clone https://github.com/HershelT/mdy-daf-companion.git
cd mdy-daf-companion/mdy-daf-companion
npm install
npm run release:prepare
```

Run locally without marketplace installation:

```bash
cd ..
claude --plugin-dir ./mdy-daf-companion
```

Useful checks:

```bash
npm run check
npm run verify:current-daf
npm run verify:npm-package
claude plugin validate .
```

The release workflow publishes through npm Trusted Publishing from GitHub Actions. Generated Electron `out/` bundles are for optional native smoke testing and are intentionally excluded from the public npm package.

## Documentation

- [Package README](mdy-daf-companion/README.md)
- [Install And Compatibility](docs/install-and-compatibility.md)
- [Technical Architecture](docs/technical-architecture.md)
- [Testing Strategy](docs/testing-strategy.md)
- [Release And Updates](docs/release-and-updates.md)
- [Release Validation Log](docs/release-validation-log.md)

## License

MIT. See [LICENSE](mdy-daf-companion/LICENSE).
