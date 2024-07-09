const os = require('os');

let wifiManager;

switch (os.platform()) {
  case 'linux':
    wifiManager = require('./src/linux/wifiManager');
    break;
  case 'win32':
    wifiManager = require('./src/windows/wifiManager');
    break;
  case 'darwin':
    wifiManager = require('./src/macos/wifiManager');
    break;
  default:
    throw new Error('Unsupported OS');
}

module.exports = wifiManager;
