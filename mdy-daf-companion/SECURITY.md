# Security Policy

Last updated: April 22, 2026.

MDY Daf Companion is a local-first Claude Code plugin. It starts a localhost daemon and a floating Electron companion so the latest MDY Daf Yomi shiur can play while Claude Code works.

## Supported Versions

| Version | Status |
| --- | --- |
| `0.1.x` | Supported public release line; security fixes accepted. |

## Security Model

- The daemon binds to `127.0.0.1` only.
- Local daemon requests require a random bearer token written to plugin data.
- The bearer token is accepted in the `/companion` query string only for the initial Electron page load; daemon API calls require the `Authorization: Bearer` header.
- CLI output redacts local companion URL tokens.
- Hooks should fail open so a plugin failure does not block Claude Code work.
- The Electron companion is the only supported playback surface.
- Browser fallback launchers are intentionally unsupported.
- External Electron navigations and popups are blocked.
- Electron launch URLs are restricted to the local `/companion` route.
- Electron IPC handlers validate that messages come from the trusted companion renderer.
- Companion logs redact bearer tokens and API-key-like URL query parameters.
- Renderer screenshots are disabled by default and require `MDY_DAF_DEBUG_CAPTURE=1`.
- YouTube playback uses the official YouTube IFrame surface.
- The plugin must not download, mirror, transcode, or redistribute YouTube videos.
- API keys and personal settings must stay out of the repository.

## Data Protection

By default, the plugin stores local settings, resolved shiur metadata, playback progress, hook event categories, and aggregated watched/coding minutes. It must not store prompt text, source code, file contents, transcript contents, raw tool inputs, or raw project paths by default.

Any future telemetry, crash reporting, sync, leaderboard, or supporter feature must be explicit opt-in and documented in `PRIVACY.md`.

## Reporting A Vulnerability

Report vulnerabilities privately to the repository owner or maintainer before public disclosure. Include:

- A clear description of the issue.
- Reproduction steps.
- Operating system and Claude Code surface.
- Whether the issue affects local data, daemon auth, Electron navigation, hook behavior, or video playback.

Do not include private prompts, source code, API keys, or shiur account credentials in reports.

## Release Security Checklist

Before each public release:

- Run `npm run check`.
- Run `npm run verify:current-daf`.
- Run `npm run verify:npm-package`.
- Run `claude plugin validate .`.
- Run `mdy-daf doctor`.
- Verify `/player` and `/dashboard` standalone HTML routes remain removed.
- Verify no `shell.openExternal` or browser fallback code exists.
- Verify Electron logs do not contain local bearer tokens.
- Verify CLI command output redacts local bearer tokens.
- Verify daemon API routes reject query-string tokens outside the Electron `/companion` bootstrap route.
- Verify debug screenshots are opt-in only and generated files are not committed.
- Verify packaged Electron launch works on each target OS.
- Review `package-lock.json` and run `npm audit`.
- Confirm no secrets or API keys are committed.
- Sign Windows and macOS release builds where practical.
