# Install And Compatibility

Last updated: April 21, 2026.

This guide covers installing MDY Daf Companion, validating first-run behavior, and checking Claude Code CLI, Claude Desktop, and VS Code extension compatibility.

The plugin shape and validation workflow were checked against the current Claude Code docs on April 21, 2026:

- Plugins are `.claude-plugin` packages that can contain commands, skills, agents, hooks, monitors, MCP servers, and other assets.
- `claude --plugin-dir ./mdy-daf-companion` is the direct local development path.
- `claude plugin validate .`, marketplace add, and plugin install are the supported CLI validation/install flow.
- Claude Desktop supports plugins in local and SSH sessions, but this product's Electron playback is only straightforward in local sessions.
- VS Code plugin management uses the same Claude Code plugin system under the extension UI.
- Hooks receive JSON on stdin and include the lifecycle events this plugin maps: `SessionStart`, `UserPromptSubmit`, `Notification`, `Stop`, `StopFailure`, `PreCompact`, `PostCompact`, and `SessionEnd`.

Reference docs:

- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/desktop
- https://code.claude.com/docs/en/vs-code

## Requirements

- Claude Code with plugin support.
- Node.js 24 or newer.
- Local machine access for the daemon and floating Electron companion.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.

Remote/cloud Claude sessions are not supported for local playback. SSH/dev-container sessions are partial because the daemon and Electron companion run wherever Claude Code runs.

## Public Install

After the npm package is published and this marketplace repository is pushed to GitHub:

```bash
claude plugin marketplace add OWNER/REPO
claude plugin install mdy-daf-companion@mdy-daf-companion
```

Replace `OWNER/REPO` with the GitHub repository that contains `.claude-plugin/marketplace.json`.

No setup command is required. The default install auto-resolves today's Daf Yomi and opens the Electron companion on the first local Claude Code prompt. `/mdy-daf-companion:setup` is optional preference tuning.

## Local Development Install

Use this before the npm package is published, or whenever you are editing the plugin:

```bash
cd mdy-daf-companion
npm install
npm run package:companion:win
npm run check
npm run verify:current-daf
cd ..
claude --plugin-dir ./mdy-daf-companion
```

On macOS and Linux, replace the package command:

```bash
npm run package:companion:mac
npm run package:companion:linux
```

`claude --plugin-dir ./mdy-daf-companion` gives the local plugin priority for that session and avoids needing a published npm package. Reload plugins after file changes:

```text
/reload-plugins
```

On Windows, `npm run package:companion:win` runs a preflight cleanup before Electron Packager starts. It closes stale packaged companion processes from `out\` and removes the old output folder. If Windows still reports `EPERM` while unlinking a DLL, close MDY Daf Companion and pause OneDrive or antivirus scanning for the release folder, then rerun the command.

## Initial Load Behavior

On a clean install, the user does not need to run `/setup` or `/prepare`.

Expected first prompt flow:

1. Claude Code loads the plugin hooks.
2. `SessionStart` starts the daemon and schedules today's shiur resolution.
3. `UserPromptSubmit` sets playback to `playing`, resolves a shiur if one is not already loaded, and opens/refocuses the Electron companion when safe.
4. The daemon computes the date in the configured timezone.
5. The resolver asks Hebcal for Daf Yomi on that date.
6. Source adapters collect MDY/YouTube candidates.
7. The scorer chooses the candidate matching masechta, daf, language, format, duration, and source confidence.
8. The companion loads the YouTube embed and saves progress through the local daemon.

Verify the clean first-run path:

```bash
cd mdy-daf-companion
npm run verify:current-daf
```

The verifier creates a clean temporary data directory, uses no setup file, asks Hebcal for today's daf in the default timezone, resolves through the daemon, and fails if the selected shiur's masechta/daf differs from Hebcal.

## Claude Code CLI

Status: supported.

Recommended validation:

```bash
cd mdy-daf-companion
node dist/src/cli.js doctor
node dist/src/cli.js today
node dist/src/cli.js resolve
node dist/src/cli.js open-player
node dist/src/cli.js open-dashboard
```

Prompt-submit validation:

1. Start Claude Code locally with the plugin installed or with `claude --plugin-dir ./mdy-daf-companion`.
2. Submit a normal prompt.
3. Confirm the `UserPromptSubmit` hook starts or contacts the daemon, resolves the shiur if needed, opens the Electron companion, and sets playback state to `playing` unless the Shabbos/Yom Tov guard blocks it.
4. Wait for Claude to stop or ask for permission and confirm the companion pauses.
5. Run `/mdy-daf-companion:stats` and confirm watched/coding stats update.

## Claude Desktop

Status: supported target for local sessions.

Claude Desktop supports plugins for local and SSH sessions. This product should be validated in local Desktop sessions because the Electron companion is a local desktop window. Desktop remote/cloud sessions are unsupported for this product.

Validation checklist:

1. Open Claude Desktop.
2. Start a local session for this repository folder or another local workspace.
3. Open the plugin browser from the prompt UI.
4. Add the public marketplace `OWNER/REPO`, or use the local development plugin path while testing before publication.
5. Install or enable `mdy-daf-companion`.
6. Confirm Node.js is visible to the Desktop environment.
7. Run `/mdy-daf-companion:status`.
8. Run `/mdy-daf-companion:play` and confirm the floating Electron companion opens.
9. Run `/mdy-daf-companion:dashboard` and confirm the same companion switches to Stats.
10. Submit a normal coding prompt and confirm playback resumes on prompt submit and pauses when Claude waits.

Known caveat:

- Desktop may not inherit all shell-profile environment changes. If `mdy-daf doctor` reports Node or path issues, install Node in the user/system environment Desktop can see.

## VS Code Extension

Status: supported target for local sessions.

Claude Code's VS Code extension uses the same plugin system as the CLI. Install the plugin once, then validate from a local VS Code workspace.

Validation checklist:

1. Open the workspace in VS Code.
2. Open the Claude Code extension panel.
3. Type `/plugins` in the Claude prompt box.
4. Add the public marketplace `OWNER/REPO`, or use the local plugin path while testing before publication.
5. Install or enable `mdy-daf-companion`.
6. Restart/reload Claude Code if the extension shows a restart banner.
7. Run `/mdy-daf-companion:status`.
8. Run `/mdy-daf-companion:play`.
9. Submit a normal coding prompt from the VS Code Claude panel.
10. Confirm the Electron companion opens on the local desktop and pauses when Claude stops or asks for permission.
11. Run `/mdy-daf-companion:stats` and confirm progress appears.

Pass criteria:

- Plugin appears in `/plugins`.
- Slash commands are visible in the prompt.
- Hooks fire from the VS Code chat panel, not only the integrated terminal.
- Electron opens locally.
- Stats update after watch/progress events.

## SSH, Dev Containers, And Remote Sessions

Partial support only.

In SSH/dev-container sessions, the plugin runs where Claude Code runs. That means the daemon binds to `127.0.0.1` on the remote host, not necessarily on your laptop, and Electron opens on that host if a display is available.

Recommended behavior:

- Use local sessions for automatic playback.
- For SSH/dev containers, use remote-safe mode or port forwarding only after explicit validation.
- Do not expect the Electron companion to appear on your local desktop from a remote host without additional setup.

Unsupported:

- Claude Desktop remote/cloud sessions.
- Claude Code web/cloud sessions for local playback.

The runtime detects `CLAUDE_CODE_REMOTE=true` and disables local daemon startup.

## Troubleshooting

### Plugin Does Not Load

Run from the repository root:

```bash
claude plugin validate .
```

Then reload inside Claude:

```text
/reload-plugins
```

### Runtime Not Built

Installed releases include `dist/src`. If developing locally and `dist/src/cli.js` is missing:

```bash
cd mdy-daf-companion
npm install
npm run build
```

### Player Does Not Open

Run:

```bash
mdy-daf open-player
```

If Electron does not open:

1. Run `mdy-daf doctor`.
2. For a release install, confirm the matching packaged companion folder exists under `out/`.
3. For a development install, run `npm install` in `mdy-daf-companion`.
4. Re-run `mdy-daf open-player`.

The product intentionally does not fall back to a regular browser video player.

### Resolver Cannot Find A Shiur

Run:

```bash
mdy-daf resolve
```

If this fails, check internet access and whether YouTube/MDY page structure changed. Optional `youtube_api_key` improves metadata lookup.
