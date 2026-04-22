# Release And Updates

Last updated: April 22, 2026.

This project is designed to ship as a Claude Code marketplace plus an npm package:

- The marketplace repository contains `.claude-plugin/marketplace.json`.
- The plugin package is `mdy-daf-companion` on npm.
- The npm package contains the Claude plugin files, compiled runtime, Electron shell source, and Electron as an npm runtime dependency.

Claude Code marketplace entries support npm plugin sources, and installed marketplace plugins are copied into Claude's local plugin cache. The package must contain the plugin runtime and declare runtime dependencies needed for the floating companion.

## Public Install

Users install with:

```bash
claude plugin marketplace add HershelT/mdy-daf-companion
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

For an optional Windows native companion smoke:

```bash
cd mdy-daf-companion
npm run release:prepare:win
```

For a public release, use the GitHub Actions workflow `Release MDY Daf Companion`. It runs:

```bash
npm run release:prepare
```

That command performs:

- Unit and edge tests.
- `claude plugin validate`.
- Smoke validation.
- Live current-Daf verification.
- npm package-surface verification through `npm pack --dry-run --json`.
- A package-size and forbidden-file guard that fails if generated `out/` Electron bundles are accidentally included.

## Publishing

Before the first publish:

```bash
npm login
npm view mdy-daf-companion version
```

`npm view` should return `E404` before the first public release, meaning the package name is not currently published.

Create and push the GitHub marketplace repository:

```bash
git remote add origin https://github.com/HershelT/mdy-daf-companion.git
git push -u origin main
```

The root `.claude-plugin/marketplace.json` references the npm package source. Public install will not work until both pieces exist:

- The GitHub repository is reachable by Claude Code as `HershelT/mdy-daf-companion`.
- the matching `mdy-daf-companion@X.Y.Z` package is published to npm.

The package is configured for npm trusted publishing. In npm package settings, the trusted publisher should be:

- Owner: `HershelT`
- Repository: `mdy-daf-companion`
- Workflow file: `release.yml`
- Package directory: `mdy-daf-companion`
- Environment: leave blank unless GitHub environments are added later

For public releases, run `Release MDY Daf Companion` with `publish=true`. The workflow uses GitHub OIDC with `id-token: write`, lets npm issue short-lived publish credentials, and does not require `NPM_TOKEN`.

After trusted publishing is verified, npm recommends using the most restrictive package publishing access setting and revoking old automation tokens.

Validate public install from a clean Claude Code session:

```bash
claude plugin marketplace add HershelT/mdy-daf-companion
claude plugin install mdy-daf-companion@mdy-daf-companion
```

To publish manually from a clean workspace:

```bash
cd mdy-daf-companion
npm run release:prepare
npm publish
```

Local manual publish currently requires npm authentication. If `npm whoami` returns `ENEEDAUTH`, run `npm login`. Manual publishing should be reserved for emergency maintainer use; the normal path is the trusted GitHub Actions workflow.

## Updating Efficiently

For any public update:

1. Make code/docs changes.
2. If runtime, Electron, resolver, player, hook, or compiled TypeScript changed, rebuild and rerun release checks.
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

## When Native Repackaging Is Required

Native Electron packaging is optional release-hardening, not part of the public npm tarball. Repackage Electron for local/native smoke testing when any of these change:

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

## Debug Capture

The Electron companion does not write renderer screenshots during normal use. For local UI diagnosis only, set:

```bash
MDY_DAF_DEBUG_CAPTURE=1
```

With that flag enabled, the companion may write `companion-last.png` under the plugin data directory. Do not include that file in bug reports unless you have checked that it contains no private screen content.
