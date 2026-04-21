const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mdyCompanion", {
  isElectron: true,
  minimize: () => ipcRenderer.send("window:minimize"),
  close: () => ipcRenderer.send("window:close"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggleAlwaysOnTop"),
  state: () => ipcRenderer.invoke("window:state")
});
