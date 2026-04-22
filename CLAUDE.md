# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MDY Daf Companion is a Claude Code plugin for developers learning Daf Yomi. It automatically plays the latest Rabbi Eli Stefansky shiur in a floating Electron companion window, pauses when Claude waits, saves progress, and tracks local learning/coding stats. The entire runtime is local-first: videos play through the YouTube IFrame API, all state persists locally, and no prompt text or source code is stored.

This is an independent project. Do not imply it is official Mercaz Daf Yomi, Rabbi Eli Stefansky, YouTube, Google, Anthropic, or Claude software unless a documented partnership exists.

## Essential Commands

### Development Workflow

```bash
cd mdy-daf-companion
npm install              # Install dependencies
npm run build            # Compile TypeScript to dist/
npm run test             # Run test suite
npm run validate:plugin  # Validate plugin manifest
npm run smoke            # Run smoke tests
npm run check            # Run all checks: test + validate + smoke
```

### Running Individual Tests

```bash
npm run build && node --test "dist/test/resolver.test.js"
npm run build && node --test "dist/test/daemon.test.js"
npm run build && node --test "dist/test/hooks.test.ts"
```

### Local Development and Testing

```bash
# Direct CLI testing (no installation needed)
node dist/src/cli.js doctor
node dist/src/cli.js today
node dist/src/cli.js resolve
node dist/src/cli.js open-player
node dist/src/cli.js open-dashboard
node dist/src/cli.js stats

# Run daemon directly for debugging
node dist/src/cli.js daemon

# Start the daemon process
node dist/src/cli.js start-daemon
```

### Plugin Installation and Testing

```bash
# Optional native companion packaging for local UI validation
npm run package:companion:win    # Windows x64
npm run package:companion:mac    # macOS arm64 + x64
npm run package:companion:linux  # Linux x64
npm run verify:current-daf       # Clean first-run current-daf verification

# Run Claude Code with the plugin directory directly for local development
cd ..
claude --plugin-dir ./mdy-daf-companion

# After npm publication and GitHub marketplace push
claude plugin marketplace add HershelT/mdy-daf-companion
claude plugin install mdy-daf-companion@mdy-daf-companion
```

## High-Level Architecture

The plugin uses a three-tier architecture:

1. **Claude Code Integration** → Hooks trigger on lifecycle events (SessionStart, UserPromptSubmit, Stop, SessionEnd, etc.)
2. **Local Daemon** (Node.js) → Single background process that owns state, resolves videos, manages playback, and stores stats
3. **Electron Companion** → Floating window that embeds YouTube IFrame API and displays dashboard/stats

```
Claude Code
    ↓ (hooks)
CLI (mdy-daf)
    ↓ 
Daemon (local HTTP API)
    ├→ Resolver (finds MDY shiur candidates, scores them)
    ├→ Database (SQLite: progress, stats, cached metadata)
    ├→ Electron Companion (video playback + dashboard)
    └→ Status formatter
```

### Key Module Breakdown

**src/resolver/** — Finds the correct MDY video for the current Daf Yomi date:
- `dafCalendar.ts`: Fetches Daf Yomi schedule from Hebcal
- `providers.ts`, `mdyApp.ts`, `youtubeDataApi.ts`, `youtubeChannelPage.ts`: Source adapters for video metadata
- `titleParser.ts`: Extracts masechta/daf from video titles
- `scoring.ts`: Ranks candidates by daf match, language, format, duration, source confidence
- `cachedProvider.ts`: Caches resolved videos to minimize API calls
- `persist.ts`: Stores resolved shiur metadata

**src/daemon/** — Core server and state management:
- `server.ts`: HTTP server (localhost-only) with endpoints for /hook, /play, /pause, /status, /api/dashboard
- `client.ts`: CLI client that communicates with daemon via HTTP
- `state.ts`: In-memory state for current video, playback position, active watch segments
- `protocol.ts`: Request/response types for daemon API

**src/hooks/** — Claude Code lifecycle event handling:
- `hooks.json`: Declares which Claude events trigger plugin behavior
- `ingest.ts`: Parses hook payloads and forwards to daemon (SessionStart, Stop, StopFailure, SessionEnd, etc.)

**src/storage/** — Persistence:
- `database.ts`: SQLite helper (migrations, queries)
- `migrations.ts`: Schema versioning

**src/stats/** — Learning analytics:
- `summary.ts`: Aggregates watched/coding minutes, completion counts, watch/coding ratio per day and globally

**src/player/** — Electron window management:
- `companionLauncher.ts`: Spawns/finds the Electron window
- `page.ts`: Serves the HTML/CSS/JS for the embedded YouTube IFrame and dashboard UI

**src/settings/** — User configuration:
- `setup.ts`: Parses `--language`, `--format`, `--timezone`, `--guard`, `--auto-open` flags and writes to plugin data

**src/guard/** — Safety automations:
- `shabbosGuard.ts`: Detects Shabbos via Hebcal and prevents auto-start if enabled

**src/doctor/** — Health checks:
- `doctor.ts`: Validates daemon, network, YouTube access, Electron, database

## Testing

Tests use Node's built-in `test` runner (no external framework). Coverage includes:

- Hook parsing and ingestion
- Resolver candidate scoring
- SQLite migrations and queries
- YouTube title parsing
- Daemon HTTP API and state transitions
- Electron window spawning
- Stats aggregation
- Setup config parsing
- Shabbos/Yom Tov guard logic
- Release surface validation (bundled binaries)

Run all tests:
```bash
npm run check
```

Key test files:
- `test/resolver.test.ts`: Candidate scoring, daf calendar, title parsing
- `test/daemon.test.ts`: HTTP endpoints, state machine
- `test/hooks.test.ts`: Event ingestion and daemon forwarding
- `test/storage.test.ts`: Migrations, database queries
- `test/stats.test.ts`: Watched/coding minute aggregation
- `test/sourceAdapters.test.ts`: Metadata extraction from MDY app, YouTube Data API, channel page scraping
- `test/playerLauncher.test.ts`: Electron window spawning
- `test/releaseSurface.test.ts`: Packaged binary validation

## Daemon HTTP API

The daemon listens on `http://localhost:<port>` with a random per-session token. Endpoints:

- `POST /hook` — Ingests Claude lifecycle events
- `POST /play` — Start playback
- `POST /pause` — Pause playback
- `POST /resume` — Resume playback
- `GET /status` — Current playback/stats status
- `GET /health` — Health check
- `GET /api/dashboard` — Stats dashboard data
- `GET /companion` — Companion route loaded inside Electron only
- `POST /api/resolve` — Manually resolve a shiur for a date
- `POST /api/progress` — Update playback position

## Key Design Decisions

1. **Electron-only playback**: The plugin does not fall back to a regular browser window. If Electron is not available, the user sees setup guidance and can continue using Claude Code. Stats also live inside the Electron companion; there is no standalone browser dashboard.

2. **Local-first architecture**: No prompt text, source code, or raw tool inputs are stored. Only operational data (settings, resolved metadata, playback position, watch/coding aggregates) persists locally.

3. **Layered source adapters**: Instead of relying on a single API, the resolver tries MDY app metadata → YouTube Data API → YouTube channel page scraping → fallback. This handles API rate limits and source unavailability.

4. **SQLite for persistence**: Single-file, no server dependency, fast local queries for stats and caching.

5. **Hook-driven automation**: All play/pause/resume logic is triggered by Claude Code lifecycle events, so the plugin is always in sync with Claude's state without polling.

## Plugin Manifest and Configuration

User configuration is declared in `.claude-plugin/plugin.json` and includes:

- `language`: "english" or "hebrew"
- `format`: "full" or "chazarah"
- `timezone`: IANA timezone (e.g., "America/Chicago")
- `auto_open_player`: boolean
- `youtube_api_key`: optional, sensitive

The setup command writes these to the plugin data directory.

## Release and Packaging

For public release:

1. Build and test locally: `npm run check`
2. Verify clean first-run current-Daf resolution: `npm run verify:current-daf`
3. Verify the public npm package surface: `npm run verify:npm-package`
4. For public release, prefer the GitHub Actions workflow `Release MDY Daf Companion`; it runs `npm run release:prepare`, supports one-time bootstrap token publishing, and supports npm trusted publishing after npm package setup.
5. The public npm tarball must not include generated `out/` Electron app bundles. Electron is declared as a runtime dependency and launched through `node_modules/electron/cli.js`.
6. Users install from the GitHub marketplace with `claude plugin marketplace add HershelT/mdy-daf-companion` and `claude plugin install mdy-daf-companion@mdy-daf-companion`.

Use `package:companion:*` when validating optional native bundles, future signed app distribution, or platform-specific Electron shell behavior.

## Troubleshooting

Run `/mdy-daf-companion:status` inside Claude Code or `node dist/src/cli.js doctor` to diagnose:

- Daemon health
- Network access (Hebcal, MDY, YouTube)
- Electron availability
- Database integrity
- Current resolved shiur

## Documentation References

- `README.md` — Feature overview and quick-start
- `mdy-daf-companion/README.md` — Plugin package quick-start
- `mdy-daf-companion/DESKTOP_AND_VSCODE_VALIDATION.md` — Hands-on Desktop and VS Code validation guide
- `mdy-daf-companion/SECURITY.md` — Security policy and release checklist
- `mdy-daf-companion/SUPPORT.md` — Support and troubleshooting expectations
- `docs/technical-architecture.md` — Detailed system design
- `docs/product-spec.md` — Product requirements and behavior
- `docs/install-and-compatibility.md` — Platform support matrix
- `docs/implementation-roadmap.md` — Feature backlog and timeline
- `mdy-daf-companion/PRIVACY.md` — Data retention and security model
