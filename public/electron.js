// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const os = require('os');
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load React app URL or local build file:
  if (process.env.ELECTRON_START_URL) {
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    win.loadFile(path.join(__dirname, 'build', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Screenshot every 5 seconds
  setInterval(async () => {
    try {
        const imgBuffer = await screenshot();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = path.join(os.homedir(), 'Desktop', `screenshot-${timestamp}.jpg`);

        fs.writeFileSync(filePath, imgBuffer);
        console.log('📸 Screenshot saved at:', filePath);
    } catch (e) {
        console.error('Screenshot error:', e);
    }
    }, 600000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
