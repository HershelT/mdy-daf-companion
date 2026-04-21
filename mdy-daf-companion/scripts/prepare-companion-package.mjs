#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_APP_NAME = "mdy-daf-companion";

function optionValue(argv, name, fallback) {
  const equalsPrefix = `${name}=`;
  const equalsArg = argv.find((arg) => arg.startsWith(equalsPrefix));
  if (equalsArg) {
    return equalsArg.slice(equalsPrefix.length);
  }
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
}

function splitCsv(value, fallback) {
  return String(value || fallback)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parsePackageArgs(argv = process.argv.slice(2)) {
  return {
    appName: optionValue(argv, "--app-name", DEFAULT_APP_NAME),
    platform: splitCsv(optionValue(argv, "--platform", process.platform), process.platform),
    arch: splitCsv(optionValue(argv, "--arch", process.arch), process.arch),
    out: optionValue(argv, "--out", "out")
  };
}

export function companionOutputDirectories(rootDir, options) {
  const outRoot = path.resolve(rootDir, options.out);
  const directories = [];
  for (const platform of options.platform) {
    for (const arch of options.arch) {
      directories.push(path.join(outRoot, `${options.appName}-${platform}-${arch}`));
    }
  }
  return directories;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopWindowsPackagedCompanions(outRoot) {
  if (process.platform !== "win32") {
    return;
  }

  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$outRoot = [System.IO.Path]::GetFullPath($args[0])
Get-Process mdy-daf-companion | ForEach-Object {
  try {
    $processPath = $_.Path
    if ($processPath) {
      $fullPath = [System.IO.Path]::GetFullPath($processPath)
      if ($fullPath.StartsWith($outRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        Stop-Process -Id $_.Id -Force
      }
    }
  } catch {}
}
`;

  try {
    execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script, outRoot], {
      stdio: "ignore",
      windowsHide: true
    });
  } catch {
    // Best-effort cleanup. If there is nothing to stop or process metadata is unavailable,
    // the directory removal step below will still report the real packaging blocker.
  }
}

async function removeWithRetries(target) {
  if (!fs.existsSync(target)) {
    return;
  }

  let lastError = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 2, retryDelay: 150 });
      if (!fs.existsSync(target)) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await wait(250 * attempt);
  }

  const message = lastError instanceof Error ? lastError.message : "output directory is still locked";
  throw new Error(
    `Could not remove ${target}: ${message}. Close MDY Daf Companion windows, pause OneDrive sync if it is locking release files, and rerun the package command.`
  );
}

export async function prepareCompanionPackage(rootDir = process.cwd(), argv = process.argv.slice(2)) {
  const options = parsePackageArgs(argv);
  const outRoot = path.resolve(rootDir, options.out);
  stopWindowsPackagedCompanions(outRoot);
  await wait(process.platform === "win32" ? 500 : 0);

  for (const directory of companionOutputDirectories(rootDir, options)) {
    await removeWithRetries(directory);
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  prepareCompanionPackage().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
