const userNameValue = localStorage.getItem('user_name');
const orgNameValue = localStorage.getItem('orgname');

const truncateString = (str, maxLength) => {
    if (str.length > maxLength) {
        return str.substring(0, maxLength) + '...';
    }
    return str;
};

const truncatedUserName = truncateString(userNameValue, 10);
const truncatedOrgName = truncateString(orgNameValue, 40);

const userNameElements = document.getElementsByClassName('user-name');
const orgNameElements = document.getElementsByClassName('centre-name');

for (let i = 0; i < userNameElements.length; i++) {
    userNameElements[i].innerText = truncatedUserName;
}

for (let i = 0; i < orgNameElements.length; i++) {
    orgNameElements[i].innerText = truncatedOrgName;
}

function fetchExtensions() {
    const token = JSON.parse(localStorage.getItem('token'));
    const accessToken = token ? token.access : null;

    if (!accessToken) {
        console.error('Token not available. Redirecting to login page...');
        // You might want to handle the case where the token is not available.
    } else {
        console.log('Token available:', accessToken);

        const apiUrl = 'http://testapi.dentread.com/fileextentions/';

        return fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
                console.log('API request successful');
                return response.json();
            } else {
                console.error('API request error:', response.statusText);
            }
        })
        .then(data => {
            const fileExtensionsArray = data.FileExtentions.map(extension => extension);
            localStorage.setItem('fileExtensions', JSON.stringify(fileExtensionsArray));

            return fileExtensionsArray;
        })
        .catch(error => {
            console.error('API request error:', error.message);
            // You might want to handle the error case accordingly.
            throw error;
        });
    }
}


const func2 = async () => {
    const existingFolders = JSON.parse(localStorage.getItem('folderNames')) || [];
    const targetedDir_dentread = JSON.parse(localStorage.getItem('firstSelectedPath'));
    const targetedDir_dentread2 = JSON.parse(localStorage.getItem('firstSelectedPath2'));
    const targetedDir_dentread3 = JSON.parse(localStorage.getItem('firstSelectedPath3'));
    const dentread_dir = localStorage.getItem('dentread_dir');
    // const fileExtension = ['.stl', '.obj', '.ply', '.fbx', '.dae', '.3ds', '.blend', '.dxf', '.step', '.stp', '.igs', '.iges', '.x3d', '.vrml', '.amf', '.gltf', '.glb', '.usdz', '.3mf', '.wrl', '.xml', '.dcm', '.zip','.png','.jpg','.pdf','.jpeg'];

    const fileExtension = await fetchExtensions();
    console.log(fileExtension,"fileExtension")

    const isFolderInLocalStorage = (folderName) => {
        return existingFolders.includes(folderName);
    };

    const copyFolderIfNotInLocalStorage = async (localFolderPath) => {
        const folderName = localFolderPath.split('/').pop();

        if (!isFolderInLocalStorage(folderName)) {
            const response = await window.versions.copyFilesWithCondition(localFolderPath, dentread_dir, fileExtension);
        }
    };

    if (targetedDir_dentread && targetedDir_dentread.firstSelectedPath) {
        const local_file_path = targetedDir_dentread.firstSelectedPath;
        await copyFolderIfNotInLocalStorage(local_file_path);
    }

    if (targetedDir_dentread2 && targetedDir_dentread2.firstSelectedPath2) {
        const local_file_path2 = targetedDir_dentread2.firstSelectedPath2;
        await copyFolderIfNotInLocalStorage(local_file_path2);
    }

    if (targetedDir_dentread3 && targetedDir_dentread3.firstSelectedPath3) {
        const local_file_path3 = targetedDir_dentread3.firstSelectedPath3;
        await copyFolderIfNotInLocalStorage(local_file_path3);
    }
};

const viewTargetedFolder = async () => {
    const targetedDir = JSON.parse(localStorage.getItem('firstSelectedPath'));
    const targetedDir2 = JSON.parse(localStorage.getItem('firstSelectedPath2'));
    const targetedDir3 = JSON.parse(localStorage.getItem('firstSelectedPath3'));
    const container = document.getElementById('allStagedFiles');
    container.innerHTML = '';
    const allContents = [];

    if (targetedDir && targetedDir.firstSelectedPath) {
        const contents = await listDirectoryContents(targetedDir.firstSelectedPath);
        allContents.push(...contents);
    }

    if (targetedDir2 && targetedDir2.firstSelectedPath2) {
        const contents = await listDirectoryContents(targetedDir2.firstSelectedPath2);
        allContents.push(...contents);
    }

    if (targetedDir3 && targetedDir3.firstSelectedPath3) {
        const contents = await listDirectoryContents(targetedDir3.firstSelectedPath3);
        allContents.push(...contents);
    }

    if (allContents.length === 0) {
        container.innerText = 'No files or folders found.';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'custom-list';
    allContents.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name}`;
        ul.appendChild(li);
    });
    container.appendChild(ul);
};

const listDirectoryContents = async (directoryPath) => {
    const response = await window.versions.listFilesAndFolders(directoryPath);
    return response;
};

const syncButton = document.getElementById('stageToSync');
syncButton.addEventListener('click', () => {
    viewTargetedFolder()
    .then(() => fetchData())
    .then(() => {
        func6();
    })
    .then(() => {
        func2();
    });
});

const viewTargetedFolderdentraed = async () => {
    const targetedDir = localStorage.getItem('dentread_dir');
    const response = await window.versions.listFilesAndFolders(targetedDir);
    const allStagedFilesContainer = document.getElementById('allStagedFilesdentread');
    allStagedFilesContainer.innerHTML = '';
    const stgToSyncSection = document.getElementById('stgToSyncdentread');
    stgToSyncSection.classList.add('d-none');

    if (response.length === 0) {
        allStagedFilesContainer.innerText = 'Nothing to sync./ Already sync';
        stgToSyncSection.classList.remove('d-none');
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'custom-list2';

    response.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.paddingLeft = '0';

        const label = document.createElement('label');
        const text = item.name.length > 25 ? item.name.substring(0, 25) + '...  ' : item.name;
        label.textContent = `${index + 1}. ${text}  `;

        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'loader';

        li.appendChild(label);
        li.appendChild(loaderDiv);

        ul.appendChild(li);
        func3(item.name, loaderDiv);
    });

    allStagedFilesContainer.appendChild(ul);
    stgToSyncSection.classList.remove('d-none');
};

const syncButtondentreadstage = document.getElementById('syncToDentreadId');
syncButtondentreadstage.addEventListener('click', viewTargetedFolderdentraed);

const func3 = async (reqdId, loaderDiv) => {
    const timeoutMs = 10 * 60 * 1000;

    try {
        let response;
        let timeoutHandle;

        const apiPromise = new Promise(async (resolve, reject) => {
            try {
                response = await window.versions.hitApiWithFolderPathAndSubdirectories(reqdId);
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });

        const timeoutPromise = new Promise((_, reject) => {
            const timeoutHandle = setTimeout(() => {
                clearTimeout(timeoutHandle);
                reject(new Error('API call timed out'));
            }, timeoutMs);
        });

        const result = await Promise.race([apiPromise, timeoutPromise]);

        if (loaderDiv) {
            loaderDiv.style.animation = 'none';

            if (result === 'API call timed out') {
                const timeoutImage = document.createElement('img');
                timeoutImage.src = '../images/timeout.png';
                timeoutImage.alt = 'Timeout';
                timeoutImage.width = 12;
                timeoutImage.height = 12;
                timeoutImage.style.marginLeft = '20px';
                loaderDiv.replaceWith(timeoutImage);
            } else if (response) {
                const successImage = document.createElement('img');
                successImage.src = '../images/tick-check.png';
                successImage.alt = 'Success';
                successImage.width = 12;
                successImage.height = 12;
                successImage.style.marginLeft = '20px';
                loaderDiv.replaceWith(successImage);
                if (reqdId !== null) {
                    await func7(reqdId);
                    await fetchData();
                    await func6();
                }
            } else {
                const failureImage = document.createElement('img');
                failureImage.src = '../images/cross-check.png';
                failureImage.alt = 'Failure';
                failureImage.width = 12;
                failureImage.height = 12;
                failureImage.style.marginLeft = '20px';
                loaderDiv.replaceWith(failureImage);
            }
        }
    } catch (error) {
        if (loaderDiv) {
            loaderDiv.style.animation = 'none';
            const failureImage = document.createElement('img');
            failureImage.src = '../images/cross-check.png';
            failureImage.alt = 'Failure';
            failureImage.width = 12;
            failureImage.height = 12;
            failureImage.style.marginLeft = '20px';
            loaderDiv.replaceWith(failureImage);
        }
    }
};

const settingsButton = document.getElementById('settingsButton');
settingsButton.addEventListener('click', async () => {
    await window.versions.settingsbuttonfunc();
});

const logoutButton = document.getElementById('logoutbutton');
logoutButton.addEventListener('click', () => {
    window.location.href = 'login_dentread.html';
});

const func5 = async () => {
    const response = await window.versions.deleteDirectory();
};

const func7 = async (newDirectoryPath) => {
    const response = await window.versions.emptyDirectory(newDirectoryPath);
};

const func6 = async () => {
    const syncedFoldersJSON = localStorage.getItem('folderNames');
    const syncedFoldersArray = JSON.parse(syncedFoldersJSON);
    
    if (Array.isArray(syncedFoldersArray)) {
        const totalCount = syncedFoldersArray.length;
        const totalSyncedFoldersElement = document.querySelector('.important-text');
        totalSyncedFoldersElement.textContent = totalCount;
        const textElement = totalSyncedFoldersElement.nextElementSibling;
        textElement.textContent = totalCount === 1 ? 'Synced Folder' : 'Synced Folders';
    } else {
        console.error('Synced folders array not found in local storage.');
    }

    // Return a resolved promise
    return Promise.resolve();
};
function fetchData() {
    console.log("inside fetchData")
    const token = JSON.parse(localStorage.getItem('token'));
    let acces_token= token.access;

    if (!token) {
        console.error('Token not available. Redirecting to login page...');
        window.location.href = 'login_dentread.html';
    } else {
        console.log('Token available:', acces_token);

        const apiUrl = 'http://testapi.dentread.com/user-folders/';

        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${acces_token}`,
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
                console.log('API request successful');
                return response.json();
            } else {
                console.error('API request error:', response.statusText);
            }
        })
        .then(data => {
            const folderNamesSet = new Set();
            const filenamesSet = new Set();
        
            for (const folderName in data.folders) {
                if (data.folders.hasOwnProperty(folderName)) {
                    folderNamesSet.add(folderName);
        
                    data.folders[folderName].forEach(file => {
                        filenamesSet.add(file.filename);
                    });
                }
            }
        
            localStorage.setItem('folderNames', JSON.stringify(Array.from(folderNamesSet)));
            localStorage.setItem('filenames', JSON.stringify(Array.from(filenamesSet)));
        })
        .catch(error => {
            console.error('API request error:', error.message);
        });
    }
};
