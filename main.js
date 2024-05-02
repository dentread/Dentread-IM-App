const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs');
const url = require('url');
const notifier = require('node-notifier');
const cron = require('node-cron');
const { execSync } = require('child_process');

const { autoUpdater,AppUpdater } = require("electron-updater");

let notificationSent = false;

autoUpdater.autoDownload = false;

app.on('ready', () => {
  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', () => {
    // Perform silent update without showing a dialog
    autoUpdater.downloadUpdate();

    // Optional: Listen to the 'update-downloaded' event to handle further actions
    autoUpdater.on('update-downloaded', () => {
      console.log('Update downloaded. Ready to install.');
      // Quit and install the update
      autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Update not available.');
  });

  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download speed: ${progressObj.bytesPerSecond}`);
    console.log(`Downloaded ${progressObj.percent}%`);
  });

  cron.schedule('* * * * *', () => {
    // Check if the Electron application is running
    const isElectronRunning = isProcessRunning('electron');

    if (!isElectronRunning) {
      // Electron application is not running, start counting time
      let timeSinceClosed = 0;
      const intervalId = setInterval(() => {
        timeSinceClosed += 1; // Increment time by 1 minute

        // Check if 2 minutes have passed since the app was closed
        if (timeSinceClosed >= 2 && !notificationSent) {
          // Send notification
          notifier.notify({
            title: 'App Notification',
            message: 'Your app needs attention!',
            sound: true,
            wait: true
          });
          notificationSent = true; // Mark notification as sent
          
          // Stop the interval
          clearInterval(intervalId);
        }
      }, 60000); // 1 minute interval
    }
  });

});

function isProcessRunning(processName) {
  try {
    execSync(`pgrep -x ${processName}`);
    return true;
  } catch (error) {
    return false;
  }
}

let mainWindow;
let customDialog;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'images/LogoDentread.png'),
    title: 'Dentread',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile('contents/login_dentread.html');
  function preventClose(event) {
    event.preventDefault();
  
    try {
      // Show a warning dialog
      const { dialog } = require('electron');
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Warning',
        message: 'Closing the window is not allowed while auto sync is on.',
        buttons: ['OK']
      });
    } catch (error) {
      console.error('Error showing warning dialog:', error);
    }
  }
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();

    ipcMain.on('toggle-auto-sync', (event, status) => {
      if (status) {
        mainWindow.minimize();
        mainWindow.on('close', preventClose);

      } else {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.removeListener('close', preventClose);
      }
     
    });
  });

  mainWindow.on('close', (event) => {
    const choice = require('electron').dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'Are you sure you want to close the application?'
    })
    if (choice === 1) {
      event.preventDefault()
    }
  })

  
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

let customlog;
function createcustomlog() {
  customlog = new BrowserWindow({
    width: 500,
    height: 500,
    parent: mainWindow,
    modal: true,
    show: false,
    minimizable: false,
    maximizable: false,
    icon: path.join(__dirname, 'images/PlusFolder.png'),
    title: 'Log',
  });

  // customlog.webContents.openDevTools();

  customlog.loadURL(url.format({
    pathname: path.join(__dirname, 'contents/log.html'),
    protocol: 'file:',
    slashes: true,
  }));

  customlog.setMenu(null);

  customlog.once('ready-to-show', () => {
    customlog.show();
  });

  customlog.on('closed', () => {
    customlog = null;
  });
}

ipcMain.handle('open-logs', () => {
  if (!customlog) {
    createcustomlog();
    
  }

// ipcMain.on('download-logs', (event, logs) => {
//     // Convert logs array to string
//     const logsString = logs.join('\n');

//     // Show save dialog to choose save location
//     dialog.showSaveDialog(mainWindow, {
//         defaultPath: 'logs.txt', // Default filename
//         filters: [{ name: 'Text Files', extensions: ['txt'] }] // Filter for text files
//     }).then((result) => {
//         if (!result.canceled) {
//             // Write logs to the selected file
//             fs.writeFile(result.filePath, logsString, (err) => {
//                 if (err) {
//                     console.error('Error saving logs:', err);
//                     return;
//                 }
//                 console.log('Logs saved successfully!');
//             });
//         }
//     }).catch((err) => {
//         console.error('Error saving logs:', err);
//     });
// });

  return true;
});

// app.on('window-all-closed', async () => {
//   const projectPath = './';
//   const directoryPath = path.join(projectPath, 'Dentread');

//   const deleteDirectoryContents = (directoryPath) => {
//     try {
//       // Read the directory synchronously
//       const files = fs.readdirSync(directoryPath);
  
//       // Iterate through each file and delete it
//       files.forEach((file) => {
//         const filePath = path.join(directoryPath, file);
//         fs.unlinkSync(filePath); // Delete the file
//         console.log(`Deleted file: ${filePath}`);
//       });
  
//       console.log(`All files in directory ${directoryPath} deleted successfully.`);
//     } catch (error) {
//       console.error(`Error deleting directory contents: ${error}`);
//     }
//   };

  // Check if the directory exists
//   if (fs.existsSync(directoryPath)) {
//     // Attempt to empty the directory contents
//     try {
//       await deleteDirectoryContents(directoryPath);
//     } catch (error) {
//       console.error('Error emptying directory contents:', error);
//     }
//   } else {
//     console.log('Directory does not exist');
//   }

//   // Quit the application if not on macOS
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

ipcMain.on('logInfo', (event, message) => {
  const logWindow = BrowserWindow.getAllWindows().find(window => window.getTitle() === 'Log');
  if (logWindow) {
    logWindow.webContents.send('logInfo', message);
  }
});

ipcMain.on('logError', (event, error) => {
  const logWindow = BrowserWindow.getAllWindows().find(window => window.getTitle() === 'Log');
  if (logWindow) {
    logWindow.webContents.send('logError', error);
  }
});

