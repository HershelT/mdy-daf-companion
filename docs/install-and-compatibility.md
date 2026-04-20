# Install And Compatibility Guide

## Build Locally

From `mdy-daf-companion/`:

```bash
npm install
npm run check
```

## Claude Code CLI

Development launch:

```bash
claude --plugin-dir .
```

Useful commands:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
mdy-daf prepare
mdy-daf open-player
mdy-daf open-dashboard
mdy-daf stats
mdy-daf doctor
```

## Claude Desktop

Official docs say Desktop local and SSH sessions can install plugins from the plugin UI; remote/cloud sessions cannot use plugins.

Recommended validation:

1. Use a local Desktop session.
2. Add the plugin through the Desktop plugin UI or install it with Claude Code CLI first.
3. Run `/mdy-daf-companion:setup`.
4. Run `/mdy-daf-companion:prepare`.
5. Confirm the player opens in the system browser.
6. Confirm `/mdy-daf-companion:stats` updates after playback.

Desktop environment caveat:

- Desktop may not inherit shell profile changes. Make sure Node.js is available in the Desktop session environment.

## VS Code Extension

Official VS Code docs say the extension includes Claude Code and shares settings with the CLI, including hooks. This should work for local VS Code sessions once the plugin is installed into Claude Code.

Recommended validation:

1. Install or enable the plugin with Claude Code CLI.
2. Open the same workspace in VS Code.
3. Open Claude Code from the VS Code extension.
4. Run `/mdy-daf-companion:doctor`.
5. Submit a prompt and confirm hooks are recorded.
6. Run `/mdy-daf-companion:open-dashboard`.

Remote VS Code caveat:

- In Remote SSH/dev containers, the plugin runs remotely. The player URL points to the remote host unless forwarded. Use remote-safe mode or port forwarding.

## Unsupported

- Claude Desktop remote/cloud sessions.
- Claude Code web/cloud sessions for local playback.

The runtime checks `CLAUDE_CODE_REMOTE=true` and disables local daemon startup in that environment.

