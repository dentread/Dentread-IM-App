const { app, BrowserWindow, Menu, ipcMain, dialog, Tray  } = require('electron');
const path = require('node:path');
const fs = require('fs');
const url = require('url');
const notifier = require('node-notifier');
const cron = require('node-cron');
const { exec } = require('child_process');
// const Store = require('electron-store');
// const store = new Store();

let tray;






const { autoUpdater,AppUpdater } = require("electron-updater");

// let notificationSent = false;

autoUpdater.autoDownload = false;


const pidFilePath = './notificationProcess.pid';

let notificationProcess = null;




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

  tray = new Tray(path.join(__dirname, 'images/LogoDentread.png'));

  console.log(tray)



});

// function isProcessRunning(processName) {
//   if (process.platform === 'win32' || process.platform === 'win64') {
//     // Use tasklist on Windows
//     try {
//       execSync(`tasklist /FI "IMAGENAME eq ${processName}.exe"`);
//       console.log("jkj",processName)
//       return true;
//     } catch (error) {
//       return false;
//     }
//   } else {
//     // Use pgrep on Unix-like systems
//     try {
//       execSync(`pgrep -x ${processName}`);
//       return true;
//     } catch (error) {
//       return false;
//     }
//   }
// }


function retrieveNotificationProcess() {
  if (fs.existsSync(pidFilePath)) {
    const pid = parseInt(fs.readFileSync(pidFilePath, 'utf8'));
    try {
      process.kill(pid, 0); // Check if process exists
      notificationProcess = pid; // Assign the PID if it exists
    } catch (error) {
      console.error(`Notification process with PID ${pid} not found.`);
      fs.unlinkSync(pidFilePath); // Remove the PID file
    }
  }
}


function stopNotificationProcess() {
  if (notificationProcess) {
    try {
      console.log(notificationProcess,"kkk")

      process.kill(notificationProcess);
      notificationProcess = null; // Clear the reference
      fs.unlinkSync(pidFilePath); // Remove the PID file
    } catch (error) {
      console.error(`Error killing notification process: ${error}`);
    }
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
  retrieveNotificationProcess();
  console.log(notificationProcess,"lll")

  stopNotificationProcess();

  function sendTestNotification() {
    setTimeout(function() {
      notifier.notify({
        title: 'IM App Session Expiry',
        message: 'Your IM App session will expire soon please logout and login again',
        sound: true,
        wait: true,
        icon: path.join(__dirname, 'images/LogoDentread.png'),

      });
    }, 2147483647);
  }
  sendTestNotification();

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

    ipcMain.on('toggle-auto-sync', (event, status, syncedFoldersJSON) => {
      if (status) {
        mainWindow.hide();

          mainWindow.on('close', preventClose);
          const contextMenu = Menu.buildFromTemplate([
            { label: 'Open', click: () => mainWindow.show() }, // Option to open the window
            { type: 'separator' },
            { label: 'Quit', role: 'quit' } // Option to quit the application
          ]);
        
          // Set the context menu for the tray
          tray.setContextMenu(contextMenu);
        
          tray.on('click', () => {
            // If the window is hidden, show it
            if (!mainWindow.isVisible()) {
              mainWindow.show();
            } else {
              // If the window is already visible, focus it
              mainWindow.focus();
            }
          });
  
          // Define the function to update notification
          function updateNotification() {
              const syncedFoldersArray = JSON.parse(syncedFoldersJSON);
              console.log(syncedFoldersArray, "syncedFoldersArray");
  
              if (Array.isArray(syncedFoldersArray)) {
                  const totalCount = syncedFoldersArray.length;
  
                  // Display a notification with the count using node-notifier
                  notifier.notify({
                      title: 'Dentraed IM App Sync Update',
                      message: `Successfully Synced ${totalCount} Scans.`,
                      sound: true,
                      wait: true,
                      icon: path.join(__dirname, 'images/LogoDentread.png'),

                  });
              } else {
                  console.error('Synced folders array not found in local storage.');
              }
          }
       
        try {
          // Call the updateNotification function at intervals
          const intervalId = setInterval(updateNotification, 1 * 60 * 1000);}
          catch (error) {
            console.error('Error in auto-update process:', error);
          }

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

// app.on('before-quit', () => {
//   // Run your cron job logic here
//   console.log('Cron job started');

//   const isElectronRunning = isProcessRunning('DentreadIMApp');
//     // Electron application is not running, start counting time
//     let timeSinceClosed = 0;
//     const intervalId = setInterval(() => {
//       timeSinceClosed += 1; // Increment time by 1 minute

//       // Check if 2 minutes have passed since the app was closed
//       if (timeSinceClosed >= 2 && !notificationSent) {
//         // Send notification
//         notifier.notify({
//           title: 'App Notification',
//           message: 'Your app needs attention!',
//           sound: true,
//           wait: true
//         });
//         notificationSent = true; // Mark notification as sent
        
//         // Stop the interval
//         clearInterval(intervalId);
//       }
//     }, 60000); // 1 minute interval
  
//   console.log('Cron job ended');
// });


app.on('before-quit', () => {
  function startNotificationProcess() {
    const { spawn } = require('child_process');
    const notificationProcess = spawn('node', ['notification.js'], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'], // Redirect stdio to prevent closing
    });

    // Detach the spawned process from the parent process
    notificationProcess.unref();

    // Handle any errors or output from the background process
    notificationProcess.on('error', (error) => {
      console.error(`Error starting notification process: ${error}`);
    });

    notificationProcess.on('exit', (code) => {
      console.log(`Notification process exited with code ${code}`);
      // Remove the PID file when the process exits
      fs.unlinkSync(pidFilePath);
    });

    // Write the process PID to a file
    notificationProcess.on('spawn', () => {
      fs.writeFileSync(pidFilePath, notificationProcess.pid.toString());
    });
  }

  startNotificationProcess();
});

let customSchedule;
function createCustomScheduler() {
  customSchedule = new BrowserWindow({
    width: 520,
    height: 420,
    parent: mainWindow,
    modal: true,
    show: false,
    minimizable: false,
    maximizable: false,
    icon: path.join(__dirname, 'images/MySettings.png'),
    title: 'Scheduler',
  });


  customSchedule.loadURL(url.format({
    pathname: path.join(__dirname, 'contents/Scheduler.html'),
    protocol: 'file:',
    slashes: true,
  }));

  customSchedule.setMenu(null);

  customSchedule.once('ready-to-show', () => {
    customSchedule.show();
  });

  customSchedule.on('closed', () => {
    customSchedule = null;
  });
  customSchedule.webContents.openDevTools();
}

ipcMain.handle('open-scheduler', () => {
  if (!customSchedule) {
    createCustomScheduler();
  }
  return true;
});
