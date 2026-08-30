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
  },
  // Auto-Updater APIs
  getAppVersion: async () => {
    return await ipcRenderer.invoke('get-app-version');
  },
  checkForUpdates: async (serverUrl) => {
    return await ipcRenderer.invoke('check-for-updates', serverUrl);
  },
  downloadUpdate: async (asarUrl) => {
    return await ipcRenderer.invoke('download-update', asarUrl);
  },
  applyUpdate: () => {
    ipcRenderer.send('apply-update');
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateDownloadProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (event, progress) => callback(progress));
  }
});
