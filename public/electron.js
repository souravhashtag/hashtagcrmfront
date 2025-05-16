const { app, BrowserWindow } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const os = require('os');

let win;
const desktopDir = path.join(os.homedir(), 'Desktop');
const logFile = path.join(desktopDir, 'screenshot-log.txt');

// Helper: write logs with timestamp
function logToFile(message) {
  const time = new Date().toISOString();
  try {
    fs.appendFileSync(logFile, `[${time}] ${message}\n`);
  } catch (err) {
    console.error('⚠️ Failed to write to log file:', err);
  }
}

// Helper: create window
function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const localIndex = path.join(__dirname, 'build', 'index.html');
  const startUrl = `http://localhost:3000/` || `file://${localIndex}`;

    win.loadURL(startUrl).catch(err => {
      logToFile(`❌ Failed to load URL: ${err.message}`);
    });
  

  // Enable DevTools in dev environment (optional)
  // win.webContents.openDevTools({ mode: 'detach' });
}

// App ready
app.whenReady().then(() => {
  createWindow();

  // Start periodic screenshots
  setInterval(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(desktopDir, `screenshot-${timestamp}.jpg`);
      const imgBuffer = await screenshot();
      fs.writeFileSync(filePath, imgBuffer);
      logToFile(`📸 Screenshot saved at: ${filePath}`);
    } catch (e) {
      logToFile(`❌ Screenshot error: ${e.message}`);
    }
  }, 10 * 60 * 1000); // Every 10 minutes
});

// Close app
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
