# Claude Desktop And VS Code Validation

Last updated: April 21, 2026.

This guide explains how to validate MDY Daf Companion in Claude Desktop local sessions and the Claude Code VS Code extension. The steps reflect the current official Claude Code docs checked on April 21, 2026.

Primary references:

- https://code.claude.com/docs/en/desktop
- https://code.claude.com/docs/en/vs-code
- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/hooks

## Prepare The Plugin Once

From the repository root:

```bash
cd mdy-daf-companion
npm install
npm run package:companion:win
npm run check
cd ..
claude plugin validate .
claude plugin marketplace add . --scope local
claude plugin install mdy-daf-companion@mdy-daf-companion --scope local
```

Use `npm run package:companion:mac` on macOS and `npm run package:companion:linux` on Linux. For development-only testing, `claude --plugin-dir ./mdy-daf-companion` is also valid.

## Claude Desktop Local Validation

Official behavior to rely on:

- Desktop supports plugins for local and SSH sessions.
- Desktop does not support plugins for remote/cloud sessions.
- Desktop can install plugins through the app UI.
- On Windows, Desktop inherits user/system environment variables, not PowerShell profiles.
- On macOS, Desktop extracts `PATH` from shell profiles but does not inherit arbitrary exported variables.

Validation steps:

1. Open Claude Desktop.
2. Start a `Local` session for this repository folder.
3. Click the `+` button next to the prompt box.
4. Select `Plugins`.
5. Confirm `mdy-daf-companion` appears in installed plugins. If not, choose `Add plugin`, add the local marketplace, then install it.
6. If Desktop cannot see Node.js, open the local environment editor from the environment dropdown, hover `Local`, click the gear icon, and make sure Node is on `PATH`.
7. In the prompt box, run:

```text
/mdy-daf-companion:status
/mdy-daf-companion:prepare
/mdy-daf-companion:play
/mdy-daf-companion:dashboard
```

8. Confirm the floating Electron companion opens, not a regular browser.
9. Submit a normal coding prompt.
10. Confirm playback resumes on prompt submit and pauses when Claude stops or asks for input.
11. Run `/mdy-daf-companion:stats` and confirm watched/coding stats update.

Pass criteria:

- Slash commands are visible.
- `status` reports a healthy daemon or actionable setup guidance.
- `play` opens the Electron companion.
- `dashboard` switches the same companion to Stats.
- The prompt lifecycle hooks produce play/pause behavior.

## VS Code Extension Local Validation

Official behavior to rely on:

- The Claude Code VS Code extension includes the CLI.
- Plugin management in VS Code uses the same CLI commands under the hood.
- Plugins and marketplaces configured in the extension are available to the CLI, and vice versa.
- VS Code can open Claude Code in the graphical panel or terminal mode.

Validation steps:

1. Open this repository in VS Code.
2. Open the Claude Code extension panel.
3. Type `/plugins` in the Claude prompt box.
4. On the `Marketplaces` tab, add the local marketplace path for this repository if it is not already present.
5. On the `Plugins` tab, install or enable `mdy-daf-companion`.
6. Restart/reload Claude Code if the extension shows a restart banner.
7. Run:

```text
/mdy-daf-companion:status
/mdy-daf-companion:prepare
/mdy-daf-companion:play
/mdy-daf-companion:dashboard
```

8. Submit a normal coding prompt from the VS Code Claude panel.
9. Confirm the Electron companion opens on the local desktop and pauses when Claude stops or asks for permission.

Pass criteria:

- Plugin appears in `/plugins`.
- Slash commands are visible in the prompt.
- Hooks fire from the VS Code chat panel, not only the integrated terminal.
- Electron opens locally.
- Stats update after watch/progress events.

## Validation Notes To Record

Add results to `../docs/release-validation-log.md` with:

- OS and version.
- Claude Code version.
- Claude Desktop or VS Code extension version.
- Plugin install scope.
- Whether `mdy-daf doctor` passed.
- Whether Electron opened from slash commands.
- Whether prompt-submit hooks opened/resumed and stop hooks paused.
- Any environment fixes required.
