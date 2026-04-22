# Release Validation Log

Last updated: April 22, 2026.

This log records concrete release validation for the public 0.1.x package line. It is intentionally separate from the roadmap so future release agents can see what was actually run.

## Local Build And Test

Working directory: `mdy-daf-companion`

Commands run:

```bash
npm test
npm run validate:plugin
npm run smoke
npm run check
```

Result:

- TypeScript build passed.
- 66 Node tests passed.
- `claude plugin validate .` passed.
- Smoke doctor passed.
- Smoke confirmed Electron companion detection.

## Clean First-Run Current-Daf Verification

Command run:

```bash
npm run verify:current-daf
```

Result on April 21, 2026 in `America/Chicago`:

- Expected Daf Yomi from Hebcal: `Menachos 100`.
- Resolved title: `Daf Yomi Menachos Daf 100 by R' Eli Stefansky`.
- Resolved video id: `Mv-DhwmEAFE`.
- Source URL: `https://www.youtube.com/watch?v=Mv-DhwmEAFE`.
- Clean-first-run mode was enabled, with no setup file required.

## Windows Packaged Companion

Command run:

```bash
npm run package:companion:win
```

Result:

- Electron Packager wrote `out/mdy-daf-companion-win32-x64`.
- `mdy-daf doctor` found `out/mdy-daf-companion-win32-x64/mdy-daf-companion.exe`.
- `mdy-daf prepare --date 2026-04-20` resolved Menachos 99 to `H9vgAHT7aKo`.
- `mdy-daf open-player` launched the packaged `.exe`.
- Electron loaded `/companion` and rendered nonblank YouTube content. Debug renderer screenshots now require `MDY_DAF_DEBUG_CAPTURE=1`.

## Release Packaging Dry Run

Commands run:

```bash
npm run release:prepare:win
npm run verify:npm-package
```

Result:

- Windows companion package was rebuilt after closing stale packaged processes.
- `npm run check` passed.
- `npm run verify:current-daf` passed.
- `npm run verify:npm-package` confirmed the public tarball includes plugin files, compiled runtime, docs, Electron shell source, and excludes generated `out/` bundles.
- Actual `npm publish` should normally run through the GitHub Actions trusted-publishing workflow. Use local `npm login` only for emergency manual maintainer publishes.

## GitHub Actions Publish Failure And Fix

Observed on April 21, 2026 run `24757445924`:

- The original bootstrap-token step reached `npm publish`, so authentication was not the failing layer.
- The tarball was `980.7 MB`, unpacked to `2.4 GB`, and contained `1707` files.
- The largest entries were generated platform Electron bundles under `out/mdy-daf-companion-*`.
- npm failed with `ERR_STRING_TOO_LONG`.

Fix:

- Removed `out/` from the npm `files` allowlist.
- Moved `electron` to runtime `dependencies`.
- Simplified the GitHub release workflow so npm publish does not download platform artifacts.
- Added `npm run verify:npm-package` to block future accidental `out/` inclusion or oversized tarballs.
- Tightened current-Daf verification so the parsed resolved title must match Hebcal, not only the stored daf metadata.
- Pinned release workflow timezone to `America/Chicago` so CI does not roll into the next Daf Yomi date before the target local release day.
- Removed the bootstrap-token workflow path after trusted publishing was configured.

## Real Claude Code CLI Smoke

Commands run from the repository root:

```bash
claude --plugin-dir ./mdy-daf-companion --model haiku --max-budget-usd 0.50 --no-session-persistence --dangerously-skip-permissions -p "Run /mdy-daf-companion:status and return only the command result."

claude --plugin-dir ./mdy-daf-companion --model haiku --max-budget-usd 0.50 --no-session-persistence --dangerously-skip-permissions --include-hook-events --output-format stream-json --verbose -p "Say OK only."
```

Result:

- Claude Code version reported in the stream: `2.1.116`.
- Model used: `claude-haiku-4-5-20251001`.
- The plugin appeared in Claude's plugin list as `mdy-daf-companion@inline`.
- Slash commands included `mdy-daf-companion:status`, `play`, `pause`, `prepare`, `dashboard`, `stats`, and `setup`.
- `/mdy-daf-companion:status` mapped to `mdy-daf status`.
- Hook stream showed:
  - `SessionStart:startup` returned `prepare`.
  - `UserPromptSubmit` returned `resume`.
  - `Stop` returned `pause_done`.
- The Electron companion auto-open path ran from the real hook flow. Renderer screenshots are now opt-in through `MDY_DAF_DEBUG_CAPTURE=1`.

## Browser Removal Validation

Validated by automated tests and source audit:

- `/player` returns 404.
- `/dashboard` returns 404.
- `/api/dashboard` remains available for the Electron companion.
- Runtime source does not call `shell.openExternal`.
- Electron denies external window and navigation requests instead of opening a browser.
- `open-dashboard` opens `/companion#stats` inside Electron.

## Not Yet Hands-On Validated

These require the target application or OS build host:

- Claude Desktop local plugin install on Windows.
- Claude Desktop local plugin install on macOS.
- VS Code extension local chat panel hook flow.
- VS Code Remote SSH/dev-container behavior.
- macOS packaged companion launch, signing, and notarization.
- Linux packaged companion launch.
- Windows code signing.

## 0.1.3 Regression Hardening Validation

Commands run:

```bash
cd mdy-daf-companion
npm run build
node --test "dist/test/resolver.test.js"
node --test "dist/test/daemonClient.test.js"
node --test "dist/test/daemon.test.js"
```

Result:

- Resolver fallback regression tests pass for post-midnight date-advance before upload scenarios.
- Daemon client restart-guard tests pass, including Windows path casing tolerance.
- Daemon server tests pass for persisted current-shiur hydration and companion bootstrap behavior.
- In plugin-dir smoke sessions, `/mdy-daf-companion:prepare` and `/mdy-daf-companion:status` remain consistent and companion playback can initialize after late status hydration.
