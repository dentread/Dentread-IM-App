const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');
const rimraf = require('rimraf');
const fs = require('fs');
const url = require('url');
const { autoUpdater } = require("electron-updater")
// Set the path to your update configuration file
autoUpdater.autoDownload = false;
autoUpdater.updateConfigPath = path.join(__dirname, 'update.yml');

// Listen for update availability
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available. Do you want to update now?',
    buttons: ['Yes', 'No'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

// Listen for updates when ready
app.on('ready', () => {
  autoUpdater.checkForUpdates();
});


// class AppUpdater {
//   constructor() {
//     log.transports.file.level = "debug";
//     autoUpdater.logger = log;
//     autoUpdater.checkForUpdatesAndNotify();
//     autoUpdater.setFeedURL({
//       provider: 'github',
//       owner: 'dentreadbhavik',
//       repo: 'Dentread-IM-App',
//     });
//   }
// }

// module.exports = AppUpdater;


let mainWindow;
let customDialog;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'images/Fav.png'),
    title: 'Dentread',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      
    },
  });

  mainWindow.loadFile('contents/login_dentread.html');
  // autoUpdater.checkForUpdatesAndNotify();
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  const menuTemplate = [
    {
      label: 'Menu',
      submenu: [
        {
          label: 'Exit',
          click() {
            app.quit();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(null);
});

function createCustomDialog() {
  customDialog = new BrowserWindow({
    width: 450,
    height: 420,
    parent: mainWindow,
    modal: true,
    show: false,
    minimizable: false,
    maximizable: false,
    icon: path.join(__dirname, 'images/MySettings.png'),
    title: 'Settings',
  });
  // customDialog.webContents.openDevTools();

  customDialog.loadURL(url.format({
    pathname: path.join(__dirname, 'contents/settings.html'),
    protocol: 'file:',
    slashes: true,
  }));

  customDialog.setMenu(null);

  customDialog.once('ready-to-show', () => {
    customDialog.show();
  });

  customDialog.on('closed', () => {
    customDialog = null;
  });
}

ipcMain.handle('open-settings', () => {
  if (!customDialog) {
    createCustomDialog();
  }

  return true;
});

app.on('window-all-closed', () => {
  const projectPath = './';
  const directoryPath = path.join(projectPath, 'Dentread');

  if (fs.existsSync(directoryPath)) {
    rimraf.sync(directoryPath);
    console.log(`Directory deleted: ${directoryPath}`);
  } else {
    console.log('Directory does not exist');
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
