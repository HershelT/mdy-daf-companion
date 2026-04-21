const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

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

function log(message, error) {
  try {
    fs.mkdirSync(dataRoot(), { recursive: true });
    fs.appendFileSync(
      logPath(),
      `${new Date().toISOString()} ${message}${error ? ` ${error.stack || error.message || error}` : ""}\n`,
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
  mainWindow.loadURL(url);
}

function createWindow() {
  log(`createWindow url=${companionUrl()}`);
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
    shell.openExternal(url);
    return { action: "deny" };
  });

  async function captureCompanion(label) {
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
    log(`did-finish-load url=${mainWindow.webContents.getURL()} title=${mainWindow.webContents.getTitle()}`);
    await captureCompanion("load");
    setTimeout(() => captureCompanion("2s"), 2000);
    setTimeout(() => captureCompanion("6s"), 6000);
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    log(`did-fail-load code=${errorCode} description=${errorDescription} url=${validatedUrl}`);
  });

  mainWindow.webContents.on("console-message", (_event, level, message) => {
    log(`console level=${level} ${message}`);
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    const current = mainWindow.webContents.getURL();
    const currentOrigin = current ? new URL(current).origin : null;
    const targetOrigin = targetUrl ? new URL(targetUrl).origin : null;
    if (currentOrigin && targetOrigin && currentOrigin !== targetOrigin) {
      event.preventDefault();
      shell.openExternal(targetUrl);
    }
  });

  mainWindow.once("ready-to-show", () => {
    focusWindow();
  });

  mainWindow.on("resize", () => saveWindowState(mainWindow));
  mainWindow.on("move", () => saveWindowState(mainWindow));
  mainWindow.on("close", () => saveWindowState(mainWindow));

  loadPlayerUrl(companionUrl());
}

const gotLock = app.requestSingleInstanceLock({ url: companionUrl(), dataRoot: dataRoot() });
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
    if (nextUrl) {
      loadPlayerUrl(nextUrl);
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

ipcMain.on("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window:close", () => {
  mainWindow?.close();
});

ipcMain.handle("window:toggleAlwaysOnTop", () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }
  mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
  saveWindowState(mainWindow);
  return mainWindow.isAlwaysOnTop();
});

ipcMain.handle("window:state", () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { alwaysOnTop: false };
  }
  return { alwaysOnTop: mainWindow.isAlwaysOnTop() };
});
