# Claude Desktop And VS Code Validation

Last updated: April 21, 2026.

This guide explains how to validate MDY Daf Companion in Claude Desktop local sessions and the Claude Code VS Code extension. It is for hands-on release validation after the package has already passed automated CLI checks.

Primary references checked on April 21, 2026:

- https://code.claude.com/docs/en/desktop
- https://code.claude.com/docs/en/vs-code
- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/hooks

## Prepare The Plugin

For pre-publication local testing from the repository root:

```bash
cd mdy-daf-companion
npm install
npm run package:companion:win
npm run check
npm run verify:current-daf
cd ..
```

Use `npm run package:companion:mac` on macOS and `npm run package:companion:linux` on Linux.

For public-release validation after npm publication, install from the GitHub marketplace:

```bash
claude plugin marketplace add OWNER/REPO
claude plugin install mdy-daf-companion@mdy-daf-companion
```

For one-session development validation before publication:

```bash
claude --plugin-dir ./mdy-daf-companion
```

No `/setup` or `/prepare` command is required for the default flow. The first normal prompt should resolve today's Daf Yomi and open the Electron companion.

## Claude Desktop Local Validation

Official behavior to rely on:

- Desktop supports plugins for local and SSH sessions.
- Desktop does not provide this product's required local plugin/Electron surface in remote/cloud sessions.
- Desktop can install plugins through the app UI.
- On Windows, Desktop inherits user/system environment variables, not PowerShell profiles.
- On macOS, Desktop extracts `PATH` from shell profiles but does not inherit arbitrary exported variables.

Validation steps:

1. Open Claude Desktop.
2. Start a `Local` session for this repository folder or another local workspace.
3. Click the `+` button next to the prompt box.
4. Select `Plugins`.
5. Add the public marketplace `OWNER/REPO`, or use a local plugin path if validating before publication.
6. Confirm `mdy-daf-companion` appears in installed plugins and is enabled.
7. If Desktop cannot see Node.js, open the local environment editor from the environment dropdown, hover `Local`, click the gear icon, and make sure Node is on `PATH`.
8. Run:

```text
/mdy-daf-companion:status
/mdy-daf-companion:play
/mdy-daf-companion:dashboard
```

9. Confirm the floating Electron companion opens, not a regular browser.
10. Submit a normal coding prompt.
11. Confirm playback resumes on prompt submit and pauses when Claude stops or asks for input.
12. Run `/mdy-daf-companion:stats` and confirm watched/coding stats update.

Pass criteria:

- Slash commands are visible.
- `status` reports a healthy daemon or actionable setup guidance.
- `play` opens the Electron companion.
- `dashboard` switches the same companion to Stats.
- The prompt lifecycle hooks produce play/pause behavior.
- No regular browser window opens.

## VS Code Extension Local Validation

Official behavior to rely on:

- The Claude Code VS Code extension includes the CLI.
- Plugin management in VS Code uses the same Claude Code plugin system under the hood.
- Plugins and marketplaces configured in the extension are available to the CLI, and vice versa.
- VS Code can open Claude Code in the graphical panel or terminal mode.

Validation steps:

1. Open this repository in VS Code.
2. Open the Claude Code extension panel.
3. Type `/plugins` in the Claude prompt box.
4. On the `Marketplaces` tab, add the public marketplace `OWNER/REPO`, or add the local marketplace/path while validating before publication.
5. On the `Plugins` tab, install or enable `mdy-daf-companion`.
6. Restart/reload Claude Code if the extension shows a restart banner.
7. Run:

```text
/mdy-daf-companion:status
/mdy-daf-companion:play
/mdy-daf-companion:dashboard
```

8. Submit a normal coding prompt from the VS Code Claude panel.
9. Confirm the Electron companion opens on the local desktop and pauses when Claude stops or asks for permission.
10. Run `/mdy-daf-companion:stats`.

Pass criteria:

- Plugin appears in `/plugins`.
- Slash commands are visible in the prompt.
- Hooks fire from the VS Code chat panel, not only the integrated terminal.
- Electron opens locally.
- Dashboard opens inside the same companion.
- Stats update after watch/progress events.
- No regular browser window opens.

## Validation Notes To Record

Add results to `../docs/release-validation-log.md` with:

- OS and version.
- Claude Code version.
- Claude Desktop or VS Code extension version.
- Plugin install source: public marketplace, local path, or `--plugin-dir`.
- Whether `mdy-daf doctor` passed.
- Whether Electron opened from slash commands.
- Whether first prompt auto-resolved today's Daf Yomi.
- Whether prompt-submit hooks opened/resumed and stop hooks paused.
- Any environment fixes required.
