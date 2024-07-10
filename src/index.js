// Example implementation of cross-os-wifi-manager

const os = require('os');
const path = require('path');

let wifiManager;

switch (os.platform()) {
  case 'linux':
    wifiManager = require('./linux/wifiManager');
    break;
  case 'win32':
    wifiManager = require('./windows/wifiManager');
    break;
  case 'darwin':
    wifiManager = require('./macos/wifiManager');
    break;
  default:
    throw new Error('Unsupported OS');
}

module.exports = wifiManager;
