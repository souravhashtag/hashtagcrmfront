const screenshot = require('screenshot-desktop');
const fs = require('fs');
const path = require('path');
const os = require('os');

setInterval(async () => {
  try {
    const imgBuffer = await screenshot();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(os.homedir(), 'Desktop', `screenshot-${timestamp}.jpg`);

    fs.writeFileSync(filePath, imgBuffer);
    console.log('Screenshot saved at:', filePath);
  } catch (e) {
    console.error('Screenshot error:', e);
  }
}, 5000); 
