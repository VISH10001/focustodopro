const { app, BrowserWindow, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow = null;

const isPortable =
  Boolean(process.env.PORTABLE_EXECUTABLE_DIR) ||
  Boolean(process.env.PORTABLE_EXECUTABLE_FILE);

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function showMessage(options) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return dialog.showMessageBox(mainWindow, options);
  }
  return dialog.showMessageBox(options);
}

async function checkForUpdates() {
  if (!app.isPackaged || process.platform !== 'win32' || isPortable) {
    return;
  }

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Windows update check failed:', error);
  }
}

autoUpdater.on('update-available', async (info) => {
  try {
    const result = await showMessage({
      type: 'info',
      title: 'FocusToDoPro Update Available',
      message: `New version ${info.version} is available.`,
      detail: 'Would you like to download this update now?',
      buttons: ['Download Update', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      await autoUpdater.downloadUpdate();
    }
  } catch (error) {
    console.error('Update download failed:', error);
  }
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`Update download: ${Math.round(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', async (info) => {
  const result = await showMessage({
    type: 'info',
    title: 'Update Ready',
    message: `FocusToDoPro ${info.version} has been downloaded.`,
    detail: 'Restart the app to install the update.',
    buttons: ['Restart & Install', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    autoUpdater.quitAndInstall();
  }
});

autoUpdater.on('error', (error) => {
  console.error('Windows auto-updater error:', error);
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

  if (app.isPackaged && process.platform === 'win32' && !isPortable) {
    setTimeout(checkForUpdates, 5000);
  }

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
