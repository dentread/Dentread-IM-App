const { contextBridge, ipcRenderer,shell } = require('electron');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const archiver = require('archiver');
const rimraf = require('rimraf');
const fetch = require('node-fetch');
const notifier = require('node-notifier');


const sendFileToAPI = async (filePath, apiUrl, accessToken, username) => {
  const folderName_withzip = path.basename(filePath);
  const folderName = path.parse(filePath).name;
  const fileStream = fs.createReadStream(filePath);


  const formData = new FormData();
  formData.append('directory_path', folderName);
  formData.append('username', username);
  formData.append('files', fileStream, {
    filename: folderName_withzip,
  });



  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...formData.getHeaders()
    },
    body: formData,
  });


  if (response.ok) {
    const responseData = await response.text();
    return response;
  } else {
    const errorResponse = await response.text();
    console.error('API Error Response:', errorResponse);
    throw new Error(`API Error: ${response.statusText}`);
  }
};


const createZipFromDirectory = async (directoryPath) => {
  return new Promise(async (resolve, reject) => {
    const zipFilePath = `${directoryPath}.zip`; 

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, 
    });

    output.on('close', async () => {
      resolve(zipFilePath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    archive.directory(directoryPath, false); 

    archive.finalize();
  });
};

const setDirectoryPermissions = (directoryPath, mode) => {
  fs.readdirSync(directoryPath).forEach((file) => {
    const filePath = path.join(directoryPath, file);
    fs.chmodSync(filePath, mode);
    if (fs.statSync(filePath).isDirectory()) {
      setDirectoryPermissions(filePath, mode);
    }
  });
};
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping'),


  
  createDirectory: (username) => {
    try {
      const projectPath = './';

      const directoryPath = path.join(projectPath, 'Dentread', username);


      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
  
        fs.chmodSync(directoryPath, 0o777);
        setDirectoryPermissions(directoryPath, 0o777);
  
        localStorage.setItem('dentread_dir', directoryPath);
        return { success: true, message: `Directory created at ${directoryPath}`, directoryPath };
      } else {
        localStorage.setItem('dentread_dir', directoryPath);
        return { success: false, message: 'Directory already exists' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deleteDirectory: () => {
    try {
      const projectPath = './';
      const directoryPath = path.join(projectPath, 'Dentread');
  
      if (fs.existsSync(directoryPath)) {
        rimraf.sync(directoryPath);
        return { success: true, message: `Directory deleted: ${directoryPath}` };
      } else {
        return { success: false, message: 'Directory does not exist' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  emptyDirectory: (directoryName) => {
    try {
      let currentTimelocal = new Date().toLocaleString();

      const projectPath = './';
      const username = localStorage.getItem('savedUsername');
      const dentreadDirectoryPath = path.join(projectPath, 'Dentread');
      const usernameDirectoryPath = path.join(dentreadDirectoryPath, username);
      const sanitizedDirectoryName = directoryName.trim(); // Remove leading and trailing spaces
      const targetPath = path.join(usernameDirectoryPath, sanitizedDirectoryName);
      console.log(targetPath,"targetPath")
  
      if (fs.existsSync(targetPath)) {
        if (fs.lstatSync(targetPath).isDirectory()) {
          const directoryContents = fs.readdirSync(targetPath);
  
          for (const item of directoryContents) {
            const itemPath = path.join(targetPath, item);
  
            if (fs.lstatSync(itemPath).isDirectory()) {
              rimraf.sync(itemPath);
            } else {
              fs.unlinkSync(itemPath);
              console.log(`Error deleting ${itemPath}: ${unlinkError.message}`);

            }
          }
          
          fs.rmdirSync(targetPath);

          console.log(`At [${currentTimelocal}] : Sync completed for: ${targetPath}`);
          
          return { success: true, message: `Directory emptied: ${targetPath}` };
        } else if (fs.lstatSync(targetPath).isFile()) {
          fs.unlinkSync(targetPath);
          
          console.log(`At [${currentTimelocal}] : Sync completed for: ${targetPath}`);
          return { success: true, message: `File removed: ${targetPath}` };
        } else {
          return { success: false, message: 'Invalid target: Neither a file nor a directory' };
        }
      } else {
        return { success: false, message: 'Target does not exist' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  

  copyFilesWithCondition: function namedFunction(sourceDirectory, destinationDirectory, fileExtensions) {
    try {
      if (!fs.existsSync(destinationDirectory)) {
          fs.mkdirSync(destinationDirectory, { recursive: true });
        }
        let currentTime = new Date().toLocaleString();

        const items = fs.readdirSync(sourceDirectory);
        let totalCopied = 0;
    
        function processNextItem() {
          if (totalCopied >= 5) return;
          if (items.length === 0) return;
  
          const item = items.shift();
          const sourceItemPath = path.join(sourceDirectory, item);
          const destinationItemPath = path.join(destinationDirectory, item);
    
          if (fs.statSync(sourceItemPath).isDirectory()) {
            const folderNamesSet = new Set(JSON.parse(localStorage.getItem('folderNames')));
            if (!folderNamesSet.has(item)) {
              if (!item.endsWith('.zip')) {
                const zipFileName = item + '.zip';
                const output = fs.createWriteStream(path.join(destinationDirectory, zipFileName));
                const archive = archiver('zip', {
                  zlib: { level: 9 }
                });
                output.on('close', () => {
                  totalCopied++;
                  console.log(`At [${currentTime}] Copied file: ${sourceItemPath} to ${destinationItemPath}`);

                 

                  processNextItem();
                });
                archive.pipe(output);
                archive.directory(sourceItemPath, false);
                archive.finalize();
              } else {
                processNextItem();
              }
            } else {
              processNextItem();
            }
          } else {
            const fileExtension = path.extname(item).toLowerCase();
            if (fileExtensions.includes(fileExtension)) {
              const filenameSet = new Set(JSON.parse(localStorage.getItem('filenames')));
              if (!filenameSet.has(item)) {
                fs.copyFileSync(sourceItemPath, destinationItemPath);
                totalCopied++;
                console.log(`At [${currentTime}] Copied folder: ${sourceItemPath} to ${destinationItemPath}`);
               
              } else {
              }
            } else {
            }
            processNextItem();
          }
        }
    
        processNextItem();
      } catch (error) {
        console.error("Error:", error);
      }
    },
    
  


  listFilesAndFolders: async (directoryPath)=> {
    try {
      const items = await fs.promises.readdir(directoryPath);
      const statsPromises = items.map(item => fs.promises.stat(path.join(directoryPath, item)));

      const stats = await Promise.all(statsPromises);

      return items.map((item, index) => ({
          name: item,
          isDirectory: stats[index].isDirectory()
      }));
  } catch (error) {
      console.error('Error listing files and folders:', error);
      return [];
  }
  },


  hitApiWithFolderPathAndSubdirectories: async (reqdId) => {
    try {

      let currentTime = new Date().toLocaleString();
      console.log(`At [${currentTime}] : Sync start for: ${reqdId}`);

      const savedUsername = localStorage.getItem('savedUsername');
      const currentWorkingDirectory = process.cwd();
  
      const newDirectoryPath = currentWorkingDirectory + '\\' + 'Dentread' + '\\' + savedUsername + '\\' + reqdId;
      const apiUrl = 'http://testapi.dentread.com/datasync/';
      const token = JSON.parse(localStorage.getItem('token'));
      const accessToken = token.access;
      const username = localStorage.getItem('savedUsername');
  
      const isDirectory = fs.statSync(newDirectoryPath).isDirectory();
  
      let zipFilePath = '';
  
      if (isDirectory) {
        zipFilePath = await createZipFromDirectory(newDirectoryPath);
  
        const response = await sendFileToAPI(zipFilePath, apiUrl, accessToken, username);
  
  
        if (zipFilePath) {
          try {
            await fs.promises.unlink(zipFilePath);
          } catch (err) {
            console.error('Error deleting zip file:', err);
          }
        }
  
        if (response) {
          return response;
        } else {
          return { message: 'API request failed', status: 500 }; 
        }
      } else {
        const response = await sendFileToAPI(newDirectoryPath, apiUrl, accessToken, username);
  
  
        if (response) {
          return response;
        } else {
          return { message: 'API request failed', status: 500 }; 
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      return { message: 'API request failed', status: 500 }; 
    }
  },
  settingsbuttonfunc: async () => {
    ipcRenderer.invoke('open-settings')
    },
    logButtonfunc: async () => {
      ipcRenderer.invoke('open-logs')
      },

    minimizeWindow: async () => {
      const syncedFoldersJSON = localStorage.getItem('folderNames');
      ipcRenderer.send('toggle-auto-sync', true, syncedFoldersJSON); 
  },

  schedulerbuttonfunc: async () => {
    const os = require('os');
    const hostname = os.hostname();

    localStorage.setItem('hostname', hostname);

    ipcRenderer.invoke('open-scheduler');
},


manualbuttonfunc: async () => {


  ipcRenderer.invoke('open-reload-manual');
},
minimizeWindow2: async () => {
  function sendTestNotification() {
    const localStorageValue = localStorage.getItem('prefSyncOption');
    if (localStorageValue === 'manualSync') {
      notifier.notify({
        title: 'Dentread IM App Auto Sync Notification',
        message: 'This is to notify that auto sync is off',
        sound: true,
        wait: true,
        icon: path.join(__dirname, 'images/LogoDentread.png'),
      });
    }
  }

  // Initial call to check and send notification
  setTimeout(sendTestNotification, 2 * 60 * 1000);

  // Repeat notification every hour
  const intervalId = setInterval(sendTestNotification, 60 * 60 * 1000);

  // Send message to the main process to toggle auto-sync off
  ipcRenderer.send('toggle-auto-sync', false);
},


  
});


