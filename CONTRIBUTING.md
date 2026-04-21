# Contributing

Thanks for helping improve MDY Daf Companion.

## Development Setup

```bash
cd mdy-daf-companion
npm install
npm run check
```

## Before Opening A Pull Request

Run:

```bash
npm run check
npm run verify:current-daf
```

This runs:

- TypeScript build.
- Unit and integration tests.
- Claude plugin validation.
- Smoke checks.

## Coding Guidelines

- Keep hooks fast and fail-open.
- Do not store prompt text, transcript contents, source code, file contents, or raw tool inputs by default.
- Do not download, mirror, transcode, or redistribute YouTube videos.
- Use official/public sources and isolate scraping behind source adapters.
- Add tests for resolver edge cases, date boundaries, hook behavior, and privacy-sensitive changes.
- Keep public docs current when install, release, compatibility, Electron behavior, or first-run behavior changes.
- Repackage Electron when companion shell, player UI, launcher behavior, Electron dependencies, or bundled runtime files change.

## Commit Guidelines

Use focused commits with concise messages. Do not add `Co-authored-by` trailers.
