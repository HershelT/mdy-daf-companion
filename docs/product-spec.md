# Product Spec: MDY Daf Companion For Claude Code

Status: Product and architecture specification.
Target platform: Claude Code plugin.
Research baseline: April 19, 2026.

## One-Line Pitch

MDY Daf Companion turns Claude Code work sessions into steady Daf Yomi time by automatically playing Rabbi Eli Stefansky's latest MDY shiur, pausing when Claude needs the user, saving progress, and showing meaningful learning and coding stats.

## Goals

- Make it easy for a developer to keep up with Daf Yomi during Claude Code sessions.
- Automatically choose the right MDY shiur for the user's daf, language, and preferred format.
- Start, pause, resume, and save progress based on Claude Code lifecycle events.
- Give the user satisfying stats without compromising privacy.
- Be polished enough to release publicly, market, and optionally monetize.

## Non-Goals

- Do not become a replacement for the official MDY app.
- Do not host, download, transcode, or redistribute MDY/YouTube videos.
- Do not scrape private user data from Claude Code transcripts.
- Do not force learning during times the user has configured as blocked.

## Primary Users

- Daf Yomi learner who codes with Claude Code daily.
- Developer who wants background Torah learning during long agentic coding loops.
- User who falls behind and wants gentle stats and catch-up support.
- MDY fan who wants a workflow-native companion.
- Team/community member who wants opt-in shared encouragement or sponsorship later.

## Core Experience

1. User installs the plugin.
2. First run asks for preferences or uses safe defaults:
   - Language: English.
   - Format: full Daf.
   - Start behavior: resume playback when Claude begins working.
   - Pause behavior: pause when Claude stops, asks for permission, idles, or waits for a prompt.
   - Stats: local-only.
   - Shabbos/Yom Tov guard: enabled, local timezone.
3. Claude Code starts or resumes a session.
4. Plugin resolves today's daf and best matching MDY video.
5. Plugin opens a small player window or reuses an existing one.
6. While Claude is working, video plays.
7. When Claude stops or asks the user for input, video pauses and progress is saved.
8. When the user prompts Claude again, playback resumes from the saved position.
9. Status line and commands show daf progress, coding time, learning time, streaks, and completion.

## Feature Set

### Playback Automation

- Auto-open current shiur when a Claude Code session starts.
- Auto-resume while Claude Code is actively working.
- Auto-pause on `Stop`, `StopFailure`, `Notification` permission prompts, idle prompts, and session end.
- Save progress every few seconds and at every pause.
- Resume at last watched position.
- Optional "continue yesterday's unfinished daf before today's daf".
- Optional "play only while tools are running" mode for users who do not want playback during Claude's text generation.
- Manual controls: play, pause, stop, mute, skip intro, jump to chapter, mark watched.

### Shiur Resolution

Resolver inputs:

- Civil date.
- User timezone.
- Optional Israel-date mode.
- Daf Yomi calendar.
- User language.
- User format.
- Completion/backlog state.

Source priority:

1. Official MDY app metadata if stable.
2. YouTube Data API on official MDY channel.
3. YouTube page extraction fallback.
4. Cached source data.

Matching rules:

- Match masechta and daf number.
- Prefer user language.
- Prefer user format: full Daf, chazarah, Hebrew full, Hebrew chazarah.
- Exclude unrelated events, shorts, siyumim, donation clips, or announcements unless user requested them.
- Prefer videos from the correct upload window but do not blindly pick newest upload.
- Cache chosen video with confidence score and source details.

### Stats

Local stats:

- Minutes watched today.
- Coding minutes today.
- Watch-to-coding ratio.
- Daf completion percent.
- Current daf streak.
- Total watched dafim.
- Total watched minutes.
- Dapim completed this week/month/cycle.
- Average minutes watched per coding hour.
- Most productive coding-learning windows.
- Projects with most learning time, with project name hashing available.
- Missed dafim and catch-up queue.

User-facing stats views:

- `/mdy-daf-companion:status`
- `/mdy-daf-companion:stats today`
- `/mdy-daf-companion:stats week`
- `/mdy-daf-companion:stats cycle`
- Status line segment.
- Local dashboard page.

### Privacy

Default:

- No cloud account.
- No telemetry.
- No upload of video history, coding sessions, project paths, transcript content, or source code.
- Store stats locally in plugin data directory.

Optional:

- Anonymous crash reports.
- Cloud sync.
- Community streaks.
- Sponsor mode.

Every optional network feature must be explicit and separately configurable.

### Shabbos And Yom Tov Guard

Default behavior:

- Do not auto-start playback during configured Shabbos/Yom Tov windows.
- Pause before the blocked window if a session crosses into it.
- Allow the user to disable or adjust based on minhag/location/preference.
- Store the user location/timezone locally.

Design detail:

- The guard controls auto-start and auto-resume.
- It should not delete progress or block manual user control unless the user chooses strict mode.

### Commands And Skills

Primary slash skills:

- `/mdy-daf-companion:status`
- `/mdy-daf-companion:play`
- `/mdy-daf-companion:pause`
- `/mdy-daf-companion:resume`
- `/mdy-daf-companion:today`
- `/mdy-daf-companion:stats`
- `/mdy-daf-companion:settings`
- `/mdy-daf-companion:catch-up`

The commands should talk to the local daemon through the CLI. If the daemon is not running, commands should explain how to start it or start it automatically when safe.

### Player

Player requirements:

- Use official YouTube embed/IFrame API.
- Small window with current daf title, progress, chapters if available, and controls.
- Do not obscure the user's editor.
- Persist window position and size.
- Support compact, full, and hidden audio-only-style window modes, subject to YouTube terms.
- Show source confidence and fallback warnings in settings, not as noisy daily UI.

### Onboarding

First run should feel quick:

- Choose language.
- Choose shiur format.
- Choose when to play.
- Enable or configure Shabbos/Yom Tov guard.
- Confirm privacy/local stats.

Avoid a long setup wizard. Put advanced options in settings.

## Marketable Product Tiers

Free core:

- Auto play/pause/resume.
- Current daf resolution.
- Local progress.
- Basic stats.
- Manual commands.
- Privacy-first local storage.

Supporter tier or paid add-on ideas:

- Beautiful dashboard and advanced analytics.
- Multi-device sync.
- Calendar and catch-up planning.
- Custom learning goals.
- Community challenges.
- Export reports.
- Sponsor/dedication rotation.
- Team or beis midrash group dashboards.

Important: the daily shiur playback and core Daf Yomi continuity should remain free or donation-supported. Do not make the product feel like it charges for access to Torah content.

## Success Metrics

Product metrics, if the user opts in:

- Install-to-first-successful-playback rate.
- Daily active learners.
- Average watched minutes per active day.
- Dapim completed.
- Retention over 7/30/90 days.
- Number of users who stay up to date.
- Manual pause/disable frequency.
- Resolver miss rate.

Local-only personal metrics:

- Today: coding minutes, watched minutes, progress.
- Week: dafim watched, average minutes.
- Cycle: total dafim, streaks, catch-up queue.

## Open Questions

- Does MDY have a stable public metadata endpoint that can be used with permission?
- Should the plugin open the official MDY app page instead of a local YouTube player when metadata is available?
- What is the correct legal/commercial posture if monetizing a companion for free YouTube shiurim?
- Should the product seek MDY permission or partnership before public launch?
- What exact Claude Code plugin `userConfig` schema is current at release time?

