# MDY Daf Companion

MDY Daf Companion is a Claude Code plugin for developers who learn Daf Yomi. It resolves the latest Rabbi Eli Stefansky / Mercaz Daf Yomi shiur, opens a floating Electron YouTube companion while Claude Code works, pauses when Claude waits for you, saves your place, and tracks local learning/coding stats.

The plugin is local-first: playback uses the YouTube IFrame API, state is stored on your machine, and no prompt text, source code, transcript content, or raw tool input is stored by default.

> Independent project. Not affiliated with or endorsed by Mercaz Daf Yomi unless a future partnership is established.

## Features

- Resolves the current Daf Yomi through Hebcal.
- Finds MDY shiur candidates from layered sources:
  - MDY app page extraction.
  - Optional YouTube Data API.
  - Public MDY YouTube channel page fallback.
- Scores candidates by masechta, daf, language, format, duration, source, and exclusion rules.
- Plays through a movable, always-on-top Electron companion using the YouTube IFrame API.
- Automatically maps Claude lifecycle hooks to play/pause/prepare behavior.
- Saves playback progress and resumes from the last position.
- Tracks watched minutes, coding minutes, completion counts, and watch/coding ratio.
- Provides stats inside the Electron companion.
- Includes Shabbos guard and a Hebcal Yom Tov guard adapter.
- Supports Claude Code CLI local sessions, Claude Desktop local sessions, and local VS Code extension sessions.

## Requirements

- Claude Code with plugin support.
- Node.js 24 or newer.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.
- A local Claude Code session for automatic Electron companion control.
- For release packaging: Electron Packager through `npm run package:companion:*`.

Remote/cloud Claude sessions are not supported for local playback. The plugin detects `CLAUDE_CODE_REMOTE=true` and disables daemon startup in that environment. The product no longer opens a regular browser video player; the supported playback surface is the Electron companion.

## Install

Build and package the local runtime first:

```bash
cd mdy-daf-companion
npm install
npm run package:companion:win     # Windows x64
npm run package:companion:mac     # macOS arm64 + x64, run on macOS for signing/notarization
npm run package:companion:linux   # Linux x64
npm run check
cd ..
```

For development, `npm install` is enough because the launcher can use the local Electron runtime. For a release zip or marketplace package, include the matching `out/mdy-daf-companion-<platform>-<arch>` folder so users do not need the dev Electron dependency.

### Option 1: Local Marketplace Install

From this repository root:

```bash
claude plugin validate .
claude plugin marketplace add . --scope local
claude plugin install mdy-daf-companion@mdy-daf-companion --scope local
```

Then start or reload Claude Code:

```text
/reload-plugins
```

### Option 2: Development Session

Use this when actively editing the plugin:

```bash
claude --plugin-dir ./mdy-daf-companion
```

Claude Code gives local `--plugin-dir` plugins priority for that session.

## First Run

Inside Claude Code, run:

```text
/mdy-daf-companion:setup
```

For direct CLI setup:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
```

Prepare today’s shiur:

```text
/mdy-daf-companion:prepare
```

Open the floating companion:

```text
/mdy-daf-companion:play
```

Open the in-companion stats dashboard, or use the `Stats` button in the Electron companion:

```text
/mdy-daf-companion:dashboard
```

Check health:

```text
/mdy-daf-companion:status
```

## Direct CLI Commands

When the plugin is enabled, its `bin/` directory is added to Claude Code’s plugin PATH. The runtime command is:

```bash
mdy-daf doctor
mdy-daf setup --language english --format full --timezone America/Chicago
mdy-daf today --date 2026-04-20
mdy-daf resolve --date 2026-04-19
mdy-daf prepare
mdy-daf open-player
mdy-daf open-dashboard
mdy-daf stats
```

For local repository testing without installing:

```bash
cd mdy-daf-companion
npm run check
node dist/src/cli.js doctor
node dist/src/cli.js prepare
node dist/src/cli.js open-player
node dist/src/cli.js open-dashboard
```

## How Video Resolution Works

The resolver does not simply pick the newest upload. That would often choose the wrong video because MDY may upload Hebrew shiurim, chazarah, full Daf, and adjacent dafim close together.

Instead, the plugin:

1. Gets the Daf Yomi for the configured date/timezone from Hebcal.
2. Collects MDY video candidates from available source adapters.
3. Parses each candidate title for masechta, daf number, language, and format.
4. Excludes events, siyumim, promos, shorts, and announcements.
5. Scores candidates using daf match, masechta match, language preference, format preference, duration, and source confidence.
6. Stores the selected shiur and player progress locally.

Verified live example:

```text
2026-04-19: Menachos 98 -> Daf Yomi Menachos Daf 98 by R' Eli Stefansky
https://www.youtube.com/watch?v=2qz8rC9Yh_k
confidence 0.87
```

## Compatibility

| Surface | Support | Notes |
| --- | --- | --- |
| Claude Code CLI local | Supported | Best-tested local path. |
| Claude Desktop local | Supported target | Plugins are available in local Desktop sessions; validate Node availability. |
| VS Code extension local | Supported target | Shares Claude Code settings/hook behavior with CLI; validate in your local extension session. |
| Desktop SSH | Partial | Plugin runs on the SSH host; the Electron companion would open on that host unless a local bridge is added. |
| VS Code Remote SSH/dev containers | Partial | Same remote-host caveat as SSH. |
| Desktop remote/cloud | Unsupported | Claude docs say plugins are unavailable for remote Desktop sessions. |
| Claude Code web/cloud | Unsupported | No local daemon/Electron companion surface. |

See [Install And Compatibility](docs/install-and-compatibility.md).

## Development

```bash
cd mdy-daf-companion
npm install
npm run check
```

`npm run check` runs:

- TypeScript build.
- Node test suite.
- Claude plugin validation.
- Smoke checks.

Current automated coverage includes hook parsing, daemon auth, Electron companion rendering, in-companion dashboard data, progress persistence, resolver scoring, source adapters, stats, setup, guards, release surface checks, and plugin surface detection.

## Documentation

- [Install And Compatibility](docs/install-and-compatibility.md)
- [Product Spec](docs/product-spec.md)
- [Technical Architecture](docs/technical-architecture.md)
- [Implementation Roadmap](docs/implementation-roadmap.md)
- [Progress Ledger](docs/progress-ledger.md)
- [Release Validation Log](docs/release-validation-log.md)
- [Privacy](mdy-daf-companion/PRIVACY.md)
- [Security](mdy-daf-companion/SECURITY.md)
- [Support](mdy-daf-companion/SUPPORT.md)
- [Desktop And VS Code Validation](mdy-daf-companion/DESKTOP_AND_VSCODE_VALIDATION.md)
- [Release And Marketing](docs/release-and-marketing.md)
- [Claude Code Surface Research](docs/research/claude-code-surface-compatibility.md)
- [MDY Domain Research](docs/research/mdy-domain-research.md)

## Privacy

By default, MDY Daf Companion stores only local operational data:

- Settings.
- Resolved shiur metadata.
- Playback progress.
- Hook event categories.
- Daily watched/coding aggregates.

It does not store prompt text, transcript content, source code, file contents, or raw tool inputs by default. See [Privacy](mdy-daf-companion/PRIVACY.md).

## Release Status

This repository is a local beta release candidate. Automated checks pass, the plugin validates, the runtime is bundled, and the local marketplace manifest is present.

Still required before public launch:

- Hands-on Claude Desktop local validation on macOS and Windows.
- Hands-on VS Code extension local validation.
- SSH/dev-container port-forwarding validation.
- macOS and Linux Electron companion launch smoke tests.
- Brand/legal review before public marketing.
- Optional MDY permission or partnership outreach.

## License

MIT. See [LICENSE](mdy-daf-companion/LICENSE).
