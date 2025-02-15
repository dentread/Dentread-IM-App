
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

const alertBox = document.getElementById('alert-box');
const alertContainer = document.getElementById('alertContainer');

function getUserDeviceDetails(){
  const token = JSON.parse(localStorage.getItem('token'));
  const acces_token = token.access;
  
  if (!token) {
    console.error('Token not available. Redirecting to login page...');
    window.location.href = 'login_dentread.html';
  } else {
    let linkedDevice;
    try {
      linkedDevice = JSON.parse(localStorage.getItem('linkedDevice'));
    } catch (e) {
      linkedDevice = localStorage.getItem('linkedDevice');
    }
    if(!linkedDevice){
      alertBox.innerHTML = `<i class="fas fa-exclamation-triangle warn-color mr-2"></i> No device is currently linked to the Dentread IM App. Please connect a device to enable data synchronization.`;
      alertContainer.style.backgroundColor = 'bisque';
    }
    const apiUrl = 'https://api.dentread.com/device-information/';
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
      const allDevices = data.device;
      if (allDevices && allDevices.length > 0) {
        const deviceOptionSelect = document.getElementById('deviceOption');
        deviceOptionSelect.innerHTML = '<option value="">Select Device</option>';
        allDevices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.device_uid;
          option.textContent = device.deviceName;
          deviceOptionSelect.appendChild(option);
        });
      }else{
        alertBox.innerHTML = `<i class="fas fa-exclamation-triangle warn-color mr-2"></i> ${data.message}`;
        alertContainer.style.backgroundColor = 'bisque';
      }
    })
    .catch(error => {
        console.error('API request error:', error.message);
    });
  }
};

function manageLinkState(){
  const linkedDevice = localStorage.getItem('linkedDevice');
  const linkedDeviceName = localStorage.getItem('linkedDeviceName');

  const deviceOptionSelect = document.getElementById('deviceOption');
  const linkDeviceAction = document.getElementById('linkDeviceAction');
  const option = document.createElement('option');
  option.value = linkedDevice;
  option.textContent = linkedDeviceName;
  option.selected = true;
  deviceOptionSelect.appendChild(option);
  
  deviceOption.disabled = true;
  linkDeviceAction.disabled = true;
};

document.addEventListener('DOMContentLoaded', function() {
  const linkedDevice = localStorage.getItem('linkedDevice');
  const linkedDeviceName = localStorage.getItem('linkedDeviceName');
  const appLiscence = localStorage.getItem('appLiscence');
  if(linkedDevice && linkedDeviceName && appLiscence){
    manageLinkState();
  }else{
    getUserDeviceDetails();
  }
});

function storeDeviceDetails(deviceUID, deviceName){
  const token = JSON.parse(localStorage.getItem('token'));
  const acces_token = token.access;
  if (!token) {
    console.error('Token not available. Redirecting to login page...');
    window.location.href = 'login_dentread.html';
  } else {
    const appLiscence = localStorage.getItem('appLiscence');
    const mac_host = localStorage.getItem('macAddress') + '_' + localStorage.getItem('hostname');
    const apiUrl = 'https://api.dentread.com/store-device-info/';
    fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${acces_token}`, 
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({
          deviceUID: deviceUID,
          deviceName: deviceName,
          appLiscence: appLiscence,
          mac_host:mac_host
          
        }), 
    })
    .then(response => {
      if (response.ok) {
        return response.json(); 
      } else {
        console.error('API request error:', response.statusText);
      }
    })
    .then(data => {
      if (data) {
        if(!appLiscence && data.liscence){
          localStorage.setItem('appLiscence', data.liscence);
        }
        localStorage.setItem('linkedDevice', deviceUID);
        localStorage.setItem('linkedDeviceName', deviceName);
        alertBox.innerHTML = `<i class="fas fa-check-circle mr-2"></i> Device ${deviceOption.options[deviceOption.selectedIndex].text} linked successfully.`;
        alertContainer.style.backgroundColor = 'bisque';
        manageLinkState();
        setTimeout(() => {
          alertBox.innerHTML = '';
          alertContainer.style.backgroundColor = '';
        }, 2000);

      }
    })
    .catch(error => {
        console.error('API request error:', error.message);
    });
  };
};

const linkDeviceAction = document.getElementById('linkDeviceAction');
linkDeviceAction.addEventListener("click", () => {
  const deviceOption = document.getElementById('deviceOption');
  const selectedDevice = deviceOption.value;
  const selectedDeviceName = deviceOption.options[deviceOption.selectedIndex].text;
  if (selectedDevice === '' || selectedDevice === ' ') {
    alertBox.innerHTML = `<i class="fas fa-info-circle mr-2"></i> Please select a device to link. If no devices are registered, kindly register your device in Dentread.`;
    alertContainer.style.backgroundColor = 'bisque';
    setTimeout(() => {
      alertBox.innerHTML = '';
      alertContainer.style.backgroundColor = '';
    }, 5000);
    return;
  } else {
    storeDeviceDetails(selectedDevice, selectedDeviceName);
  }
});