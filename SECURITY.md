# Security

## Supported Versions

This repository currently supports the unreleased `0.1.x` beta line.

## Reporting A Vulnerability

Please report security issues privately to the project maintainer before public disclosure.

Include:

- Affected version or commit.
- Reproduction steps.
- Expected and actual behavior.
- Any logs that do not include private code, prompts, transcripts, or credentials.

## Security Model

- The daemon binds to `127.0.0.1`.
- Local API calls require a random bearer token.
- Persistent state is stored in `${CLAUDE_PLUGIN_DATA}`.
- YouTube videos are embedded, not downloaded.
- Sensitive plugin options such as `youtube_api_key` should be handled through Claude Code plugin user configuration.

