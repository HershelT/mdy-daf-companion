# MDY Daf Companion

MDY Daf Companion is a Claude Code plugin for Daf Yomi learners. It resolves the current Rabbi Eli Stefansky / Mercaz Daf Yomi shiur, opens it in a small floating Electron companion while Claude Code works, pauses when Claude stops or asks for input, saves playback progress, and turns coding time into local learning stats.

The product is local-first. Video playback uses YouTube's embedded player, the daemon binds to `127.0.0.1`, and prompt text, source code, file contents, transcript content, and raw tool input are not stored by default.

This is an independent project. It is not affiliated with or endorsed by Mercaz Daf Yomi, Rabbi Eli Stefansky, YouTube, Google, Anthropic, or Claude unless a future partnership is explicitly announced.

## What It Does

- Resolves the current Daf Yomi through Hebcal.
- Finds the best matching MDY shiur through layered MDY/YouTube source adapters.
- Opens a movable, always-on-top Electron companion with a full-window YouTube video.
- Starts or resumes playback from Claude Code lifecycle hooks.
- Pauses and saves progress when Claude stops, idles, asks for permission, fails a stop, or ends a session.
- Keeps the companion open and paused after Claude stops so the learner can continue manually.
- Shows Stats inside the same Electron companion; there is no browser dashboard.
- Tracks watched minutes, coding minutes, dafim completed, videos touched, streak-oriented data, and watch/coding ratio.
- Stores settings, progress, and aggregate stats locally by default.
- Includes Shabbos and Yom Tov guard behavior.
- Supports Claude Code CLI local sessions, Claude Desktop local sessions, and local VS Code extension sessions.

## Requirements

- Claude Code with plugin support.
- Node.js 24 or newer.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.
- A local Claude session for automatic Electron playback.

Remote/cloud Claude sessions are not supported for local playback. SSH and dev-container sessions are partial because the daemon and Electron companion run wherever Claude Code runs.

## Install After Public Release

After this repository is pushed to GitHub and the npm package `mdy-daf-companion` is published, users install it through the Claude Code marketplace:

```bash
claude plugin marketplace add OWNER/REPO
claude plugin install mdy-daf-companion@mdy-daf-companion
```

Replace `OWNER/REPO` with the GitHub repository that contains `.claude-plugin/marketplace.json`.

No setup command is required. Start Claude Code normally and submit a prompt. The first prompt should resolve today's Daf Yomi, open the Electron companion, and start playback when the Shabbos/Yom Tov guard allows it.

Optional commands after install:

```text
/mdy-daf-companion:status
/mdy-daf-companion:dashboard
/mdy-daf-companion:setup
```

## Local Test Before Publishing

Use this path while developing or before the npm package exists. It does not require marketplace installation.

```bash
cd mdy-daf-companion
npm install
npm run package:companion:win
npm run check
npm run verify:current-daf
cd ..
claude --plugin-dir ./mdy-daf-companion
```

On macOS or Linux, replace the package command:

```bash
npm run package:companion:mac
npm run package:companion:linux
```

Inside the Claude session launched with `--plugin-dir`, submit a normal prompt. Expected behavior:

1. `SessionStart` starts the daemon and prepares today's shiur.
2. `UserPromptSubmit` requests playback.
3. The Electron companion opens or refocuses.
4. Playback pauses when Claude stops or asks for input.
5. `/mdy-daf-companion:stats` shows local watch/coding stats.

For a manual smoke test:

```bash
cd mdy-daf-companion
node dist/src/cli.js doctor
node dist/src/cli.js open-player
node dist/src/cli.js open-dashboard
node dist/src/cli.js stats
```

## How The Current Shiur Is Chosen

The resolver does not simply pick the newest upload. MDY may publish Hebrew shiurim, English shiurim, chazarah, full Daf, adjacent dafim, short clips, events, and announcements close together.

The plugin:

1. Computes the current civil date in the configured timezone.
2. Asks Hebcal for the Daf Yomi on that date.
3. Collects candidates from MDY app/page extraction, optional YouTube Data API, and public MDY YouTube channel fallback.
4. Parses titles for masechta, daf, language, format, duration, and exclusion hints.
5. Excludes events, promos, unrelated shorts, donation clips, and announcements.
6. Scores daf match, masechta match, language preference, format preference, duration, source confidence, and recency.
7. Stores the selected shiur and saved position locally.

Clean first-run resolution is verified with:

```bash
cd mdy-daf-companion
npm run verify:current-daf
```

That verifier creates a temporary clean data directory, uses no setup file, asks Hebcal for today's Daf Yomi, resolves through the daemon, and fails if the selected shiur does not match the expected masechta and daf.

## Electron Companion Behavior

- The YouTube video fills the window.
- Controls appear as translucent overlays when hovering or focusing the companion.
- The top overlay can be dragged to move the window.
- Window size, position, and always-on-top state are saved locally.
- The `Stats` button switches the same companion into the dashboard view.
- The `X`, minimize, and pin controls appear on hover/focus and remain visible on touch or no-hover displays.
- Closing the companion does not stop the daemon; the next prompt or `/play` can reopen it.
- There is no regular browser player and no browser fallback.

The companion intentionally stays open when Claude finishes a turn. Best practice for this product is to pause and save progress, then leave control with the learner. Auto-closing would interrupt someone who wants to keep watching and would make the window jump in and out during normal Claude work.

## Commands

When installed, the package exposes `mdy-daf` on the plugin PATH.

| Command | Purpose |
| --- | --- |
| `mdy-daf doctor` | Check runtime, plugin files, Electron, data directory, and SQLite. |
| `mdy-daf today` | Print the Daf Yomi for a date. |
| `mdy-daf resolve` | Resolve a date to the best MDY video candidate. |
| `mdy-daf prepare` | Resolve and store the current shiur. |
| `mdy-daf open-player` | Start daemon, request playback, and open the Electron companion. |
| `mdy-daf open-dashboard` | Open the same Electron companion directly to Stats. |
| `mdy-daf play` / `mdy-daf resume` | Set playback state to playing. |
| `mdy-daf pause` | Pause and save progress. |
| `mdy-daf stats` | Print today's watched/coding summary. |
| `mdy-daf status` | Print daemon, current daf, and playback status. |
| `mdy-daf setup` | Optional preference tuning for language, format, timezone, guard, and auto-open. |

Slash commands:

```text
/mdy-daf-companion:play
/mdy-daf-companion:pause
/mdy-daf-companion:dashboard
/mdy-daf-companion:stats
/mdy-daf-companion:status
/mdy-daf-companion:setup
```

## Release On GitHub

This repository is structured as a Claude Code marketplace repository plus an npm package.

1. Create a public GitHub repository.
2. Push this repository:

```bash
git remote add origin https://github.com/OWNER/REPO.git
git push -u origin main
```

3. For the first publish only, add a short-lived npm granular token as the GitHub secret `NPM_TOKEN`.
4. Open GitHub Actions and run `Release MDY Daf Companion`.
5. Set `publish` to `true` and `publish_auth` to `npm-token-bootstrap` for the first publish.
6. After npm creates the package, configure npm trusted publishing for this GitHub workflow.
7. For later releases, run the same workflow with `publish_auth` set to `trusted-publishing`.
8. Confirm npm published `mdy-daf-companion@0.1.0`.
9. Users install with:

```bash
claude plugin marketplace add OWNER/REPO
claude plugin install mdy-daf-companion@mdy-daf-companion
```

The workflow builds Electron bundles on Windows, Linux, and macOS, downloads them into `mdy-daf-companion/out`, runs release verification, and publishes the self-contained npm package. Release verification is CI-safe: when the `claude` CLI is unavailable on GitHub runners, `npm run validate:plugin` falls back to manifest and file checks.

Manual publish is possible only from a machine or CI workspace that already has all platform bundles in `mdy-daf-companion/out`:

```bash
cd mdy-daf-companion
npm login
npm run release:prepare
npm publish
```

## Updating After Release

For public updates:

1. Make changes.
2. Bump the version in:
   - `mdy-daf-companion/package.json`
   - `mdy-daf-companion/.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json`
3. Repackage Electron if player, launcher, desktop shell, bundled runtime, or Electron dependencies changed.
4. Run:

```bash
cd mdy-daf-companion
npm run check
npm run verify:current-daf
```

5. Run the GitHub release workflow with `publish=true`.
6. Tag the release:

```bash
git tag vX.Y.Z
git push origin main --tags
```

Users update from the marketplace:

```bash
claude plugin marketplace update mdy-daf-companion
claude plugin update mdy-daf-companion@mdy-daf-companion
```

## Compatibility

| Surface | Support | Notes |
| --- | --- | --- |
| Claude Code CLI local | Supported | Best-tested local path. |
| Claude Desktop local | Supported target | Requires Node to be visible to Desktop's local environment. |
| VS Code extension local | Supported target | Uses the same Claude Code plugin system; validate hooks from the chat panel. |
| Desktop SSH | Partial | The plugin runs on the SSH host; Electron opens there unless bridged. |
| VS Code Remote SSH/dev containers | Partial | Same remote-host caveat. |
| Desktop remote/cloud | Unsupported | No local plugin/Electron surface for this product. |
| Claude Code web/cloud | Unsupported | No local daemon/Electron surface. |

See [docs/install-and-compatibility.md](docs/install-and-compatibility.md) and [mdy-daf-companion/DESKTOP_AND_VSCODE_VALIDATION.md](mdy-daf-companion/DESKTOP_AND_VSCODE_VALIDATION.md).

## Verification

Core checks:

```bash
cd mdy-daf-companion
npm run check
npm run verify:current-daf
npm publish --dry-run
```

Windows release candidate:

```bash
npm run release:prepare:win
```

All-platform release candidate:

```bash
npm run release:prepare
```

`release:prepare` requires Windows, Linux, and macOS companion bundles to already exist in `out/`; normally GitHub Actions creates them.

## Documentation

- [Plugin Package README](mdy-daf-companion/README.md)
- [Install And Compatibility](docs/install-and-compatibility.md)
- [Release And Updates](docs/release-and-updates.md)
- [Release Validation Log](docs/release-validation-log.md)
- [Product Spec](docs/product-spec.md)
- [Technical Architecture](docs/technical-architecture.md)
- [Testing Strategy](docs/testing-strategy.md)
- [Privacy](mdy-daf-companion/PRIVACY.md)
- [Security](mdy-daf-companion/SECURITY.md)
- [Support](mdy-daf-companion/SUPPORT.md)

## Release Status

This repository is a release candidate. Automated tests, plugin validation, smoke checks, Windows packaged companion launch, live current-Daf verification, npm dry-run packaging, and real Claude Code CLI hook smoke have passed locally. Public release still needs hands-on validation in Claude Desktop local sessions, VS Code extension local sessions, macOS package launch/signing, Linux package launch, and brand/legal review.

## License

MIT. See [mdy-daf-companion/LICENSE](mdy-daf-companion/LICENSE).
