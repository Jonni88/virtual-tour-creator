const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialogs (old)
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveProject: () => ipcRenderer.invoke('dialog:saveProject'),
  loadProject: () => ipcRenderer.invoke('dialog:loadProject'),
  exportTour: () => ipcRenderer.invoke('dialog:exportTour'),
  
  // Dialogs (new v2.0)
  saveProjectDialog: () => ipcRenderer.invoke('dialog:saveProjectDialog'),
  loadProjectDialog: () => ipcRenderer.invoke('dialog:loadProjectDialog'),
  getExportPath: () => ipcRenderer.invoke('dialog:getExportPath'),
  
  // File system
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path, data) => ipcRenderer.invoke('fs:writeFile', path, data),
  copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),
  scanFolder: (path) => ipcRenderer.invoke('fs:scanFolder', path),
  ensureDir: (path) => ipcRenderer.invoke('fs:ensureDir', path),
  processImage: (options) => ipcRenderer.invoke('fs:processImage', options),
  
  // Shell
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
  
  // Store
  getStoreValue: (key) => ipcRenderer.invoke('store:get', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('store:set', key, value),
  
  // Platform
  platform: process.platform
});