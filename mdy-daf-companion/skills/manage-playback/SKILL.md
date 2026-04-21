---
description: Control MDY Daf Companion playback during Claude Code sessions, including play, pause, resume, progress, and settings.
---

# Manage Playback

Use this skill when the user asks to control playback or change playback behavior.

Actions should go through the `mdy-daf` CLI or local daemon.

Default rules:

1. Resume playback when Claude Code is actively working and settings allow it.
2. Pause and save progress when Claude stops, waits for permission, idles, or the session ends.
3. Respect Shabbos/Yom Tov guard settings.
4. Respect manual pause until the user resumes or the configured timeout expires.
5. Never let playback failures interrupt coding work.
6. Use the floating Electron companion as the only video playback surface. Do not open the shiur in a regular browser window as a fallback.
7. Use `mdy-daf open-dashboard` for stats; it opens the Stats view inside the Electron companion, not a browser dashboard.
8. If Electron is missing, run or suggest `mdy-daf doctor` and package/install guidance instead of opening a URL.
