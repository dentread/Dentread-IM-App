const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("Forcing app to close before uninstall...");

try {
  // Kill the main app
  execSync('taskkill /F /IM DentreadIMApp.exe /T', { stdio: 'ignore' });

  // Kill Electron-related processes
  execSync('taskkill /F /IM electron.exe /T', { stdio: 'ignore' });
  execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' });

  // Kill notification process if running
  const pidFilePath = path.join(__dirname, 'notificationProcess.pid');
  if (fs.existsSync(pidFilePath)) {
    const pid = parseInt(fs.readFileSync(pidFilePath, 'utf8'));
    if (!isNaN(pid)) {
      process.kill(pid);
      fs.unlinkSync(pidFilePath);
      console.log(`Killed background process with PID: ${pid}`);
    }
  }
} catch (error) {
  console.error("Error stopping running app before uninstall:", error);
}
