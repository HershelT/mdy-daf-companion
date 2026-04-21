# Release And Updates

Last updated: April 21, 2026.

This project is designed to ship as a Claude Code marketplace plus an npm package:

- The marketplace repository contains `.claude-plugin/marketplace.json`.
- The plugin package is `mdy-daf-companion` on npm.
- The npm package contains the Claude plugin files, compiled runtime, and packaged Electron companion bundles.

Claude Code marketplace entries support npm plugin sources, and installed marketplace plugins are copied into Claude's local plugin cache. That means the package must be self-contained; runtime files cannot live outside the plugin directory.

## Public Install

After the npm package is published and this repository is pushed to GitHub, users install with:

```bash
claude plugin marketplace add OWNER/REPO
claude plugin install mdy-daf-companion@mdy-daf-companion
```

Inside Claude Code, Desktop, or the VS Code extension, users can do the same through `/plugin` or the plugin browser by adding the same marketplace.

No first-run setup command is required. Defaults are:

- English full shiur.
- Local machine timezone.
- Auto-resolve today's Daf Yomi.
- Auto-open the Electron companion on prompt submit.
- Local-only stats and progress.
- Shabbos/Yom Tov guard enabled.

Optional preferences can be changed later with:

```text
/mdy-daf-companion:setup
```

## What Happens On Initial Load

On a clean install, the user does not need to run `/setup` or `/prepare`.

1. Claude Code loads the plugin hooks.
2. `SessionStart` starts the daemon and schedules today's shiur resolution.
3. `UserPromptSubmit` sets playback to `playing`, auto-resolves a shiur if one is not already loaded, and opens/refocuses the Electron companion.
4. The daemon computes the civil date in the configured timezone.
5. The resolver asks Hebcal for Daf Yomi on that date.
6. Source adapters collect MDY/YouTube candidates.
7. The scorer chooses the candidate matching masechta, daf, language, format, duration, and source confidence.
8. The selected shiur is saved locally and the companion loads that YouTube video.

Verify the real current-day path with:

```bash
cd mdy-daf-companion
npm run verify:current-daf
```

The verifier creates a clean temporary data directory, uses no setup file, asks Hebcal for today's daf in the default timezone, resolves the current shiur through the daemon, and fails if the resolved masechta/daf differs from Hebcal.

## Release Preparation

For a Windows-only beta package:

```bash
cd mdy-daf-companion
npm run release:prepare:win
```

For a public all-platform release, use the GitHub Actions workflow `Release MDY Daf Companion`. It builds Electron companions on:

- `windows-latest` for `win32-x64`.
- `ubuntu-latest` for `linux-x64`.
- `macos-latest` for `darwin-arm64` and `darwin-x64`.

The final job downloads all bundles into `mdy-daf-companion/out`, then runs:

```bash
npm run release:prepare
```

That command performs:

- Unit and edge tests.
- `claude plugin validate`.
- Smoke validation.
- Live current-Daf verification.
- Presence checks for Windows, Linux, and macOS Electron bundles.
- `npm pack --dry-run`.

## Publishing

Before the first publish:

```bash
npm login
npm view mdy-daf-companion version
```

`npm view` should return `E404` before the first public release, meaning the package name is not currently published.

Create and push the GitHub marketplace repository:

```bash
git remote add origin https://github.com/OWNER/REPO.git
git push -u origin main
```

The root `.claude-plugin/marketplace.json` references the npm package source. Public install will not work until both pieces exist:

- The GitHub repository is reachable by Claude Code as `OWNER/REPO`.
- `mdy-daf-companion@0.1.0` is published to npm.

To publish through GitHub Actions:

1. Add `NPM_TOKEN` as a repository secret.
2. Run `Release MDY Daf Companion`.
3. Set `publish` to `true`.
4. Confirm the workflow publishes `mdy-daf-companion@0.1.0`.
5. Validate public install from a clean Claude Code session:

```bash
claude plugin marketplace add OWNER/REPO
claude plugin install mdy-daf-companion@mdy-daf-companion
```

To publish manually from a machine that already has all platform bundles in `mdy-daf-companion/out`:

```bash
cd mdy-daf-companion
npm run release:prepare
npm publish
```

Local manual publish currently requires npm authentication. If `npm whoami` returns `ENEEDAUTH`, run `npm login` or use the GitHub workflow with `NPM_TOKEN`.

## Updating Efficiently

For any public update:

1. Make code/docs changes.
2. If runtime, Electron, resolver, player, hook, or compiled TypeScript changed, rebuild and repackage the affected Electron bundles.
3. Bump the version in:
   - `mdy-daf-companion/package.json`
   - `mdy-daf-companion/.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json` metadata
   - `.claude-plugin/marketplace.json` npm source version
4. Run `npm run check`.
5. Run `npm run verify:current-daf`.
6. Run the release workflow or `npm run release:prepare`.
7. Publish the npm package.
8. Push the marketplace update to GitHub.
9. Tag the release:

```bash
git tag vX.Y.Z
git push origin main --tags
```

Users update with:

```bash
claude plugin marketplace update mdy-daf-companion
claude plugin update mdy-daf-companion@mdy-daf-companion
```

If they installed through Desktop or VS Code, they can use the plugin UI refresh/update controls instead. VS Code uses the same Claude Code marketplace system under the hood.

## When Repackaging Is Required

Repackage Electron when any of these change:

- `desktop/electron/**`
- `src/player/**`
- Companion launcher behavior
- Packaged runtime files used by the Electron shell
- Electron version or Electron Packager version

Rebuild TypeScript when any `src/**` file changes:

```bash
npm run build
```

Re-run the full release workflow for public releases even if the change looks documentation-only, because `npm pack --dry-run` and plugin validation catch packaging drift.
