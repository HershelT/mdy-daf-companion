# Release Validation Log

Last updated: April 21, 2026.

This log records the concrete validation performed for the local beta release candidate. It is intentionally separate from the roadmap so future release agents can see what was actually run.

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
- Smoke confirmed packaged Electron companion detection.

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
- Electron loaded `/companion`, captured `companion-last.png`, and rendered nonblank YouTube content.

## Release Packaging Dry Run

Commands run:

```bash
npm run release:prepare:win
npm publish --dry-run
```

Result:

- Windows companion package was rebuilt after closing stale packaged processes.
- `npm run check` passed.
- `npm run verify:current-daf` passed.
- `npm pack --dry-run` and `npm publish --dry-run` included the plugin files, compiled runtime, docs, and packaged Windows/Linux companion folders currently present in `out/`.
- `npm run release:verify-packages` verified Windows/Linux and correctly failed locally for missing macOS bundles; the all-platform release check must run in GitHub Actions or on a workspace that has generated `darwin-arm64` and `darwin-x64`.
- Actual `npm publish` was not run locally because npm authentication was not configured; use `npm login` or the GitHub workflow with `NPM_TOKEN`.

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
- The companion data directory captured a fresh `companion-last.png`, confirming the Electron auto-open path ran from the real hook flow.

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
