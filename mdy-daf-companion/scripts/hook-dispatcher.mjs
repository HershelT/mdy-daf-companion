#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const eventArgIndex = args.indexOf("--event");
const eventAlias = eventArgIndex >= 0 ? args[eventArgIndex + 1] : "unknown";

let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  stdin += chunk;
});

process.stdin.on("end", () => {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(scriptDir, "..");
  const compiledCli = path.join(pluginRoot, "dist", "src", "cli.js");

  if (fs.existsSync(compiledCli)) {
    const result = spawnSync(
      process.execPath,
      [compiledCli, "hook", "--event", eventAlias],
      {
        input: stdin,
        encoding: "utf8",
        env: process.env,
        timeout: 3000
      }
    );

    if (result.status === 0) {
      process.stdout.write(result.stdout || "");
      process.exit(0);
    }
  }

  let payload = {};
  try {
    payload = stdin.trim() ? JSON.parse(stdin) : {};
  } catch (error) {
    payload = { parseError: String(error), rawLength: stdin.length };
  }

  const dataRoot =
    process.env.CLAUDE_PLUGIN_DATA ||
    path.join(os.tmpdir(), "mdy-daf-companion-dev");

  fs.mkdirSync(dataRoot, { recursive: true });

  const event = {
    receivedAt: new Date().toISOString(),
    eventAlias,
    hookEventName: payload.hook_event_name || null,
    sessionId: payload.session_id || null,
    cwdPresent: Boolean(payload.cwd),
    notificationType: payload.notification_type || null
  };

  fs.appendFileSync(
    path.join(dataRoot, "hook-events.jsonl"),
    `${JSON.stringify(event)}\n`,
    "utf8"
  );

  process.exit(0);
});

process.stdin.resume();
