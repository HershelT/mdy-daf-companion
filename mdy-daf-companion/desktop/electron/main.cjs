const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const SENSITIVE_QUERY_NAMES = new Set([
  "token",
  "auth",
  "authorization",
  "access_token",
  "api_key",
  "key",
  "youtube_api_key"
]);

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function companionUrl() {
  return argValue("--url", process.env.MDY_DAF_COMPANION_URL || "about:blank");
}

function dataRoot() {
  return (
    argValue("--data-root") ||
    process.env.MDY_DAF_COMPANION_DATA ||
    process.env.CLAUDE_PLUGIN_DATA ||
    path.join(app.getPath("userData"), "runtime")
  );
}

function statePath() {
  return path.join(dataRoot(), "companion-window.json");
}

function logPath() {
  return path.join(dataRoot(), "companion.log");
}

function lastCapturePath() {
  return path.join(dataRoot(), "companion-last.png");
}

function debugCaptureEnabled() {
  return process.env.MDY_DAF_DEBUG_CAPTURE === "1";
}

function redactUrl(value) {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  try {
    const parsed = new URL(value);
    for (const name of Array.from(parsed.searchParams.keys())) {
      if (SENSITIVE_QUERY_NAMES.has(name.toLowerCase())) {
        parsed.searchParams.set(name, "[redacted]");
      }
    }
    return parsed.toString();
  } catch {
    return value.replace(
      /([?&](?:token|auth|authorization|access_token|api_key|key|youtube_api_key)=)[^&\s]+/gi,
      "$1[redacted]"
    );
  }
}

function redactArgv(argv) {
  return argv.map((value, index) => {
    const previous = argv[index - 1] || "";
    if (/token|key|secret|authorization/i.test(previous)) {
      return "[redacted]";
    }
    return redactUrl(value);
  });
}

function redactLogText(value) {
  return redactUrl(String(value));
}

function log(message, error) {
  try {
    const details = error ? ` ${redactLogText(error.stack || error.message || error)}` : "";
    fs.mkdirSync(dataRoot(), { recursive: true });
    fs.appendFileSync(
      logPath(),
      `${new Date().toISOString()} ${redactLogText(message)}${details}\n`,
      "utf8"
    );
  } catch {
    // Logging should never keep the companion from opening.
  }
}

process.on("uncaughtException", (error) => {
  log("uncaughtException", error);
  app.exit(1);
});

process.on("unhandledRejection", (error) => {
  log("unhandledRejection", error);
});

log(`main-start argv=${JSON.stringify(redactArgv(process.argv))}`);

function isLocalCompanionUrl(value) {
  if (value === "about:blank") {
    return true;
  }

  try {
    const parsed = new URL(value);
    const localHost =
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "::1" ||
      parsed.hostname === "[::1]";
    return parsed.protocol === "http:" && localHost && parsed.pathname === "/companion";
  } catch {
    return false;
  }
}

function safeCompanionUrl(value) {
  if (isLocalCompanionUrl(value)) {
    return value;
  }
  log(`blocked invalid companion url=${redactUrl(value)}`);
  return "about:blank";
}

function isTrustedMainFrameUrl(value) {
  return isLocalCompanionUrl(value) || value === "about:blank";
}

function isTrustedIpcEvent(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) {
    return false;
  }
  const frameUrl = event.senderFrame?.url || event.sender.getURL();
  return isTrustedMainFrameUrl(frameUrl);
}

function rejectUntrustedIpc(event, channel) {
  if (isTrustedIpcEvent(event)) {
    return false;
  }
  log(`blocked ipc channel=${channel}`);
  return true;
}

function readWindowState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath(), "utf8"));
    return {
      bounds: parsed.bounds || { width: 430, height: 340 },
      alwaysOnTop: parsed.alwaysOnTop !== false
    };
  } catch {
    return {
      bounds: { width: 430, height: 340 },
      alwaysOnTop: true
    };
  }
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) {
    return;
  }
  fs.mkdirSync(dataRoot(), { recursive: true });
  fs.writeFileSync(
    statePath(),
    `${JSON.stringify(
      {
        bounds: win.getBounds(),
        alwaysOnTop: win.isAlwaysOnTop()
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

let mainWindow = null;

function focusWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.moveTop();
  mainWindow.focus();
}

function loadPlayerUrl(url) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  const nextUrl = safeCompanionUrl(url);
  mainWindow.loadURL(nextUrl);
}

function createWindow() {
  const initialUrl = safeCompanionUrl(companionUrl());
  log(`createWindow url=${redactUrl(initialUrl)}`);
  const state = readWindowState();
  mainWindow = new BrowserWindow({
    width: state.bounds.width || 430,
    height: state.bounds.height || 340,
    x: state.bounds.x,
    y: state.bounds.y,
    minWidth: 300,
    minHeight: 220,
    frame: false,
    show: false,
    alwaysOnTop: state.alwaysOnTop,
    title: "MDY Daf Companion",
    backgroundColor: "#05070A",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    log(`blocked external window url=${redactUrl(url)}`);
    return { action: "deny" };
  });

  async function captureCompanion(label) {
    if (!debugCaptureEnabled()) {
      return;
    }
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    try {
      const image = await mainWindow.capturePage();
      fs.writeFileSync(lastCapturePath(), image.toPNG());
      log(`capturePage ok ${label}`);
    } catch (error) {
      log(`capturePage failed ${label}`, error);
    }
  }

  mainWindow.webContents.on("did-finish-load", async () => {
    log(`did-finish-load url=${redactUrl(mainWindow.webContents.getURL())} title=${mainWindow.webContents.getTitle()}`);
    await captureCompanion("load");
    setTimeout(() => captureCompanion("2s"), 2000);
    setTimeout(() => captureCompanion("6s"), 6000);
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    log(`did-fail-load code=${errorCode} description=${errorDescription} url=${redactUrl(validatedUrl)}`);
  });

  mainWindow.webContents.on("console-message", (_event, level, message) => {
    log(`console level=${level} ${message}`);
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (!isLocalCompanionUrl(targetUrl)) {
      event.preventDefault();
      log(`blocked navigation url=${redactUrl(targetUrl)}`);
    }
  });

  mainWindow.once("ready-to-show", () => {
    focusWindow();
  });

  mainWindow.on("resize", () => saveWindowState(mainWindow));
  mainWindow.on("move", () => saveWindowState(mainWindow));
  mainWindow.on("close", () => saveWindowState(mainWindow));

  loadPlayerUrl(initialUrl);
}

const gotLock = app.requestSingleInstanceLock({ url: safeCompanionUrl(companionUrl()), dataRoot: dataRoot() });
if (!gotLock) {
  log("single-instance-lock denied");
  app.quit();
} else {
  log("single-instance-lock acquired");
  app.on("second-instance", (_event, argv, _workingDirectory, additionalData) => {
    const nextUrl =
      additionalData && typeof additionalData.url === "string"
        ? additionalData.url
        : argv[argv.indexOf("--url") + 1] || companionUrl();
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
    }
    if (nextUrl && isLocalCompanionUrl(nextUrl)) {
      loadPlayerUrl(nextUrl);
    } else if (nextUrl) {
      log(`blocked second-instance url=${redactUrl(nextUrl)}`);
    }
    focusWindow();
  });

  app.whenReady().then(createWindow).catch((error) => {
    log("whenReady failed", error);
    app.exit(1);
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    focusWindow();
  }
});

ipcMain.on("window:minimize", (event) => {
  if (rejectUntrustedIpc(event, "window:minimize")) {
    return;
  }
  mainWindow?.minimize();
});

ipcMain.on("window:close", (event) => {
  if (rejectUntrustedIpc(event, "window:close")) {
    return;
  }
  mainWindow?.close();
});

ipcMain.handle("window:toggleAlwaysOnTop", (event) => {
  if (rejectUntrustedIpc(event, "window:toggleAlwaysOnTop")) {
    return false;
  }
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }
  mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
  saveWindowState(mainWindow);
  return mainWindow.isAlwaysOnTop();
});

ipcMain.handle("window:state", (event) => {
  if (rejectUntrustedIpc(event, "window:state")) {
    return { alwaysOnTop: false };
  }
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { alwaysOnTop: false };
  }
  return { alwaysOnTop: mainWindow.isAlwaysOnTop() };
});
