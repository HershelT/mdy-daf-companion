# Support

Last updated: April 21, 2026.

MDY Daf Companion is an independent Claude Code plugin. It is not affiliated with or endorsed by Mercaz Daf Yomi, Rabbi Eli Stefansky, YouTube, Google, Anthropic, or Claude unless a future partnership is explicitly announced.

## Before Asking For Help

Run:

```bash
mdy-daf doctor
mdy-daf status
```

For repository development:

```bash
npm run check
```

For packaged companion validation:

```bash
npm run package:companion:win
mdy-daf open-player
mdy-daf open-dashboard
```

Use the matching package command for macOS or Linux on those platforms.

## Common Issues

### Windows Packaging Reports EPERM

Rerun `npm run package:companion:win` after closing the companion window. The package script tries to stop stale packaged companion processes automatically, but OneDrive or antivirus software can still briefly lock Electron DLLs in `out\mdy-daf-companion-win32-x64`.

### The Companion Does Not Open

Run `mdy-daf doctor`. A release install should include a matching `out/mdy-daf-companion-<platform>-<arch>` folder. A development install needs `npm install` so the local Electron runtime exists.

The plugin intentionally does not open a regular browser fallback.

### The Dashboard Opens The Video Window

That is expected. `mdy-daf open-dashboard` opens the same Electron companion directly to the Stats view.

### Nothing Opens From Claude Desktop

Use a local Desktop session, not a remote/cloud session. Confirm Node.js is visible to Desktop's local environment, then run `/mdy-daf-companion:status` and `/mdy-daf-companion:play`.

### Nothing Opens From VS Code

Use a local VS Code workspace. Open the Claude Code extension, manage plugins with `/plugins`, confirm the plugin is enabled, then run `/mdy-daf-companion:status` and `/mdy-daf-companion:play`.

### SSH Or Dev Containers

The daemon runs wherever Claude Code runs. In SSH/dev-container sessions, that may be the remote host, so the Electron companion may not appear on your laptop without a future local bridge or port-forwarding mode.

## Helpful Bug Report Details

Include:

- OS and version.
- Claude Code version.
- Surface: CLI, Desktop local, Desktop SSH, VS Code local, VS Code remote, or other.
- Output from `mdy-daf doctor`.
- Whether `mdy-daf open-player` works from a terminal.
- Relevant lines from `${CLAUDE_PLUGIN_DATA}/companion.log`, with tokens removed.

Do not include private prompts, source code, file contents, API keys, bearer tokens, or unrelated project data.
