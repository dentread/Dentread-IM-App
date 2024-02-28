
const retrivePathValue = JSON.parse(localStorage.getItem('firstSelectedPath'));
const syncedPathOneInput = document.getElementById('syncedPathOne');

const retrivePathValue2 = JSON.parse(localStorage.getItem('firstSelectedPath2'));
const syncedPathOneInput2 = document.getElementById('syncedPathTwo');



const retrivePathValue3 = JSON.parse(localStorage.getItem('firstSelectedPath3'));
const syncedPathOneInput3 = document.getElementById('syncedPathThree');

if (retrivePathValue) {
    syncedPathOneInput.value = retrivePathValue.firstSelectedPath;
    document.getElementById('editThePath').disabled = false;
  }
  
  if (retrivePathValue2) {
    syncedPathOneInput2.value = retrivePathValue2.firstSelectedPath2;
    document.getElementById('editThePath2').disabled = false;
  }
  
  if (retrivePathValue3) {
    syncedPathOneInput3.value = retrivePathValue3.firstSelectedPath3;
    document.getElementById('editThePath3').disabled = false;
  }

document.getElementById('selectButton').addEventListener('click', function() {
    const directoryInput = document.getElementById('filepicker');
    directoryInput.click();

});

function storeThePath(localPath) {
    if (localPath !== 'emptyFile') {
      let firstObtPath = JSON.parse(localStorage.getItem('firstSelectedPath'));
      let secondObtPath = JSON.parse(localStorage.getItem('firstSelectedPath2'));
      let thirdObtPath = JSON.parse(localStorage.getItem('firstSelectedPath3'));
  
      if (!firstObtPath) {
        localStorage.setItem('firstSelectedPath', JSON.stringify({ 'firstSelectedPath': localPath }));
        document.getElementById('syncedPathOne').value = localPath;
        document.getElementById('editThePath').disabled = false;
      } else if (!secondObtPath) {
        localStorage.setItem('firstSelectedPath2', JSON.stringify({ 'firstSelectedPath2': localPath }));
        document.getElementById('syncedPathTwo').value = localPath;
        document.getElementById('editThePath2').disabled = false;
      } else if (!thirdObtPath) {
        localStorage.setItem('firstSelectedPath3', JSON.stringify({ 'firstSelectedPath3': localPath }));
        document.getElementById('syncedPathThree').value = localPath;
        document.getElementById('editThePath3').disabled = false;
      }

      document.getElementById('visibleDir').value = null;
  
      document.getElementById('filepicker_add').disabled = true;
    }
  }

const addPathBtn = document.getElementById('filepicker_add');

const visibleDirInput = document.getElementById('visibleDir');

function enbFunc(){
    const directoryPath = visibleDirInput.value;
    if (!directoryPath) {
      addPathBtn.disabled = true;
    } else {
      addPathBtn.disabled = false;
    }
};


visibleDirInput.addEventListener('input', enbFunc)

let fileStorePath = 'emptyFile';

document.getElementById("filepicker").addEventListener("change", (event) => {
  const selectedDirectory = event.target.files[0];
  const allFiles = event.target.files;

  if (selectedDirectory) {
      let directoryPath = selectedDirectory.path;
      let directoryPath2 = selectedDirectory.webkitRelativePath;

      // Find the root directory from directoryPath2
      const rootDirectory = directoryPath2.split('/')[0];

      // Change directoryPath up to the root directory
      directoryPath = directoryPath.substring(0, directoryPath.indexOf(rootDirectory) + rootDirectory.length);

      document.getElementById('visibleDir').value = directoryPath;

      if (directoryPath) {
          fileStorePath = directoryPath;
          enbFunc();
      }
  } else {
      console.log('No directory selected.');
  }
}, false);


document.getElementById('filepicker_add').addEventListener('click', () => {
    storeThePath(fileStorePath);
});

const editPathBtn = document.getElementById('editThePath');
editPathBtn.addEventListener('click', () => {
    const syncedPathOneValue = document.getElementById('syncedPathOne').value;
    if (syncedPathOneValue) {
        localStorage.removeItem('firstSelectedPath');
        document.getElementById('syncedPathOne').value = null;
        editPathBtn.disabled = true;
    }
});

const editPathBtn2 = document.getElementById('editThePath2');
editPathBtn2.addEventListener('click', () => {
    const syncedPathTwoValue = document.getElementById('syncedPathTwo').value;
    if (syncedPathTwoValue) {
        localStorage.removeItem('firstSelectedPath2');
        document.getElementById('syncedPathTwo').value = null;
        editPathBtn2.disabled = true;
    }
});

const editPathBtn3 = document.getElementById('editThePath3');
editPathBtn3.addEventListener('click', () => {
    const syncedPathThreeValue = document.getElementById('syncedPathThree').value;
    if (syncedPathThreeValue) {
        localStorage.removeItem('firstSelectedPath3');
        document.getElementById('syncedPathThree').value = null;
        editPathBtn3.disabled = true;
    }
});
