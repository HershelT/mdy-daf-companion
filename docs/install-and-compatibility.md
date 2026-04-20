# Install And Compatibility

Last updated: April 20, 2026.

This guide covers installing MDY Daf Companion as a Claude Code plugin and validating it across Claude Code surfaces.

## Requirements

- Claude Code with the `/plugin` command available.
- Node.js 24 or newer.
- Local machine access for the player daemon and browser window.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.

## Install From This Repository

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
mdy-daf open-dashboard
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
6. Run `/mdy-daf-companion:play` or `/mdy-daf-companion:dashboard`.
7. Submit a normal coding prompt and confirm the video pauses when Claude waits.

Known caveat:

- Desktop may not inherit all shell-profile environment changes. If `mdy-daf doctor` reports Node or path issues, install Node in the user/system environment Desktop can see.

## VS Code Extension

Status: supported target for local sessions, pending hands-on extension validation.

Claude Code’s VS Code extension includes Claude Code and shares core settings such as hooks and MCP with the CLI. Install the plugin once, then validate from a local VS Code workspace.

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
- Do not expect automatic browser launch to work from a remote host without additional setup.

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
mdy-daf player-url
```

Open the printed URL manually in your browser.

### Resolver Cannot Find A Shiur

Run:

```bash
mdy-daf resolve --date 2026-04-19
```

If this fails, check internet access and whether YouTube/MDY page structure changed. Optional `youtube_api_key` improves metadata lookup.

