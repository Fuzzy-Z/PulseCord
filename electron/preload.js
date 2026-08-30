const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  getDesktopSources: async (options) => {
    return await ipcRenderer.invoke('get-desktop-sources', options);
  },
  onMaximizedChange: (callback) => {
    ipcRenderer.on('window-maximized-change', (event, isMaximized) => callback(isMaximized));
  }
});
