const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialogs
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveProject: () => ipcRenderer.invoke('dialog:saveProject'),
  loadProject: () => ipcRenderer.invoke('dialog:loadProject'),
  exportTour: () => ipcRenderer.invoke('dialog:exportTour'),
  
  // File system
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path, data) => ipcRenderer.invoke('fs:writeFile', path, data),
  copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),
  scanFolder: (path) => ipcRenderer.invoke('fs:scanFolder', path),
  ensureDir: (path) => ipcRenderer.invoke('fs:ensureDir', path),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
  
  // Platform
  platform: process.platform
});