# Install And Compatibility

Last updated: April 21, 2026.

This guide covers installing MDY Daf Companion as a Claude Code plugin and validating it across Claude Code surfaces.

## Requirements

- Claude Code with the `/plugin` command available.
- Node.js 24 or newer.
- Local machine access for the daemon and floating Electron companion.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.

The plugin shape and testing workflow were checked against the current Claude Code docs for plugins, hooks, Desktop, and VS Code on April 21, 2026:

- Plugins are `.claude-plugin` packages that can contain commands, skills, agents, hooks, MCP servers, and other assets.
- `claude --plugin-dir ./mdy-daf-companion` is the direct local development path.
- `claude plugin validate .`, marketplace add, and plugin install are the supported CLI validation/install flow.
- Desktop supports plugins in local and SSH sessions; remote/cloud Desktop sessions do not provide the local plugin surface needed by this product.
- VS Code plugin management uses the same Claude Code plugin system under the extension UI.
- Hooks receive JSON on stdin and include the lifecycle events this plugin maps: `SessionStart`, `UserPromptSubmit`, `Notification`, `Stop`, `StopFailure`, `PreCompact`, `PostCompact`, and `SessionEnd`.

Reference docs:

- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/desktop
- https://code.claude.com/docs/en/vs-code

## Install From This Repository

First build and package the companion. Electron Packager creates OS-specific folders such as `out/mdy-daf-companion-win32-x64`; release archives should include the relevant folder. Development installs can still use the local `electron` dependency after `npm install`.

```bash
cd mdy-daf-companion
npm install
npm run package:companion:win     # Windows x64
npm run package:companion:mac     # macOS arm64 + x64
npm run package:companion:linux   # Linux x64
npm run check
cd ..
```

From the repository root:

```bash
claude plugin validate .
claude plugin marketplace add . --scope local
claude plugin install mdy-daf-companion@mdy-daf-companion --scope local
```

Then reload plugins inside Claude Code:

```text
/reload-plugins
```

Run the health check:

```text
/mdy-daf-companion:status
```

Or from the plugin CLI:

```bash
mdy-daf doctor
```

## Development Mode

Use development mode while editing the plugin:

```bash
claude --plugin-dir ./mdy-daf-companion
```

After changing plugin files, reload:

```text
/reload-plugins
```

## First-Run Setup

Recommended English/full Daf setup for Central Time:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
```

Hebrew/chazarah example:

```bash
mdy-daf setup --language hebrew --format chazarah --timezone Asia/Jerusalem --guard true --auto-open true
```

Prepare and open:

```bash
mdy-daf prepare
mdy-daf open-player
mdy-daf stats
```

## Claude Code CLI

Status: supported.

Recommended validation:

```bash
mdy-daf doctor
mdy-daf today --date 2026-04-20
mdy-daf resolve --date 2026-04-19
mdy-daf prepare
mdy-daf open-player
mdy-daf open-dashboard
```

`mdy-daf open-dashboard` opens the same Electron companion directly to the Stats view. There is no separate browser dashboard in the release path.

Prompt-submit validation:

1. Set `auto_open_player=true` with setup.
2. Start Claude Code locally with the plugin installed or with `claude --plugin-dir ./mdy-daf-companion`.
3. Submit a normal prompt.
4. Confirm the `UserPromptSubmit` hook starts the daemon, resolves the shiur if needed, opens the Electron companion, and sets playback state to `playing` unless the Shabbos/Yom Tov guard blocks it.
5. Wait for Claude to stop or ask for permission and confirm the companion pauses.

Expected resolver sanity check:

```text
2026-04-19: Menachos 98 -> Daf Yomi Menachos Daf 98 by R' Eli Stefansky
```

## Claude Desktop

Status: supported target for local sessions.

Claude Desktop supports plugins for local and SSH sessions. It does not support plugins for Desktop remote/cloud sessions.

Validation checklist:

1. Open a local Desktop session.
2. Install the plugin from the local marketplace or through the Desktop plugin UI.
3. Confirm Node.js is visible to the Desktop environment.
4. Run `/mdy-daf-companion:status`.
5. Run `/mdy-daf-companion:prepare`.
6. Run `/mdy-daf-companion:play` and confirm the floating Electron companion opens.
7. Run `/mdy-daf-companion:dashboard` and confirm the same companion switches to Stats.
8. Submit a normal coding prompt and confirm the video pauses when Claude waits.

Known caveat:

- Desktop may not inherit all shell-profile environment changes. If `mdy-daf doctor` reports Node or path issues, install Node in the user/system environment Desktop can see.

## VS Code Extension

Status: supported target for local sessions.

Claude Code’s VS Code extension includes Claude Code and provides plugin management from the extension UI. Install the plugin once, then validate from a local VS Code workspace.

Validation checklist:

1. Install the plugin with Claude Code CLI.
2. Open the workspace in VS Code.
3. Open Claude Code from the VS Code extension.
4. Run `/mdy-daf-companion:status`.
5. Run `/mdy-daf-companion:prepare`.
6. Submit a coding prompt.
7. Confirm the player opens locally and progress appears in `/mdy-daf-companion:stats`.

## SSH, Dev Containers, And Remote Sessions

Partial support only.

In SSH/dev-container sessions, the plugin runs where Claude Code runs. That means the daemon binds to `127.0.0.1` on the remote host, not necessarily on your laptop.

Recommended behavior:

- Use local sessions for automatic playback.
- For SSH/dev containers, use remote-safe mode or port forwarding.
- Do not expect the Electron companion to appear on your local desktop from a remote host without additional setup.

Unsupported:

- Claude Desktop remote/cloud sessions.
- Claude Code web/cloud sessions for local playback.

The runtime detects `CLAUDE_CODE_REMOTE=true` and disables local daemon startup.

## Troubleshooting

### `/plugin` Is Missing

Update Claude Code to the latest version.

### Plugin Does Not Load

Run:

```bash
claude plugin validate .
```

Then reload:

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
mdy-daf resolve --date 2026-04-19
```

If this fails, check internet access and whether YouTube/MDY page structure changed. Optional `youtube_api_key` improves metadata lookup.
