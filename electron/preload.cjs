const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadAndInstallUpdate: () => ipcRenderer.invoke('download-and-install-update'),
  onUpdateDownloadProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('update-download-progress', listener);
    return { remove: () => ipcRenderer.removeListener('update-download-progress', listener) };
  },
});
