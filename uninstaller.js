const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("Forcing app to close before uninstall...");

function killProcess(processName) {
    try {
        execSync(`taskkill /F /IM ${processName} /T`, { stdio: 'ignore' });
    } catch (error) {
        console.error(`Error killing process ${processName}:`, error);
    }
}

// Kill the main app and related processes
killProcess('DentreadIMApp.exe');
killProcess('electron.exe');
killProcess('node.exe');
killProcess('notificationProcess.exe');

// Kill notification process if running
const pidFilePath = path.join(__dirname, 'notificationProcess.pid');
if (fs.existsSync(pidFilePath)) {
    const pid = parseInt(fs.readFileSync(pidFilePath, 'utf8'));
    if (!isNaN(pid)) {
        try {
            process.kill(pid);
            fs.unlinkSync(pidFilePath);
            console.log(`Killed background process with PID: ${pid}`);
        } catch (error) {
            console.error(`Error killing background process with PID: ${pid}`, error);
        }
    }
}