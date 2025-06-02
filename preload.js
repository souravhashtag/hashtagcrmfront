
const { contextBridge, ipcRenderer } = require('electron');
console.log('Preload script loaded public');
contextBridge.exposeInMainWorld('electronAPI', {
  sendUserData: (data) => ipcRenderer.send('set-user-data', data),
});