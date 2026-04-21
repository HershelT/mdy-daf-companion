#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

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

function executableFor(directory, platform, appName) {
  if (platform === "win32") {
    return path.join(directory, `${appName}.exe`);
  }
  if (platform === "darwin") {
    return path.join(directory, `${appName}.app`, "Contents", "MacOS", appName);
  }
  return path.join(directory, appName);
}

const argv = process.argv.slice(2);
const appName = optionValue(argv, "--app-name", DEFAULT_APP_NAME);
const outRoot = path.resolve(process.cwd(), optionValue(argv, "--out", "out"));
const platforms = splitCsv(optionValue(argv, "--platform", process.platform), process.platform);
const arches = splitCsv(optionValue(argv, "--arch", process.arch), process.arch);
const missing = [];

for (const platform of platforms) {
  for (const arch of arches) {
    const directory = path.join(outRoot, `${appName}-${platform}-${arch}`);
    const executable = executableFor(directory, platform, appName);
    if (!fs.existsSync(executable)) {
      missing.push(executable);
    }
  }
}

if (missing.length > 0) {
  console.error("Missing packaged companion output:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Verified ${platforms.length * arches.length} companion package output(s).`);
}
