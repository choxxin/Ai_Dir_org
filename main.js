const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron"); // Import Menu
const path = require("path");
const { organizeDirectory } = require("./organizer"); // Adjust the path as needed

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false, // Disable nodeIntegration for security
      contextIsolation: true, // Enable context isolation for security
      preload: path.join(__dirname, "preload.js"), // Path to preload script
    },
  });

  // Remove the default menu bar
  Menu.setApplicationMenu(null);

  mainWindow.loadFile("index.html");
  mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle IPC events
ipcMain.handle(
  "organize-directory",
  async (event, { dirPath, userInstruction }) => {
    try {
      await organizeDirectory(dirPath, userInstruction);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle("open-directory-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.filePaths[0]; // Return the selected directory path
});
