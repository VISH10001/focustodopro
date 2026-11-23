const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow = null;
let isUpdating = false;

const isPortable =
  Boolean(process.env.PORTABLE_EXECUTABLE_DIR) ||
  Boolean(process.env.PORTABLE_EXECUTABLE_FILE);

autoUpdater.autoDownload = false;
// Updates are installed only by the explicit React update action below.
// Avoid starting a second install automatically during app shutdown.
autoUpdater.autoInstallOnAppQuit = false;

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

autoUpdater.on('before-quit-for-update', () => {
  isUpdating = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.removeAllListeners('close');
    mainWindow.destroy();
    mainWindow = null;
  }
});

ipcMain.handle('download-and-install-update', async () => {
  if (!app.isPackaged || process.platform !== 'win32' || isPortable) {
    throw new Error('Automatic updates are available in the installed Windows version only.');
  }

  if (isUpdating) {
    return { started: true };
  }

  try {
    // 1. Download the update package
    await autoUpdater.downloadUpdate();

    // 2. Mark app as in dedicated update installation shutdown state
    isUpdating = true;

    // 3. Notify renderer of final download state
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-download-progress', {
        progress: 100,
        status: 'installing',
      });
    }

    // 4. Let electron-updater perform its supported shutdown sequence.
    // The before-quit-for-update handler above tears down the window and
    // bypasses any close-to-tray behavior. Do not force app.exit() here:
    // it can interrupt the installer's normal quit hand-off.
    autoUpdater.quitAndInstall(false, true);

    return { started: true };
  } catch (error) {
    isUpdating = false;
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

app.on('before-quit', () => {
  if (isUpdating && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.removeAllListeners('close');
    mainWindow.destroy();
    mainWindow = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

