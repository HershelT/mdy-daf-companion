# Design System And UX Direction

## Personality

The product should feel calm, capable, and warm. It is for people who are trying to keep a real daily learning commitment while doing serious technical work.

Avoid making the UI feel like a generic productivity tracker. The emotional center is daily continuity.

## Visual Principles

- Respect MDY without copying or impersonating official MDY branding.
- Use a restrained, readable interface that works beside a terminal/editor.
- Avoid a one-color palette. Use neutral surfaces with meaningful accent colors.
- Do not use decorative gradient orbs, bokeh blobs, or vague AI-style backgrounds.
- Keep controls recognizable: play, pause, skip, volume, settings, stats.
- Cards should be used for actual repeated items or panels, not nested decorative layout.
- Text must fit in compact windows and narrow sidebars.

## Suggested Palette

- Ink: `#1F2933`
- Paper: `#F7F7F2`
- Surface: `#FFFFFF`
- Border: `#D6D3C8`
- Accent blue: `#2563EB`
- Accent green: `#168A5B`
- Accent gold: `#B7791F`
- Danger: `#B42318`

Use accent colors sparingly for state:

- Playing: green.
- Paused/waiting: gold.
- Error/blocked: red.
- Links/actions: blue.

## Player Window

Primary compact layout:

- Header: current daf and shiur format.
- Main: YouTube iframe.
- Footer controls: play/pause, seek, volume, open in YouTube, mark watched.
- Progress: watched minutes and percent.
- Optional side panel: notes, chapters, stats.

Compact mode:

- Current daf.
- Play/pause.
- Progress bar.
- Today stats.

Status-only mode:

- No player window unless manually opened.
- Status line and commands still work.

## Dashboard

Sections:

- Today: daf, video, watch progress, coding time.
- This week: watched minutes, dafim completed, streak.
- Catch-up: missing dafim and recommended next video.
- Settings: language, format, playback triggers, privacy, Shabbos/Yom Tov guard.

## UX Rules

- Never surprise users with loud autoplay. First run should make behavior clear.
- Always provide a visible pause/disable route.
- Do not show marketing copy inside the working UI.
- Do not shame the user for missed dafim. Use catch-up language.
- Keep stats encouraging but honest.

## Accessibility

- Keyboard controls for all playback actions.
- High contrast text.
- Avoid relying on color alone for state.
- Clear focus indicators.
- Reduced-motion support.

