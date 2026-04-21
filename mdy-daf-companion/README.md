# MDY Daf Companion

MDY Daf Companion is a Claude Code plugin for Daf Yomi learners. It resolves the correct Rabbi Eli Stefansky / Mercaz Daf Yomi shiur, opens it in a floating Electron companion while Claude Code works, pauses when Claude waits for you, saves progress, and keeps local watch/coding stats.

This is an independent project. It is not affiliated with or endorsed by Mercaz Daf Yomi, Rabbi Eli Stefansky, YouTube, Google, Anthropic, or Claude unless a future partnership is explicitly announced.

## Highlights

- Current Daf Yomi lookup through Hebcal.
- MDY shiur resolution through layered MDY/YouTube source adapters.
- Floating, movable, always-on-top Electron companion with the official YouTube iframe.
- Automatic play/resume from Claude Code prompt lifecycle hooks.
- Automatic pause and progress save when Claude stops, idles, asks for permission, or ends a session.
- In-companion Stats view; no separate browser dashboard.
- Local SQLite storage for settings, playback progress, source cache, and aggregate stats.
- Shabbos and Yom Tov guard behavior.
- Claude Code CLI, Claude Desktop local, and VS Code extension local support targets.

## Requirements

- Claude Code with plugin support.
- Node.js 24 or newer.
- Internet access for Hebcal, MDY/YouTube metadata, and YouTube playback.
- Local Claude session access for automatic Electron playback.
- Packaged Electron companion bundles for release installs, or the local `electron` dev dependency for development.

Remote/cloud Claude sessions are not supported for local playback. SSH/dev-container sessions are partial because the daemon and Electron companion run wherever Claude Code runs.

## Public Install

After the npm package is published and the marketplace repository is on GitHub:

```bash
claude plugin marketplace add OWNER/REPO
claude plugin install mdy-daf-companion@mdy-daf-companion
```

Replace `OWNER/REPO` with the GitHub repository containing `.claude-plugin/marketplace.json`.

No setup command is required. Start Claude Code normally and submit a prompt; the plugin resolves today's Daf Yomi, opens the Electron companion, and starts playback when safe. Use `/mdy-daf-companion:setup` only if you want to change preferences.

## Local Development Test

From the repository root:

```bash
cd mdy-daf-companion
npm install
npm run package:companion:win
npm run check
npm run verify:current-daf
cd ..
claude --plugin-dir ./mdy-daf-companion
```

On macOS or Linux, replace the package command:

```bash
npm run package:companion:mac
npm run package:companion:linux
```

Inside the Claude session, submit a normal prompt. The companion should open automatically from the `UserPromptSubmit` hook. Manual commands:

```text
/mdy-daf-companion:status
/mdy-daf-companion:play
/mdy-daf-companion:dashboard
/mdy-daf-companion:stats
```

For direct CLI testing without installing:

```bash
node dist/src/cli.js doctor
node dist/src/cli.js open-player
node dist/src/cli.js open-dashboard
node dist/src/cli.js stats
```

## How Automatic Playback Works

Claude Code emits lifecycle hooks. MDY Daf Companion maps them to daemon actions:

| Claude Code event | Companion behavior |
| --- | --- |
| `SessionStart` | Start daemon and prepare today's shiur. |
| `UserPromptSubmit` | Resolve if needed, set playback to playing, and open/refocus the companion. |
| `Notification` permission/idle prompt | Pause and save progress. |
| `Stop` | Pause and save progress. |
| `StopFailure` | Pause and save progress. |
| `PreCompact` / `PostCompact` | Flush state. |
| `SessionEnd` | Pause and flush state. |

The companion intentionally stays open when Claude stops. It pauses, saves progress, and leaves the learner in control. Hover or focus the companion to reveal window controls.

## Window Behavior

- The video fills the companion window.
- The top overlay can be dragged to move the window.
- Pin, minimize, and close controls appear while hovering or focusing; they stay visible on touch/no-hover displays.
- Playback controls appear as a bottom overlay while hovering or focusing.
- The `Stats` button switches the same Electron companion into dashboard mode.
- Window size, position, and always-on-top state are saved locally.
- Closing the companion does not stop the daemon. The next prompt or `/play` can reopen it.
- There is no regular browser player and no browser fallback.

`mdy-daf open-player`, `/play`, and the `UserPromptSubmit` hook all request playback before opening or refocusing the companion. The Electron shell allows autoplay and the YouTube iframe requests autoplay when daemon state is `playing`. If YouTube requires a one-time gesture on a particular machine, click the YouTube play overlay once; subsequent daemon play/pause calls continue from saved progress.

## How Shiur Resolution Works

The resolver does not blindly pick the newest upload. It:

1. Gets Daf Yomi for the configured date/timezone from Hebcal.
2. Collects candidates from MDY app/page extraction, optional YouTube Data API, and public MDY YouTube channel fallback.
3. Parses titles for masechta, daf, language, format, duration, and exclusion hints.
4. Excludes events, promos, unrelated shorts, donation clips, and announcements.
5. Scores daf match, masechta match, language preference, format preference, source confidence, duration, and recency.
6. Stores the selected shiur and playback progress in local SQLite.

Clean first-run resolution is verified by:

```bash
npm run verify:current-daf
```

The verifier creates a clean temporary data directory with no setup file, asks Hebcal for today's Daf Yomi, resolves through the daemon, and fails if the selected shiur's masechta/daf does not match Hebcal.

## Commands

| Command | Purpose |
| --- | --- |
| `mdy-daf doctor` | Validate runtime, plugin files, Electron companion, data directory, and SQLite. |
| `mdy-daf today` | Print the Daf Yomi for a date. |
| `mdy-daf resolve` | Resolve a date to the best MDY video candidate. |
| `mdy-daf prepare` | Resolve and store the current shiur. |
| `mdy-daf open-player` | Start daemon, request playback, and open the floating Electron companion. |
| `mdy-daf open-dashboard` | Open the same Electron companion directly to Stats. |
| `mdy-daf play` / `resume` | Set daemon playback state to playing. |
| `mdy-daf pause` | Pause and save progress. |
| `mdy-daf stats` | Print today's local watched/coding stats. |
| `mdy-daf status` | Print daemon, current daf, and progress status. |
| `mdy-daf setup` | Optional preference tuning. |

Slash commands:

```text
/mdy-daf-companion:setup
/mdy-daf-companion:play
/mdy-daf-companion:pause
/mdy-daf-companion:dashboard
/mdy-daf-companion:stats
/mdy-daf-companion:status
```

## Configuration

Defaults work without setup:

- `language`: `english`
- `format`: `full`
- `timezone`: local machine timezone
- `auto_open_player`: `true`
- Shabbos/Yom Tov guard: enabled
- `youtube_api_key`: optional

Direct CLI setup:

```bash
mdy-daf setup --language english --format full --timezone America/Chicago --guard true --auto-open true
```

## Development

```bash
npm install
npm run build
npm test
npm run validate:plugin
npm run smoke
npm run check
```

Package commands:

```bash
npm run package:companion:win
npm run package:companion:mac
npm run package:companion:linux
```

Release checks:

```bash
npm run verify:current-daf
npm run release:prepare:win
npm publish --dry-run
```

`out/` contains generated Electron bundles and is intentionally ignored by git.

## Publish And Update

The public release is an npm package referenced by a GitHub-hosted Claude Code marketplace.

Publish through GitHub Actions:

1. Push the repository to GitHub.
2. Add `NPM_TOKEN` as a repository secret.
3. Run `Release MDY Daf Companion`.
4. Set workflow input `publish` to `true`.

Manual publish from a workspace that already contains all platform bundles:

```bash
npm login
npm run release:prepare
npm publish
```

When changing code, repackage Electron if the companion shell, player page, launcher, Electron dependency, or bundled runtime changes. For public updates, bump `package.json`, `.claude-plugin/plugin.json`, and the root marketplace version before publishing.

## Compatibility

| Surface | Status | Notes |
| --- | --- | --- |
| Claude Code CLI local | Supported | Best-tested path. |
| Claude Desktop local | Supported target | Validate Node visibility in Desktop's local environment. |
| VS Code extension local | Supported target | Manage plugin with `/plugins`; verify hooks from the chat panel. |
| Desktop SSH | Partial | Plugin runs on the SSH host. Electron appears there unless bridged. |
| VS Code Remote SSH/dev container | Partial | Same remote-host caveat. |
| Desktop remote/cloud | Unsupported | No local plugin/Electron surface for this product. |
| Claude Code web/cloud | Unsupported | No local daemon/Electron surface. |

Detailed Desktop and VS Code steps are in [DESKTOP_AND_VSCODE_VALIDATION.md](DESKTOP_AND_VSCODE_VALIDATION.md).

## Privacy And Security

- Local daemon binds to `127.0.0.1`.
- Local API calls require a random bearer token.
- Electron blocks external navigation and popups.
- YouTube videos are embedded, not downloaded or redistributed.
- Prompt text, source code, transcript content, file contents, raw tool input, and raw project paths are not stored by default.
- No telemetry is implemented.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), and [SUPPORT.md](SUPPORT.md).

## Release Status

This is a release candidate. Automated tests, plugin validation, smoke checks, Windows packaged companion launch, live current-Daf verification, npm dry-run packaging, and real Claude Code CLI hook smoke have passed locally. Remaining public-release validation includes hands-on Claude Desktop local, VS Code extension local, macOS package launch/signing, Linux package launch, and brand/legal review.

## License

MIT. See [LICENSE](LICENSE).
