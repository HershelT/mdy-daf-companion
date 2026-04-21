# Privacy Policy

Last updated: April 21, 2026.

MDY Daf Companion is designed to be local-first.

## Data Stored Locally

The plugin may store:

- User settings.
- Daf Yomi date mappings.
- Resolved video metadata.
- Playback progress.
- Watch segments and daily watch totals.
- Claude Code lifecycle timing, such as when a session starts, stops, or waits.
- Aggregated coding minutes.

## Data Not Stored By Default

The plugin does not store these by default:

- Prompt text.
- Transcript contents.
- Source code.
- File contents.
- Raw tool inputs.
- Raw project paths.

Project-level analytics, if added later, should hash or omit project paths unless the user explicitly opts in.

## Network Requests

The plugin may request:

- Daf Yomi calendar data from Hebcal.
- Public metadata from the official MDY YouTube channel page.
- YouTube embedded playback through the YouTube IFrame API.

The plugin does not download, mirror, transcode, or redistribute YouTube videos.

The plugin does not send local watch/coding stats to this project, MDY, Anthropic, or any custom analytics service. YouTube playback itself is loaded from YouTube and is subject to YouTube's own behavior.

## Local Daemon

The daemon binds to `127.0.0.1` and protects local API calls with a random bearer token stored in plugin data.

The Electron companion loads the daemon's local `/companion` route and embeds the official YouTube iframe. It blocks external navigation and popup attempts instead of opening a regular browser fallback.

## Telemetry

No telemetry is implemented. Any future telemetry, crash reporting, sync, leaderboards, or community stats must be explicit opt-in.

## Uninstall And Data Removal

Claude Code plugin uninstall behavior may remove plugin data when the last installed scope is removed unless `--keep-data` is used. To manually remove local data, delete the `${CLAUDE_PLUGIN_DATA}` directory reported by `mdy-daf doctor`.
