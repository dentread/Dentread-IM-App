const { contextBridge, ipcRenderer,shell } = require('electron');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const archiver = require('archiver');
const rimraf = require('rimraf');
const fetch = require('node-fetch');


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

  console.log('Request URL:', apiUrl); // Add this line to log the request URL
  console.log('Form Data Fields:', formData); // Add this line to log the form data

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...formData.getHeaders()
    },
    body: formData,
  });

  console.log('Response Status:', response.status); // Add this line to log the response status

  if (response.ok) {
    const responseData = await response.text();
    console.log('API Response:', responseData, response.status);
    return response;
  } else {
    console.error('API Error:', response.statusText);
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
      console.log('Zip archive created:', zipFilePath);
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

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping'),
  
  createDirectory: (username) => {
    try {
      const projectPath = './';

      const directoryPath = path.join(projectPath, 'Dentread', username);

      console.log(directoryPath)

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
        localStorage.setItem('dentread_dir', directoryPath);
        return { success: true, message: `Directory created at ${directoryPath}`,directoryPath:`${directoryPath}` };
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
        console.log(`Directory deleted: ${directoryPath}`);
        return { success: true, message: `Directory deleted: ${directoryPath}` };
      } else {
        console.log('Directory does not exist');
        return { success: false, message: 'Directory does not exist' };
      }
    } catch (error) {
      console.error('Error deleting directory:', error.message);
      return { success: false, message: error.message };
    }
  },
  emptyDirectory: (directoryName) => {
    try {
      const projectPath = './';
      const username = localStorage.getItem('savedUsername');
      const dentreadDirectoryPath = path.join(projectPath, 'Dentread');
      const usernameDirectoryPath = path.join(dentreadDirectoryPath, username);
      const targetPath = path.join(usernameDirectoryPath, directoryName);
  
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
          
          console.log(`Directory emptied: ${targetPath}`);
          return { success: true, message: `Directory emptied: ${targetPath}` };
        } else if (fs.lstatSync(targetPath).isFile()) {
          fs.unlinkSync(targetPath);
          
          console.log(`File removed: ${targetPath}`);
          return { success: true, message: `File removed: ${targetPath}` };
        } else {
          console.log('Invalid target: Neither a file nor a directory');
          return { success: false, message: 'Invalid target: Neither a file nor a directory' };
        }
      } else {
        console.log('Target does not exist');
        return { success: false, message: 'Target does not exist' };
      }
    } catch (error) {
      console.error('Error emptying directory:', error.message);
      return { success: false, message: error.message };
    }
  },
  
  

  copyFilesWithCondition: function namedFunction(sourceDirectory, destinationDirectory, fileExtensions) {
    try {
        if (!fs.existsSync(destinationDirectory)) {
            fs.mkdirSync(destinationDirectory, { recursive: true });
        }
        const items = fs.readdirSync(sourceDirectory);

        items.forEach((item, index) => {
            const sourceItemPath = path.join(sourceDirectory, item);
            const destinationItemPath = path.join(destinationDirectory, item);

            if (fs.statSync(sourceItemPath).isDirectory()) {
                const folderNamesSet = new Set(JSON.parse(localStorage.getItem('folderNames')));
                if (!folderNamesSet.has(item)) {
                    fs.mkdirSync(destinationItemPath, { recursive: true });
                    namedFunction(sourceItemPath, destinationItemPath, fileExtensions);
                }
            } else {
                const fileExtension = path.extname(item).toLowerCase();
                if (fileExtensions.includes(fileExtension)) {
                    const filenameSet = new Set(JSON.parse(localStorage.getItem('filenames')));
                    if (!filenameSet.has(item)) {
                        fs.copyFileSync(sourceItemPath, destinationItemPath);
                    }
                }
            }
        });

        console.log('Files and folders copied successfully');
        return { success: true, message: 'Files and folders copied successfully' };
    } catch (error) {
        console.error('Error copying files:', error.message);
        throw error;
    }
},

  listFilesAndFolders: async (directoryPath)=> {
    try {
      const items = fs.readdirSync(directoryPath);
      return items.map(item => ({
        name: item,
        isDirectory: fs.statSync(path.join(directoryPath, item)).isDirectory()
      }));
    } catch (error) {
      console.error('Error listing files and folders:', error);
      return [];
    }
  },


  hitApiWithFolderPathAndSubdirectories: async (reqdId) => {
    try {
      const savedUsername = localStorage.getItem('savedUsername');
      const currentWorkingDirectory = process.cwd();
      console.log('reqdId:', reqdId);
  
      const newDirectoryPath = currentWorkingDirectory + '\\' + 'Dentread' + '\\' + savedUsername + '\\' + reqdId;
      console.log('newDirectoryPath:', newDirectoryPath);
      const apiUrl = 'http://testapi.dentread.com/datasync/';
      const token = JSON.parse(localStorage.getItem('token'));
      const accessToken = token.access;
      const username = localStorage.getItem('savedUsername');
  
      const isDirectory = fs.statSync(newDirectoryPath).isDirectory();
  
      let zipFilePath = '';
  
      if (isDirectory) {
        zipFilePath = await createZipFromDirectory(newDirectoryPath);
  
        const response = await sendFileToAPI(zipFilePath, apiUrl, accessToken, username);
  
        console.log('API Request Completed',response);
  
        if (zipFilePath) {
          try {
            await fs.promises.unlink(zipFilePath);
            console.log('Zip file deleted:', zipFilePath);
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
  
        console.log('API Request Completed', response);
  
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
    console.log("this is preload");
    ipcRenderer.invoke('open-settings')
    }

  
});


