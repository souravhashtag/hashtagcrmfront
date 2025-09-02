const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const { JSDOM } = require('jsdom');
const ElectronStore = require('electron-store').default;
const store = new ElectronStore();

const app = express();
app.use(cors());
app.use(express.json());

const electron = require('electron');
const { app: electronApp, BrowserWindow, ipcMain, Menu } = electron;

let mainWindow;

// ------------------- MAIN ELECTRON APP -------------------
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

  ipcMain.on('set-user-data', (event, data) => {
    store.set('userSession', { token: data.token });
    console.log('User data received:', data);
  });

  // Run screenshot every 5 seconds (change if needed)
  setInterval(() => {
    const session = store.get('userSession');
    if (session?.token) {
      takeAndUploadScreenshot(session.token);
    }
  }, 5 * 1000); // <-- 5 seconds
});

// ------------------- SCREENSHOT FUNCTION -------------------
async function takeAndUploadScreenshot(token) {
  try {
    const displays = await screenshot.listDisplays();
    console.log("Displays found:", displays.length);

    const buffers = [];
    const dimensions = [];

    for (const display of displays) {
      try {
        const buf = await screenshot({ screen: display.id });
        if (buf) {
          const meta = await sharp(buf).metadata();
          buffers.push(buf);
          dimensions.push({ width: meta.width, height: meta.height });
        } else {
          console.warn(`No buffer for display ${display.id}`);
        }
      } catch (err) {
        console.error(`Failed to capture display ${display.id}:`, err.message);
      }
    }

    if (!buffers.length) throw new Error("No valid screenshots captured");

    const totalWidth = dimensions.reduce((sum, d) => sum + d.width, 0);
    const maxHeight = Math.max(...dimensions.map(d => d.height));

    const mergedPath = path.join(os.tmpdir(), `merged-screen-${Date.now()}.jpg`);
    await sharp({
      create: {
        width: totalWidth,
        height: maxHeight,
        channels: 3,
        background: "black",
      },
    })
      .composite(
        buffers.map((buf, i) => ({
          input: buf,
          top: 0,
          left: dimensions.slice(0, i).reduce((sum, d) => sum + d.width, 0),
        }))
      )
      .jpeg()
      .toFile(mergedPath);

    // Upload to server
    const form = new FormData();
    form.append("image", fs.createReadStream(mergedPath));

    const res = await axios.post(
      "http://51.20.198.23:5003/api/V1/auth/screenshotupload",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ Screenshot uploaded successfully [${res.status}]`);

    fs.unlinkSync(mergedPath);

  } catch (err) {
    console.error("❌ Upload failed:", err.message);
  }
}
