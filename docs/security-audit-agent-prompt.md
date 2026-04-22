# Security Audit Agent Prompt

Last updated: April 22, 2026.

Use this prompt when assigning a fresh AI agent to perform a full security, privacy, stale-file, and release-surface audit of `mdy-daf-companion`.

```text
You are auditing the `mdy-daf-companion` repository at `C:\Users\hersh\OneDrive\Desktop\Projects-Websites\Claude Code Daf Yomi`.

Mission:
Perform a comprehensive security and cleanup audit for a production-quality Claude Code plugin that plays the latest MDY Daf Yomi shiur in a floating Electron companion. The product is independent and must not impersonate Mercaz Daf Yomi, Rabbi Eli Stefansky, YouTube, Google, Anthropic, Claude, or any official app. It must remain Electron-only; do not reintroduce a regular browser player or browser fallback.

Current release context:
- Public npm package: `mdy-daf-companion`.
- Repository: `https://github.com/HershelT/mdy-daf-companion`.
- Current intended version: `0.1.3`.
- Public install path: `claude plugin marketplace add HershelT/mdy-daf-companion`, then `claude plugin install mdy-daf-companion@mdy-daf-companion`.
- Publishing uses npm trusted publishing from `.github/workflows/release.yml`; do not restore long-lived `NPM_TOKEN` publishing unless trusted publishing is unavailable and the fallback is explicitly temporary.
- Electron-only companion is the user-facing playback and dashboard surface.

Authoritative project files to read first:
- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `mdy-daf-companion/README.md`
- `docs/release-and-updates.md`
- `docs/technical-architecture.md`
- `docs/product-spec.md`
- `docs/research/claude-code-surface-compatibility.md`
- `mdy-daf-companion/SECURITY.md`
- `mdy-daf-companion/PRIVACY.md`
- `mdy-daf-companion/SUPPORT.md`

External security references to verify against:
- npm Trusted Publishing documentation: confirm OIDC publishing, `id-token: write`, npm CLI/Node requirements, provenance behavior, and recommendation to disallow traditional tokens after trusted publishing is configured.
- Electron Security tutorial/checklist: confirm `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, navigation/popup restrictions, no `shell.openExternal` for untrusted content, no disabled `webSecurity`, no insecure content flags, and IPC sender validation where IPC is used.
- GitHub Actions secure use guidance: confirm least-privilege workflow permissions, no unnecessary secrets, no untrusted workflow input interpolation, and action dependency posture.
- OWASP Top 10 for LLM Applications 2025: apply prompt-injection, excessive-agency, and sensitive-information-disclosure thinking to agents, docs, hooks, and local logging.

Audit goals:
1. Find and fix security issues, not just list them.
2. Remove generated or stale files that no longer belong in the repo.
3. Identify documentation that is outdated after the Electron-only, trusted-publishing, and public npm release changes.
4. Preserve the user's work. Do not revert unrelated edits. Do not use destructive git commands.
5. Never add co-author trailers to commits.

High-priority checks:
- Search for `shell.openExternal`, `window.open`, `/player`, `/dashboard`, browser fallback launchers, `start http`, `open http`, and any regular-browser playback wording.
- Confirm `/player` and `/dashboard` standalone HTML routes remain removed; `/api/dashboard` may remain for the Electron companion.
- Confirm Electron only loads local `http://127.0.0.1` or `localhost` `/companion` URLs and blocks external navigation/popups.
- Confirm Electron logs redact daemon bearer tokens, optional YouTube API keys, and token-like query parameters.
- Confirm debug screenshots require `MDY_DAF_DEBUG_CAPTURE=1` and that `companion-last.png`, Playwright screenshots, smoke SQLite files, and generated `out/` bundles are ignored/not tracked.
- Confirm hook scripts are fast, fail open, and do not block Claude Code on network, YouTube, Electron startup, or SQLite.
- Confirm daemon binds only to loopback and all mutating/local API routes require the random bearer token.
- Confirm the token is stored only in plugin data and not printed to normal command output or logs.
- Confirm source adapters cache public metadata safely and do not download, mirror, transcode, or redistribute YouTube videos.
- Confirm optional `youtube_api_key` remains marked `sensitive` in `.claude-plugin/plugin.json`.
- Confirm no prompt text, source code, file contents, raw tool input, transcript contents, or raw project paths are stored by default.
- Confirm generated packages do not include `node_modules`, `out/`, `.smoke-data`, `.playwright-cli`, `output/`, screenshots, logs, SQLite files, local Claude settings, or private auth files.
- Confirm version metadata stays aligned across `mdy-daf-companion/package.json`, `package-lock.json`, `desktop/electron/package.json`, `mdy-daf-companion/.claude-plugin/plugin.json`, root `.claude-plugin/marketplace.json`, and `CHANGELOG.md`.
- Confirm GitHub Actions uses npm trusted publishing and does not require `NPM_TOKEN` for the normal release path.
- Confirm action permissions are least-privilege. Note whether action SHA pinning is adopted or intentionally deferred.
- Confirm docs do not claim hands-on validation for Claude Desktop, VS Code, macOS, Linux, signing, or notarization unless evidence exists in `docs/release-validation-log.md`.

Suggested local commands:
- `git status --short --ignored`
- `git ls-files .playwright-cli output mdy-daf-companion/.playwright-cli mdy-daf-companion/output mdy-daf-companion/.smoke-data mdy-daf-companion/out .claude`
- `Get-ChildItem -Recurse -Force -File | Select-String -Pattern "shell.openExternal|openExternal|/player|/dashboard|NPM_TOKEN|npm-token-bootstrap|companion-last|MDY_DAF_DEBUG_CAPTURE|webSecurity|nodeIntegration|allowRunningInsecureContent|eval\\(|innerHTML|process.argv|token="`
- `cd mdy-daf-companion && npm run build`
- `cd mdy-daf-companion && npm run test`
- `cd mdy-daf-companion && npm run validate:plugin`
- `cd mdy-daf-companion && npm run smoke`
- `cd mdy-daf-companion && npm run verify:current-daf`
- `cd mdy-daf-companion && npm run verify:npm-package`
- `cd mdy-daf-companion && npm audit --omit=dev`
- `claude plugin validate .` from the repository root when Claude CLI is available.

Stale-file policy:
- Remove ignored, untracked diagnostic artifacts such as Playwright run folders, local screenshots, smoke databases, local logs, and debug captures.
- Do not remove `dist/src/**` because the npm package currently ships compiled runtime files.
- Do not remove `node_modules/` as part of a patch; it is ignored local install state.
- Do not remove `out/` unless explicitly cleaning local artifacts; it is ignored and used for optional native companion smoke tests.
- Keep research docs if they explain decisions, but mark them historical if newer docs supersede them.
- Update documentation instead of leaving contradictory release instructions.

Expected output:
- A short executive summary.
- A table of findings with severity, file, line, risk, and fix.
- A list of files changed and why.
- A list of stale artifacts removed.
- Exact tests/commands run and results.
- Any residual risks that require real external validation, such as Claude Desktop UI, VS Code extension UI, macOS signing/notarization, Windows code signing, or MDY brand permission.

Implementation rules:
- Use existing project style and small scoped patches.
- Add or update tests for every behavioral security fix when practical.
- Use `apply_patch` for manual source edits.
- Commit coherent checkpoints with plain messages and no co-author trailer.
- If pushing, push `main` only after tests pass and the worktree is clean.
```
