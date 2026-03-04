const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default'
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC handlers
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('dialog:saveProject', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Virtual Tour Project', extensions: ['vtour'] }],
    defaultPath: 'tour.vtour'
  });
  return result.filePath;
});

ipcMain.handle('dialog:loadProject', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Virtual Tour Project', extensions: ['vtour'] }],
    properties: ['openFile']
  });
  return result.filePaths[0];
});

ipcMain.handle('dialog:exportTour', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return { success: true, data: data.toString('base64') };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:copyFile', async (event, src, dest) => {
  try {
    fs.copyFileSync(src, dest);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:scanFolder', async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const images = files
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        relativePath: file
      }));
    return { success: true, images };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:ensureDir', async (event, dirPath) => {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});