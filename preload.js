const { contextBridge, ipcRenderer } = require('electron');

// Expose a small, explicit API instead of the raw ipcRenderer.
contextBridge.exposeInMainWorld('monitor', {
  getInfo: () => ipcRenderer.invoke('system:info'),
  setThreshold: (value) => ipcRenderer.invoke('alerts:set-threshold', value),
});
