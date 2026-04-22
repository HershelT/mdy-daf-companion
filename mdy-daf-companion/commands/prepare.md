---
description: Resolve today's MDY shiur and prepare the local player.
---

Immediately run `mdy-daf prepare`.

If `mdy-daf` is not available on PATH, run `node "${CLAUDE_PLUGIN_ROOT}/dist/src/cli.js" prepare`.

Do not ask follow-up questions before running the command.

After running it, summarize the resolved video title, daf, confidence, and whether the player is ready.

If resolution fails, summarize likely causes (for example next-day daf not uploaded yet, no confident title match, or source adapter/network issues), then suggest `mdy-daf doctor`.
