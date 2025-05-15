const screenshot = require('screenshot-desktop');
const fs = require('fs');
const path = require('path');
const os = require('os');

setInterval(async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const desktopDir = path.join(os.homedir(), 'Desktop');

    // Ensure Desktop folder exists
    if (!fs.existsSync(desktopDir)) {
      fs.mkdirSync(desktopDir, { recursive: true });
    }

    const filePath = path.join(desktopDir, `screenshot-${timestamp}.jpg`);
    const imgBuffer = await screenshot();
    fs.writeFileSync(filePath, imgBuffer);

    console.log(' Screenshot saved at:', filePath);
  } catch (e) {
    console.error(' Screenshot error:', e);
  }
}, 5000);
