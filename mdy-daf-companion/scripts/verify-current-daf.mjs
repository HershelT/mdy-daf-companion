#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdy-current-daf-"));

process.env.CLAUDE_PLUGIN_ROOT = pluginRoot;
process.env.CLAUDE_PLUGIN_DATA = dataRoot;

function distImport(relativePath) {
  return import(pathToFileURL(path.join(pluginRoot, "dist", "src", relativePath)).href);
}

async function stopDaemon(paths, readDaemonState) {
  const state = readDaemonState(paths);
  if (!state?.pid || state.pid === process.pid) {
    return;
  }
  try {
    process.kill(state.pid);
  } catch {
    // The daemon may have already exited; this is only cleanup for the verifier.
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeDirectoryWithRetries(target) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 2, retryDelay: 150 });
      return;
    } catch (error) {
      if (attempt === 8) {
        throw error;
      }
      await wait(150 * attempt);
    }
  }
}

const { resolveRuntimePaths } = await distImport("core/paths.js");
const { loadConfig } = await distImport("core/config.js");
const { civilDateInTimezone } = await distImport("core/time.js");
const { HebcalDafCalendar } = await distImport("resolver/dafCalendar.js");
const { resolveCurrentShiur, startDaemonProcess } = await distImport("daemon/client.js");
const { readDaemonState } = await distImport("daemon/state.js");

const paths = resolveRuntimePaths(process.env);

try {
  if (fs.existsSync(paths.configPath)) {
    throw new Error(`Verifier expected a clean first run, but found config at ${paths.configPath}`);
  }

  const config = loadConfig(paths);
  const date = civilDateInTimezone(new Date(), config.timezone);
  const expected = await new HebcalDafCalendar().getDafForDate(date);

  await startDaemonProcess(paths);
  const resolved = await resolveCurrentShiur(paths);
  const currentShiur = resolved?.currentShiur;

  if (!currentShiur) {
    throw new Error("Current shiur was not resolved on clean first run");
  }
  if (currentShiur.masechta !== expected.masechta || currentShiur.daf !== expected.daf) {
    throw new Error(
      `Resolved ${currentShiur.masechta} ${currentShiur.daf}, expected ${expected.masechta} ${expected.daf} for ${date}`
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        cleanFirstRun: true,
        timezone: config.timezone,
        date,
        expectedDaf: `${expected.masechta} ${expected.daf}`,
        resolvedTitle: currentShiur.title,
        videoId: currentShiur.videoId,
        sourceUrl: currentShiur.sourceUrl
      },
      null,
      2
    )
  );
} finally {
  await stopDaemon(paths, readDaemonState);
  await removeDirectoryWithRetries(dataRoot);
}
