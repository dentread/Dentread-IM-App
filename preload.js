const { contextBridge, ipcRenderer,shell } = require('electron');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const archiver = require('archiver');
const rimraf = require('rimraf');



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

  const axiosInstance = axios.create({
    baseURL: apiUrl,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...formData.getHeaders(),
    },
  });
  try {
    const response = await axiosInstance.post('/', formData);
    console.log('API Response for', folderName_withzip, ':', response.data, response.status);
    
    // Return the response object directly
    return response;
  } catch (error) {
    console.error('API Error:', error);
    // If there's an error, you can throw it so it's caught in the calling function
    throw error;
  }
};

// const collectFilesFromDirectory = async (directoryPath) => {
//   const files = [];

//   const collectFiles = async (dir) => {
//     const items = await fs.promises.readdir(dir);

//     for (const item of items) {
//       const itemPath = path.join(dir, item);
//       const stats = await fs.promises.stat(itemPath);

//       if (stats.isDirectory()) {
//         await collectFiles(itemPath);
//       } else {
//         files.push(itemPath);
//       }
//     }
//   };

//   await collectFiles(directoryPath);
//   return files;
// };

const createZipFromDirectory = async (directoryPath) => {
  return new Promise(async (resolve, reject) => {
    const zipFilePath = `${directoryPath}.zip`; // Create a zip file in the same directory

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Set compression level (maximum)
    });

    output.on('close', async () => {
      console.log('Zip archive created:', zipFilePath);
      resolve(zipFilePath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all files and subdirectories to the zip archive
    archive.directory(directoryPath, false); // The 'false' parameter ensures that the directory structure is not included

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

      // Create the directory if it doesn't exist
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
        rimraf.sync(directoryPath); // Synchronously delete the directory and its contents
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
          // If it's a directory, get a list of its contents
          const directoryContents = fs.readdirSync(targetPath);
  
          // Iterate through the contents and remove each one
          for (const item of directoryContents) {
            const itemPath = path.join(targetPath, item);
  
            if (fs.lstatSync(itemPath).isDirectory()) {
              // If it's a subdirectory, recursively delete it
              rimraf.sync(itemPath);
            } else {
              // If it's a file, unlink it (remove it)
              fs.unlinkSync(itemPath);
            }
          }
          
          // After emptying the directory, remove the empty directory itself
          fs.rmdirSync(targetPath);
          
          console.log(`Directory emptied: ${targetPath}`);
          return { success: true, message: `Directory emptied: ${targetPath}` };
        } else if (fs.lstatSync(targetPath).isFile()) {
          // If it's a file, simply unlink it (remove it)
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
                // Check if the folder name is in the set
                const folderNamesSet = new Set(JSON.parse(localStorage.getItem('folderNames')));
                if (!folderNamesSet.has(item)) {
                    // Folder is not in the set, so copy it
                    fs.mkdirSync(destinationItemPath, { recursive: true });
                    namedFunction(sourceItemPath, destinationItemPath, fileExtensions);
                }
            } else {
                const fileExtension = path.extname(item).toLowerCase();
                if (fileExtensions.includes(fileExtension)) {
                    // Check if the filename is in the set
                    const filenameSet = new Set(JSON.parse(localStorage.getItem('filenames')));
                    if (!filenameSet.has(item)) {
                        // File is not in the set, so copy it
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

    // Function to list files and folders in a directory
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
      const apiUrl = 'http://testapi.dentread.com/datasync'; // Replace with your API URL
      const token = JSON.parse(localStorage.getItem('token'));
      const accessToken = token.access;
      const username = localStorage.getItem('savedUsername');
  
      // Check if folderPath is a directory
      const isDirectory = fs.statSync(newDirectoryPath).isDirectory();
  
      let zipFilePath = '';
  
      if (isDirectory) {
        // If it's a directory, create a zip archive from its contents
        zipFilePath = await createZipFromDirectory(newDirectoryPath);
  
        // Send the zip file to the API and store the response
        const response = await sendFileToAPI(zipFilePath, apiUrl, accessToken, username);
  
        console.log('API Request Completed',response);
  
        // After the API request is completed, delete the zip file
        if (zipFilePath) {
          try {
            await fs.promises.unlink(zipFilePath);
            console.log('Zip file deleted:', zipFilePath);
          } catch (err) {
            console.error('Error deleting zip file:', err);
          }
        }
  
        // Return the response data if it exists
        if (response) {
          return response;
        } else {
          return { message: 'API request failed', status: 500 }; // Default status code
        }
      } else {
        // If it's a zip file, send it as is and store the response
        const response = await sendFileToAPI(newDirectoryPath, apiUrl, accessToken, username);
  
        console.log('API Request Completed', response);
  
        // Return the response data if it exists
        if (response) {
          return response;
        } else {
          return { message: 'API request failed', status: 500 }; // Default status code
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      return { message: 'API request failed', status: 500 }; // Default status code
    }
  },
  settingsbuttonfunc: async () => {
    console.log("this is preload");
    ipcRenderer.invoke('open-settings')
    }

  
});


