// src/preload.mjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openModdingFolder: () => ipcRenderer.send('open-modding-folder'),
});