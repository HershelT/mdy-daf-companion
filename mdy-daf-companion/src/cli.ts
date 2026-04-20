#!/usr/bin/env node
import { ingestHookEvent } from "./hooks/ingest.js";
import { formatStatus, getStatusSummary } from "./status/status.js";

async function readStdin(): Promise<string> {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input;
}

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function main(): Promise<void> {
  const command = process.argv[2] || "status";

  switch (command) {
    case "hook": {
      const fallbackEventName = argValue("--event", "Unknown");
      const stdin = await readStdin();
      const result = ingestHookEvent(stdin, fallbackEventName);
      if (result.parseError) {
        console.error(`Recorded hook with parse error: ${result.parseError}`);
      }
      process.stdout.write(`${JSON.stringify(result)}\n`);
      return;
    }
    case "status": {
      process.stdout.write(`${formatStatus(getStatusSummary())}\n`);
      return;
    }
    case "play":
    case "pause":
    case "resume":
    case "stats":
    case "doctor": {
      process.stdout.write(
        `${command} is wired into the CLI. The daemon/player implementation arrives in the next phases.\n`
      );
      return;
    }
    default:
      console.error(`Unknown command: ${command}`);
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

