//Abhay
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  organizeDirectory: (dirPath, userInstruction) =>
    ipcRenderer.invoke("organize-directory", { dirPath, userInstruction }),
  openDirectoryDialog: () => ipcRenderer.invoke("open-directory-dialog"),
});
