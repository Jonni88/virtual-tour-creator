const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active'
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
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

// Open folder/file in system explorer
ipcMain.handle('shell:openPath', async (event, targetPath) => {
  try {
    await shell.openPath(targetPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// New IPC handlers for v2.0
ipcMain.handle('dialog:saveProjectDialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Virtual Tour Project', extensions: ['vtour.json'] }],
    defaultPath: 'project.vtour.json'
  });
  return result.filePath;
});

ipcMain.handle('dialog:loadProjectDialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Virtual Tour Project', extensions: ['vtour.json'] }],
    properties: ['openFile']
  });
  return result.filePaths[0];
});

ipcMain.handle('dialog:getExportPath', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Выберите папку для экспорта'
  });
  return result.filePaths[0];
});

ipcMain.handle('fs:processImage', async (event, options) => {
  try {
    // Placeholder for image processing
    fs.copyFileSync(options.source, options.target);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Store for recent projects (simple file-based)
const storePath = path.join(app.getPath('userData'), 'store.json');

ipcMain.handle('store:get', async (event, key) => {
  try {
    if (!fs.existsSync(storePath)) return null;
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    return store[key];
  } catch {
    return null;
  }
});

ipcMain.handle('store:set', async (event, key, value) => {
  try {
    let store = {};
    if (fs.existsSync(storePath)) {
      store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }
    store[key] = value;
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Store error:', err);
  }
});