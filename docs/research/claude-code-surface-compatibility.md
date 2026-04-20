# Claude Code Surface Compatibility

Research date: April 20, 2026.

Primary sources:

- `https://code.claude.com/docs/en/platforms`
- `https://code.claude.com/docs/en/desktop`
- `https://code.claude.com/docs/en/vs-code`
- `https://code.claude.com/docs/en/plugins`
- `https://code.claude.com/docs/en/hooks`

## Executive Summary

MDY Daf Companion should work best in local Claude Code sessions: CLI, Desktop local sessions, and VS Code local sessions. It should not be expected to work in Desktop remote/cloud sessions because official Desktop docs say plugins are not available for remote sessions. SSH sessions and dev-container style sessions need a different player strategy because the plugin runs on the remote machine, while the user wants video on their local desktop.

## Compatibility Matrix

| Surface | Expected support | Why |
| --- | --- | --- |
| Claude Code CLI, local | Yes | Full plugin/hook surface; local daemon and browser can run on the user's machine. |
| Claude Code Desktop, local | Yes | Desktop docs say Desktop uses the same underlying engine and supports plugin installation for local sessions. |
| Claude Code Desktop, SSH | Partial | Plugins are available for SSH sessions, but the daemon/player would run on the SSH host. Needs port forwarding or a local companion mode. |
| Claude Code Desktop, remote/cloud | No | Desktop docs explicitly say plugins are not available for remote sessions. |
| VS Code extension, local | Likely yes | VS Code docs say settings such as hooks and MCP are shared with CLI, and the extension includes the CLI. Needs hands-on validation before public claims. |
| VS Code extension, dev container/remote SSH | Partial | Same issue as SSH: playback process runs remotely unless a local bridge is added. |
| Claude Code on the web | No | Cloud sessions do not run local plugin hooks/player. |
| Mobile monitoring / Remote Control of local session | Indirect | If the underlying session is local CLI/VS Code, hooks can run locally. Mobile itself does not host the player. |
| JetBrains local | Likely partial | Claude Code IDE surfaces share the underlying engine, but plugin install UX and hook behavior should be validated directly. |

## Key Official Findings

Desktop:

- The Code tab in Claude Desktop is a graphical interface for Claude Code.
- Desktop supports local, SSH, and remote/cloud environments.
- Desktop can install plugins for local and SSH sessions through its plugin UI.
- Desktop docs explicitly state plugins are not available for remote sessions.
- Desktop local sessions may not inherit the full shell environment. On macOS it extracts PATH from shell profiles; on Windows it inherits user/system environment variables but not PowerShell profiles.
- Desktop is macOS and Windows only; Linux is not supported for the Desktop app.

VS Code:

- The VS Code extension includes the CLI.
- Claude Code settings in `~/.claude/settings.json` are shared between the extension and CLI for allowed commands, environment variables, hooks, and MCP servers.
- Not all built-in Claude Code commands are available through the extension UI.
- The extension can open Claude Code in terminal mode, which should behave closest to CLI.

Hooks:

- Hook handlers run in the current directory with Claude Code's environment.
- Hook docs expose `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` for plugin scripts and persistent data.
- `$CLAUDE_CODE_REMOTE` is set to `"true"` in remote web environments and is not set in the local CLI.

## Product Implications

### Local CLI

Primary target. The current daemon/player architecture is appropriate.

### Desktop Local

Should be supported, but onboarding must mention environment caveats:

- Node must be available in Desktop's local session environment.
- If the player launcher cannot find the system browser, use `player-url` and the Desktop preview/browser manually.
- Desktop plugin install UI should be tested with the packaged plugin.

### VS Code Local

Likely supported if the plugin is installed into Claude Code's shared plugin system. Validation tasks:

- Install plugin through CLI.
- Open Claude Code VS Code panel.
- Confirm hooks fire.
- Confirm `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` are set.
- Confirm daemon starts.
- Confirm `open-player` launches the local browser.

### SSH And Remote Dev Environments

Do not auto-open a player by default. The daemon would bind to `127.0.0.1` on the remote host, not the user's laptop.

Future solution:

- Detect SSH/devcontainer/remote environment.
- Provide a "remote-safe" mode that records stats but does not auto-open playback.
- Offer a local bridge or tunnel instructions.

### Remote Cloud

Unsupported for now. If `$CLAUDE_CODE_REMOTE=true`, the plugin should not start the local player daemon.

## Required Validation Before Public Release

- CLI local on macOS, Windows, and Linux.
- Desktop local on macOS and Windows.
- Desktop SSH with remote-safe mode.
- VS Code local on macOS, Windows, and Linux.
- VS Code Remote SSH/dev container with remote-safe mode.
- Confirm plugin install and skill visibility in Desktop plugin UI.
- Confirm hooks fire from VS Code extension sessions, not only terminal mode.

