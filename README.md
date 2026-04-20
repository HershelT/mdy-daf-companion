# MDY Daf Companion For Claude Code

This repository contains the product specification and initial Claude Code plugin scaffold for MDY Daf Companion.

The goal is to build a polished plugin that plays the latest Rabbi Eli Stefansky / Mercaz Daf Yomi shiur while Claude Code is working, pauses when Claude Code stops or waits for the user, saves video progress, and tracks local learning and coding stats.

## Current State

This is now an implemented foundation plus product/spec package. The runtime can ingest Claude Code hook events, start a local daemon, expose an authenticated local API, serve a YouTube IFrame player shell, persist playback progress, resolve Daf Yomi calendar data, and report local stats.

Included:

- Full product spec.
- Claude Code architecture research.
- MDY domain research.
- Technical architecture.
- Data model.
- Testing strategy.
- Release and marketing plan.
- Claude Code plugin structure under `mdy-daf-companion/`.
- Tested TypeScript runtime with CLI, hooks, daemon, resolver, player shell, stats, and doctor checks.

## Key Docs

- `AGENTS.md`
- `docs/product-spec.md`
- `docs/technical-architecture.md`
- `docs/implementation-roadmap.md`
- `docs/release-and-marketing.md`
- `docs/research/mdy-domain-research.md`
- `docs/research/claude-code-april-2026.md`

## Plugin Scaffold

Plugin root:

```text
mdy-daf-companion/
  .claude-plugin/plugin.json
  hooks/hooks.json
  commands/
  skills/
  agents/
  scripts/
  bin/
```

Development test target:

```bash
claude --plugin-dir ./mdy-daf-companion
```

Then validate with:

```bash
claude plugin validate ./mdy-daf-companion
```

Useful runtime commands from `mdy-daf-companion/`:

```bash
npm install
npm test
npm run validate:plugin
node dist/src/cli.js doctor
node dist/src/cli.js today --date 2026-04-20
node dist/src/cli.js start-daemon
node dist/src/cli.js player-url
```

The remaining work is to connect live MDY/YouTube candidate discovery, launch the player window automatically, and package cross-platform release wrappers.

Compatibility research is in `docs/research/claude-code-surface-compatibility.md`. Short version: local CLI, local Desktop, and likely local VS Code are the main supported targets; Desktop remote/cloud sessions do not support plugins; SSH/dev-container sessions need remote-safe playback handling.


## Disclaimer

This project is an independent companion concept and is not affiliated with or endorsed by Mercaz Daf Yomi unless a future partnership is established.
