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

## Commit Guidelines

Use focused commits with concise messages. Do not add `Co-authored-by` trailers.

