const notifier = require('node-notifier');
const { exec } = require('child_process');

function isProcessRunning(processName) {
    try {
      const result = exec(`tasklist /FI "IMAGENAME eq ${processName}.exe"`, { encoding: 'utf-8' });
      console.log('Tasklist result:', result); 
      return result.includes(processName);
    } catch (error) {
      console.error('Error executing tasklist:', error); 
      return false;
    }
  }

function sendNotificationIfAppNotRunning() {
  const isElectronRunning = isProcessRunning('DentreadIMApp');
  if (!isElectronRunning) {
    notifier.notify({
      title: 'IM App Notification',
      message: 'Your app is not running please restart to sync data to Dentread',
      icon: 'images/LogoDentread.png',
      sound: true,
      wait: true,
    });
  }
}

setInterval(sendNotificationIfAppNotRunning, 14400000);
