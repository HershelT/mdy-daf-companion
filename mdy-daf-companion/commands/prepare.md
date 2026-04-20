---
description: Resolve today's MDY shiur and prepare the local player.
---

Run `mdy-daf prepare`. If `mdy-daf` is not available on PATH, run `node "${CLAUDE_PLUGIN_ROOT}/dist/src/cli.js" prepare`. Summarize the resolved video title, daf, confidence, and whether the player is ready. If resolution fails, explain which source adapter failed and suggest `mdy-daf doctor`.
