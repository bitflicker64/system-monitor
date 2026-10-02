const { contextBridge, ipcRenderer } = require('electron');

// Expose a small, explicit API instead of the raw ipcRenderer.
contextBridge.exposeInMainWorld('monitor', {
  getInfo: () => ipcRenderer.invoke('system:info'),
  setThreshold: (value) => ipcRenderer.invoke('alerts:set-threshold', value),
  onStats: (cb) => ipcRenderer.on('stats:update', (_e, stats) => cb(stats)),
  onPowerEvent: (cb) => ipcRenderer.on('power:event', (_e, evt) => cb(evt)),
});
