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
  const linkedDevice = localStorage.getItem('linkedDevice');
  const appLiscence = localStorage.getItem('appLiscence');

  const formData = new FormData();
  formData.append('directory_path', folderName);
  formData.append('username', username);
  formData.append('files', fileStream, {
    filename: folderName_withzip,
  });
  formData.append('deviceUID', linkedDevice);
  formData.append('appLiscence', appLiscence);

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
  deleteDirectory: () => ipcRenderer.invoke('deleteDirectory'),


  
  createDirectory: (username) => {
    try {

      const directoryPath = path.join(process.env.APPDATA || process.env.HOME, 'Dentread', username);


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
      const localStorageValue = localStorage.getItem('prefSyncOption');

  
      if (fs.existsSync(directoryPath)) {
        if (localStorageValue==='manualSync'){
          rimraf.sync(directoryPath);
        }else{
          console.log("no manual sync found")
        }
        return { success: true, message: `Directory deleted: ${directoryPath}` };
      } else {
        return { success: false, message: 'Directory does not exist' };
      }
    // }
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  emptyDirectory: (directoryName) => {
    try {
      let currentTimelocal = new Date().toLocaleString();

      const projectPath = './';
      const username = localStorage.getItem('savedUsername');
      const usernameDirectoryPath = localStorage.getItem('dentread_dir');
      const sanitizedDirectoryName = directoryName.trim(); // Remove leading and trailing spaces
      const targetPath = path.join(usernameDirectoryPath, sanitizedDirectoryName);
      if (fs.existsSync(targetPath)) {
        if (fs.lstatSync(targetPath).isDirectory()) {
          const directoryContents = fs.readdirSync(targetPath);
  
          for (const item of directoryContents) {
            const itemPath = path.join(targetPath, item);
  
            if (fs.lstatSync(itemPath).isDirectory()) {
              rimraf.sync(itemPath);
            } else {
              fs.unlinkSync(itemPath);
            }
          }
          
          fs.rmdirSync(targetPath);
          return { success: true, message: `Directory emptied: ${targetPath}` };
        } else if (fs.lstatSync(targetPath).isFile()) {
          fs.unlinkSync(targetPath);
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
        let currentonlytime = new Date().getTime();
        const timeslot = localStorage.getItem('timeslot');
        const defaultTimeslot = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const timeslotValue = timeslot ? parseInt(timeslot, 10) : defaultTimeslot;
        const twentyFourHoursAgo = currentonlytime - timeslotValue;

        const items = fs.readdirSync(sourceDirectory);
        console.log(items,"items")
        console.log("destinationDirectory",destinationDirectory)
        console.log("sourceDirectory",sourceDirectory)
        let totalCopied = 0;

        function processNextItem() {
            if (totalCopied >= 5) return;
            if (items.length === 0) return;

            const item = items.shift();
            const sourceItemPath = path.join(sourceDirectory, item);
            console.log("sourceItemPath",sourceItemPath)
            const destinationItemPath = path.join(destinationDirectory, item);
            console.log("destinationItemPath",destinationItemPath)
            const creationTime = fs.statSync(sourceItemPath).birthtime.getTime();

            if (fs.statSync(sourceItemPath).isDirectory()) {
                const folderNamesSet = new Set(JSON.parse(localStorage.getItem('folderNames')) || []);
                
                if (!folderNamesSet.has(item)) {
                    const zipFileName = item + '.zip';
                    const zipFilePath = path.join(destinationDirectory, zipFileName);
                    
                    if (!fs.existsSync(zipFilePath) && !item.endsWith('.zip') && creationTime >= twentyFourHoursAgo) {
                        const output = fs.createWriteStream(zipFilePath);
                        const archive = archiver('zip', { zlib: { level: 9 } });

                        output.on('close', () => {
                            totalCopied++;
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
                    const filenameSet = new Set(JSON.parse(localStorage.getItem('filenames')) || []);

                    if (!filenameSet.has(item) && !fs.existsSync(destinationItemPath) && creationTime >= twentyFourHoursAgo) {
                        fs.copyFileSync(sourceItemPath, destinationItemPath);
                        filenameSet.add(item);
                        localStorage.setItem('filenames', JSON.stringify([...filenameSet]));
                        totalCopied++;
                    }
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
        isDirectory: stats[index].isDirectory(),
        createdTimestamp: stats[index].birthtimeMs
    }));
    } catch (error) {
      console.error('Error listing files and folders:', error);
      return [];
    }
  },
  hitApiWithFolderPathAndSubdirectories: async (reqdId) => {
    try {
      localStorage.setItem('appStatus', 'Running');
      let currentTime = new Date().toLocaleString();
      const savedUsername = localStorage.getItem('savedUsername');
      const currentWorkingDirectory = localStorage.getItem('dentread_dir');
      const newDirectoryPath = currentWorkingDirectory + '\\' + reqdId;
      const apiUrl = 'https://api.dentread.com/datasync/';
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
    }finally {
      localStorage.setItem('appStatus', 'Idle');
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
    ipcRenderer.invoke('open-scheduler');
  },

  getmacidhostname:async () => {
    const os = require('os');
    const hostname = os.hostname();
    localStorage.setItem('hostname', hostname);
    const networkInterfaces = os.networkInterfaces();
    let macAddress;
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
          macAddress = iface.mac;
          break;
        }
      }
      if (macAddress) break;
    }
    localStorage.setItem('macAddress', macAddress);
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
    setTimeout(sendTestNotification, 2 * 60 * 1000);
    const intervalId = setInterval(sendTestNotification, 60 * 60 * 1000);
    ipcRenderer.send('toggle-auto-sync', false);
  },
});


