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
    } else {

        const apiUrl = 'https://api.dentread.com/fileextentions/';

        return fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
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


    const fileExtension = await fetchExtensions();

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


const pushUniqueContents = async (allContents, folderNamesSet, filenamesSet, path) => {
    const contents = await listDirectoryContents(path);
    const timeslot = localStorage.getItem('timeslot');
    const defaultTimeslot = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const timeslotValue = timeslot ? parseInt(timeslot, 10) : defaultTimeslot;
    const twentyFourHoursAgo = new Date().getTime() - timeslotValue;

    contents.forEach(item => {
        if (!folderNamesSet.has(item.name) && !filenamesSet.has(item.name)&& item.createdTimestamp >= twentyFourHoursAgo) {
            allContents.push(item);
            if (item.isDirectory) {
                folderNamesSet.add(item.name);
            } else {
                filenamesSet.add(item.name);
            }
        }
    });
};


const viewTargetedFolder = async () => {
    const targetedDir = JSON.parse(localStorage.getItem('firstSelectedPath'));
    const targetedDir2 = JSON.parse(localStorage.getItem('firstSelectedPath2'));
    const targetedDir3 = JSON.parse(localStorage.getItem('firstSelectedPath3'));
    const container = document.getElementById('allStagedFiles');
    const folderNamesSet = new Set(JSON.parse(localStorage.getItem('folderNames')) || []);
    const filenamesSet = new Set(JSON.parse(localStorage.getItem('filenames')) || []);
    container.innerHTML = '';
    const allContents = [];


    if (targetedDir && targetedDir.firstSelectedPath) {
        await pushUniqueContents(allContents, folderNamesSet, filenamesSet, targetedDir.firstSelectedPath);
    }

    if (targetedDir2 && targetedDir2.firstSelectedPath2) {
        await pushUniqueContents(allContents, folderNamesSet, filenamesSet, targetedDir2.firstSelectedPath2);
    }

    if (targetedDir3 && targetedDir3.firstSelectedPath3) {
        await pushUniqueContents(allContents, folderNamesSet, filenamesSet, targetedDir3.firstSelectedPath3);
    }

    if (allContents.length === 0) {
        container.innerText = 'No files or folders found.';
        return;
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

async function getLinkStatus() {
    const linkedDevice = localStorage.getItem('linkedDevice');
    const linkedDeviceName = localStorage.getItem('linkedDeviceName');
    const appLiscence = localStorage.getItem('appLiscence');

    const token = JSON.parse(localStorage.getItem('token'));
    const acces_token = token.access;
    if (!token) {
        console.error('Token not available. Redirecting to login page...');
        window.location.href = 'login_dentread.html';
    } else {
        const apiUrl = 'https://api.dentread.com/check-device-linkStatus/';
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${acces_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deviceUID: linkedDevice,
                    appLiscence: appLiscence
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data && !data.isLinked && appLiscence && linkedDevice && linkedDeviceName) {
                    localStorage.removeItem('linkedDevice');
                    localStorage.removeItem('linkedDeviceName');
                    linkedDeviceInfo.innerHTML = `No Device Associated`;
                    alertBox.innerHTML = `<i class="fas fa-exclamation-triangle warn-color mr-2"></i> No device is currently linked to the Dentread IM App. Please connect a device to enable data synchronization.`;
                    alertContainer.style.backgroundColor = 'bisque';
                    return false;
                } else {
                    return true;
                }
            } else {
                console.error('API request error:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('API request error:', error.message);
            return false;
        }
    }
};

let func2Running;
const syncButton = document.getElementById('stageToSync');
syncButton.addEventListener('click', async () => {
    const linkStatus = await getLinkStatus();
    if(linkStatus){
        viewTargetedFolder()
        .then(() => {fetchData()
        })
        .then(() => {
            func6();
        })
        .then(() => {
            func2Running = true;
            func2();
        })
        .then(() => {
            func2Running = false;
            const PrefSyncOption = localStorage.getItem('prefSyncOption');
            if (PrefSyncOption === 'scheduleSync') {
                setTimeout(() => {
                    document.getElementById('syncToDentreadId').click();
                }, 30000);
            }
        });
    }
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
    const func3Promises = [];

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
        func3Promises.push(func3(item.name, loaderDiv));

    });
    allStagedFilesContainer.appendChild(ul);
    stgToSyncSection.classList.remove('d-none');
    await Promise.all(func3Promises);
    const PrefSyncOption = localStorage.getItem('prefSyncOption');
    if (PrefSyncOption === 'scheduleSync') {
        document.getElementById('stageToSync').click();
        setTimeout(() => {
            document.getElementById('syncToDentreadId').click();
        }, 30000);
    }


};

let uploadedFileNumber = 0;
let uploadFilePercent = 0;
function handleTheUploadedContentCount() {
    const allStagedFiles = document.getElementById('allStagedFilesdentread');
    const liElements = allStagedFiles.querySelectorAll('li');
    const totalFileCount = liElements.length;
    if (totalFileCount !== uploadedFileNumber && totalFileCount > uploadedFileNumber) {
        uploadedFileNumber += 1;
        document.getElementById('totalUploadedFile').innerText = uploadedFileNumber;
        
        uploadFilePercent = (uploadedFileNumber / totalFileCount) * 100;
        document.getElementById('uploadProgressBar').style.width = `${uploadFilePercent}%`;
        document.getElementById('uploadProgressBar').innerText = `${uploadFilePercent.toFixed(2)}%`;
    }

    if (totalFileCount === uploadedFileNumber) {
        uploadedFileNumber = 0;
        uploadFilePercent = 0;
    }
}



const syncButtondentreadstage = document.getElementById('syncToDentreadId');
syncButtondentreadstage.addEventListener('click', () => {
    if (!func2Running) {
        viewTargetedFolderdentraed();
    }
});

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

                handleTheUploadedContentCount()
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
    await window.versions.getmacidhostname();

});


const scheduleButton = document.getElementById('scheduleSyncBtn');
scheduleButton.addEventListener('click', async () => {
    await Scheduleevent();
    await window.versions.schedulerbuttonfunc();
});



document.addEventListener('DOMContentLoaded', async() => {
    await timeslot();
    const storedPrefSyncOption = localStorage.getItem('prefSyncOption');
    if(storedPrefSyncOption && storedPrefSyncOption === 'scheduleSync'){
        await window.versions.minimizeWindow();
    }else{
        await window.versions.minimizeWindow2();
    }
});


const manualButton = document.getElementById('manualSyncBtn');
manualButton.addEventListener('click', async () => {
    localStorage.setItem('prefSyncOption', 'manualSync');
    await window.versions.manualbuttonfunc();
    await window.versions.minimizeWindow2();
});


const logButton = document.getElementById('log');
logButton.addEventListener('click', async () => {
    await window.versions.logButtonfunc();
});
const logoutButton = document.getElementById('logoutbutton');
logoutButton.addEventListener('click', () => {
    window.location.href = 'login_dentread.html';
    const itemKey = 'savedPassword';
  
    if (localStorage.getItem(itemKey)) {
        localStorage.removeItem(itemKey);
    }
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
    return Promise.resolve();
};

function fetchData() {
    const token = JSON.parse(localStorage.getItem('token'));
    let acces_token= token.access;

    if (!token) {
        console.error('Token not available. Redirecting to login page...');
        window.location.href = 'login_dentread.html';
    } else {

        const apiUrl = 'https://api.dentread.com/user-folders/';

        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${acces_token}`,
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
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

function Scheduleevent() {
    const token = JSON.parse(localStorage.getItem('token'));
    let access_token = token.access;

    if (!token) {
        console.error('Token not available. Redirecting to login page...');
        window.location.href = 'login_dentread.html';
    } else {

        const apiUrl = 'https://api.dentread.com/getschedule/';

        fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            })
            .then(response => {
                if (response.ok) {

                    return response.json();
                } else {
                    console.error('API request error:', response.statusText);
                    throw new Error('Failed to fetch schedule data');
                }
            })
            .then(data => {
                if (data.length === 0) {
                    console.warn('No schedule data available.');
                } else {
                    const scheduleData = {};

                    data.forEach(item => {
                        scheduleData[item.hostname] = item.time;
                    });

                    localStorage.setItem('hostname_time', JSON.stringify(scheduleData));
                }
            })
            .catch(error => {
                console.error('API request error:', error.message);
            });

    }
};

function timeslot() {
    const token = JSON.parse(localStorage.getItem('token'));
    let access_token = token.access;

    if (!token) {
        console.error('Token not available. Redirecting to login page...');
        window.location.href = 'login_dentread.html';
    } else {

        const apiUrl = 'https://api.dentread.com/timeslot/';

        fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    console.error('API request error:', response.statusText);
                    throw new Error('Failed to fetch time data');
                }
            })
            .then(data => {
                if (!data || !data.timeslots || data.timeslots.length === 0) {
                    console.warn('No time data available.');
                } else {
                    localStorage.setItem('timeslot', data.timeslots[0]);
                }
            })
            .catch(error => {
                console.error('API request error:', error.message);
            });

    }
}
