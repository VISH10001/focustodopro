const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow = null;

const isPortable =
  Boolean(process.env.PORTABLE_EXECUTABLE_DIR) ||
  Boolean(process.env.PORTABLE_EXECUTABLE_FILE);

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// React popup is the single update UI for Windows.
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged || process.platform !== 'win32' || isPortable) return null;

  try {
    const result = await autoUpdater.checkForUpdates();
    const info = result && result.updateInfo;
    if (!info || info.version === app.getVersion()) return null;

    return {
      versionName: info.version,
      currentVersion: app.getVersion(),
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
    };
  } catch (error) {
    console.error('Windows update check failed:', error);
    throw new Error(error.message || 'Windows update check failed.');
  }
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-download-progress', {
      progress: Math.round(progress.percent),
      bytesDownloaded: progress.transferred,
      totalBytes: progress.total,
    });
  }
});

autoUpdater.on('error', (error) => {
  console.error('Windows auto-updater error:', error);
});

ipcMain.handle('download-and-install-update', async () => {
  if (!app.isPackaged || process.platform !== 'win32' || isPortable) {
    throw new Error('Automatic updates are available in the installed Windows version only.');
  }

  try {
    await autoUpdater.downloadUpdate();
    autoUpdater.quitAndInstall(false, true);
    return { started: true };
  } catch (error) {
    console.error('Windows update download/install failed:', error);
    throw new Error(error.message || 'Windows update download failed.');
  }
});
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist-electron/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

