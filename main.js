const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const { execFile } = require('child_process'); // Added for running the .exe
const ElectronStore = require('electron-store').default;
const store = new ElectronStore();

const app = express();
app.use(cors());
app.use(express.json());

const tokenFilePath = path.join(os.homedir(), 'electron-user-token.txt');

// Start Electron
const electron = require('electron');
const { app: electronApp, BrowserWindow, ipcMain, Menu } = electron;

let mainWindow;

electronApp.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'public', 'favicon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  Menu.setApplicationMenu(null);
  mainWindow.loadURL('http://51.20.198.23:5004/');
  mainWindow.webContents.openDevTools();

  ipcMain.on('set-user-data', (event, data) => {
    userData = data;
    store.set('userSession', {
      token: data.token,
    });
    console.log('User data received:', userData);
  });
  setInterval(() => {
    const session = store.get('userSession');
    console.log('session.token', session);
    if (session?.token) {
      console.log('session.token', session.token);
      takeAndUploadScreenshot(session.token);
    }
  }, 1 * 60 * 1000);
});

async function takeAndUploadScreenshot(token) {
  try {
    const fileName = path.join(os.tmpdir(), `screen-${Date.now()}.png`); // Changed to .png
    const exePath = path.join(__dirname, 'public', 'screenshot.exe'); // Path to the .exe

    // Run the Python .exe to take a screenshot
    await new Promise((resolve, reject) => {
      execFile(exePath, [fileName], (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error executing .exe: ${stderr || error.message}`));
          return;
        }
        console.log('Screenshot taken:', stdout);
        resolve();
      });
    });

    // Check if the screenshot file was created
    if (!fs.existsSync(fileName)) {
      throw new Error('Screenshot file was not created by the .exe');
    }

    // Upload the screenshot
    const form = new FormData();
    form.append('image', fs.createReadStream(fileName));

    const res = await axios.post('http://51.20.198.23:5003/api/V1/auth/screenshotupload', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    const desktopPath = path.join(os.homedir(), 'Desktop');
    const logFilePath = path.join(desktopPath, 'HashtagCRM-error-log.txt');
    fs.appendFileSync(logFilePath, 'Screenshot function triggered.\n');
    console.log('Screenshot uploaded', res.status);
  } catch (err) {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const logFilePath = path.join(desktopPath, 'HashtagCRM-error-log.txt');
    fs.appendFileSync(logFilePath, err.message + '\n');
    console.error('Upload failed:', err.message);
  }
}