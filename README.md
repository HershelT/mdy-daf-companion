# MDY Daf Companion For Claude Code

This repository contains the product specification and initial Claude Code plugin scaffold for MDY Daf Companion.

The goal is to build a polished plugin that plays the latest Rabbi Eli Stefansky / Mercaz Daf Yomi shiur while Claude Code is working, pauses when Claude Code stops or waits for the user, saves video progress, and tracks local learning and coding stats.

## Current State

This is a planning and scaffold package, not the finished runtime.

Included:

- Full product spec.
- Claude Code architecture research.
- MDY domain research.
- Technical architecture.
- Data model.
- Testing strategy.
- Release and marketing plan.
- Initial Claude Code plugin structure under `mdy-daf-companion/`.
- Placeholder hook and CLI scripts for safe validation experiments.

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

The runtime implementation still needs to be built according to `docs/implementation-roadmap.md`.

## Disclaimer

This project is an independent companion concept and is not affiliated with or endorsed by Mercaz Daf Yomi unless a future partnership is established.

