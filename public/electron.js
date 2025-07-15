const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const screenshot = require('screenshot-desktop');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const { JSDOM } = require('jsdom');
const ElectronStore = require('electron-store').default;
const store = new ElectronStore();

const app = express();
app.use(cors()); 
app.use(express.json());

app.use(express.json());

const tokenFilePath = path.join(os.homedir(), 'electron-user-token.txt');


// Start Electron + screenshot job
const electron = require('electron');
const { app: electronApp, BrowserWindow, ipcMain, Menu } = electron;

let mainWindow;

electronApp.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      contextIsolation: true,                     
      nodeIntegration: false,                      
    },
  });
  Menu.setApplicationMenu(null);
   mainWindow.loadURL('http://13.61.22.39:5004/');
  //mainWindow.loadURL('http://localhost:3000');
  ipcMain.on('set-user-data', (event, data) => {
    userData = data;
    store.set('userSession', {
      token: data.token,
    }); 
    console.log('User data received:', userData);
  });
  setInterval(() => {    
    
    // if (fs.existsSync(tokenFilePath)) {
    //   const token = fs.readFileSync(tokenFilePath, 'utf8').trim();
      const session = store.get('userSession');
      console.log("session.token",session);
      if(session?.token){
          console.log("session.token",session.token);
          takeAndUploadScreenshot(session.token);
      }
    //}
  }, 10 * 60 * 1000); 
});


async function takeAndUploadScreenshot(token) {
  try {
    //console.log(token)
    const fileName = path.join(os.tmpdir(), `screen-${Date.now()}.jpg`);
    await screenshot({ filename: fileName });

    const form = new FormData();
    form.append('image', fs.createReadStream(fileName));

    const res = await axios.post('http://13.61.22.39:5004/api/V1/auth/screenshotupload', form, {
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
    fs.appendFileSync(logFilePath, err.message+'\n');
    console.error('Upload failed:', err.message);
  }
}


