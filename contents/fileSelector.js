
// const retrivePathValue = JSON.parse(localStorage.getItem('firstSelectedPath'));
// if (retrivePathValue && retrivePathValue.firstSelectedPath) {
//   document.getElementById('stageToSync').disabled = false;
// }
const userNameValue = localStorage.getItem('user_name');
const orgNameValue = localStorage.getItem('orgname');

// Function to truncate the string to a specific length
const truncateString = (str, maxLength) => {
    if (str.length > maxLength) {
        return str.substring(0, maxLength) + '...';
    }
    return str;
};

// Truncate values to specified character limits
const truncatedUserName = truncateString(userNameValue, 10);
const truncatedOrgName = truncateString(orgNameValue, 40);

// Select elements by class name
const userNameElements = document.getElementsByClassName('user-name');
const orgNameElements = document.getElementsByClassName('centre-name');

// Update the inner text for each element with the truncated values
for (let i = 0; i < userNameElements.length; i++) {
    userNameElements[i].innerText = truncatedUserName;
}

for (let i = 0; i < orgNameElements.length; i++) {
    orgNameElements[i].innerText = truncatedOrgName;
}





const func2 = async () => {
    // Retrieve the list of folders already in localStorage
    const existingFolders = JSON.parse(localStorage.getItem('folderNames')) || [];

    // Retrieve the target directory paths from localStorage
    const targetedDir_dentread = JSON.parse(localStorage.getItem('firstSelectedPath'));
    const targetedDir_dentread2 = JSON.parse(localStorage.getItem('firstSelectedPath2'));
    const targetedDir_dentread3 = JSON.parse(localStorage.getItem('firstSelectedPath3'));

    // Retrieve the dentread directory path from localStorage
    const dentread_dir = localStorage.getItem('dentread_dir');

    // Define the file extensions to be copied
    const fileExtension = ['.stl', '.obj', '.ply', '.fbx', '.dae', '.3ds', '.blend', '.dxf', '.step', '.stp', '.igs', '.iges', '.x3d', '.vrml', '.amf', '.gltf', '.glb', '.usdz', '.3mf', '.wrl', '.xml', '.dcm', '.zip'];

    // Function to check if a folder is already in localStorage
    const isFolderInLocalStorage = (folderName) => {
        return existingFolders.includes(folderName);
    };

    // Helper function to copy a folder if it's not in localStorage
    const copyFolderIfNotInLocalStorage = async (localFolderPath) => {
        const folderName = localFolderPath.split('/').pop(); // Extract the folder name from the path

        if (!isFolderInLocalStorage(folderName)) {
            const response = await window.versions.copyFilesWithCondition(localFolderPath, dentread_dir, fileExtension);
            // Handle the response as needed
        }
    };

    // Check if each target directory path exists before attempting to copy files
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

    // Merge the contents of all directories
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
syncButton.addEventListener('click', async () => {
    await viewTargetedFolder();
    await fetchData();
    await func6();
    await func2();
    
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
        li.style.display = 'flex'; // Make the li a flex container
        li.style.alignItems = 'center'; // Center items vertically
        li.style.paddingLeft = '0'; // Set left padding to zero

        // Create a label for the folder/file name with numbering and ellipsis
        const label = document.createElement('label');
        const text = item.name.length > 25 ? item.name.substring(0, 25) + '...  ' : item.name;
        label.textContent = `${index + 1}. ${text}  `;

        // Create a loading div (without the button)
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'loader'; // Use the loader class for the circular loader

        li.appendChild(label);
        li.appendChild(loaderDiv); // Append the loader after the label

        ul.appendChild(li);

        // Call func3 automatically for each reqdId
        func3(item.name, loaderDiv); // Pass the item.name and loaderDiv to func3
    });


    allStagedFilesContainer.appendChild(ul);
    stgToSyncSection.classList.remove('d-none');
    
};
const syncButtondentreadstage = document.getElementById('syncToDentreadId');
syncButtondentreadstage.addEventListener('click', viewTargetedFolderdentraed);

const func3 = async (reqdId, loaderDiv) => {
    const timeoutMs = 10 * 60 * 1000; // 6 minutes in milliseconds

    try {
        let response;
        let timeoutHandle;

        // Create a Promise that resolves when the API call is complete
        const apiPromise = new Promise(async (resolve, reject) => {
            try {
                // Perform the API call and store the response
                response = await window.versions.hitApiWithFolderPathAndSubdirectories(reqdId);
                console.log(response,"jhaSDUGasdvJASDGHAs")
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });

        // Set a timeout to reject the Promise if it takes longer than 6 minutes
        const timeoutPromise = new Promise((resolve, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error('API call timed out'));
            }, timeoutMs);
        });

        // Use Promise.race to wait for the API call or the timeout
        const result = await Promise.race([apiPromise, timeoutPromise]);

        // Clear the timeout handle
        clearTimeout(timeoutHandle);

        if (loaderDiv) {
            loaderDiv.style.animation = 'none'; // Stop the rotation animation

            if (result === 'API call timed out') {
                // Display a cross (X) image for timeout and remove the loader div
                const timeoutImage = document.createElement('img');
                timeoutImage.src = '../images/timeout.png';
                timeoutImage.alt = 'Timeout';
                timeoutImage.width = 12;
                timeoutImage.height = 12;
                timeoutImage.style.marginLeft = '20px';
                loaderDiv.replaceWith(timeoutImage);
            } else if (response && response.status === 200) { // Check if response is defined
                // Display a checkmark image for success and remove the loader div
                const successImage = document.createElement('img');
                successImage.src = '../images/tick-check.png';
                successImage.alt = 'Success';
                successImage.width = 12;
                successImage.height = 12;
                successImage.style.marginLeft = '20px';
                loaderDiv.replaceWith(successImage);
                if (reqdId !== null) {
                    // Call func7 with the synced directory path for removal
                    await func7(reqdId);
                  }
            } else {
                // Display a cross (X) image for failure and remove the loader div
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
        console.error('API Error:', error);
        if (loaderDiv) {
            loaderDiv.style.animation = 'none'; // Stop the rotation animation
            // Display a cross (X) image for failure and remove the loader div
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

// Get a reference to the logout button element
const logoutButton = document.getElementById('logoutbutton');
logoutButton.addEventListener('click', () => {
    // localStorage.removeItem('folderNames');
    // localStorage.removeItem('filenames');
    // localStorage.removeItem('dentread_dir');
    // func5()

    window.location.href = 'login_dentread.html';
});
const func5 = async () => {
    console.log("i am here inside func5")

    const response = await window.versions.deleteDirectory();
}

const func7 = async (newDirectoryPath) => {
    console.log("i am here inside func7")

    const response = await window.versions.emptyDirectory(newDirectoryPath);
}

const func6 = async () => {
    const syncedFoldersJSON = localStorage.getItem('folderNames');
    const syncedFoldersArray = JSON.parse(syncedFoldersJSON);
    
    // Check if the synced folders array exists and is an array
    if (Array.isArray(syncedFoldersArray)) {
        // Get the total count of synced folders
        const totalCount = syncedFoldersArray.length;
    
        // Update the HTML element with the total count
        const totalSyncedFoldersElement = document.querySelector('.important-text');
        totalSyncedFoldersElement.textContent = totalCount;
    
        // Optionally, you can update the text following the count
        const textElement = totalSyncedFoldersElement.nextElementSibling;
        textElement.textContent = totalCount === 1 ? 'Synced Folder' : 'Synced Folders';
    } else {
        // Handle the case where the array is not found or is not an array
        console.error('Synced folders array not found in local storage.');
    }
}