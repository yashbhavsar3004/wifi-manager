const execSync = require('child_process').execSync;
const fs = require('fs');
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');

const profileFilename = path.join(os.tmpdir(), 'nodeWifiConnect.xml');

module.exports = {
  getAllNearbyConnections: () => {
    return new Promise((resolve, reject) => {
      try {
        const result = execSync('netsh wlan show networks mode=bssid').toString();
        const networks = [];
        console.log('Result :- ' + result);
  
        const lines = result.split('\n');
        let currentNetwork = null;
  
        lines.forEach(line => {
          line = line.trim();
  
          if (line.startsWith('SSID ')) {
            if (currentNetwork) {
              networks.push(currentNetwork);
            }
            currentNetwork = { ssid: line.split(' : ')[1]?.trim() };
          } else if (line.startsWith('BSSID ') && currentNetwork) {
            currentNetwork.bssid = line.split(' : ')[1]?.trim();
            currentNetwork.mac = currentNetwork.bssid;
          } else if (line.startsWith('Signal') && currentNetwork) {
            currentNetwork.signal_level = parseInt(line.split(' : ')[1]?.replace('%', '').trim());
            currentNetwork.quality = currentNetwork.signal_level;
          } else if (line.startsWith('Channel') && currentNetwork) {
            currentNetwork.channel = parseInt(line.split(' : ')[1]?.trim());
          } else if (line.startsWith('Frequency') && currentNetwork) {
            currentNetwork.frequency = parseInt(line.split(' : ')[1]?.trim());
          } else if (line.startsWith('Authentication') && currentNetwork) {
            currentNetwork.security = line.split(' : ')[1]?.trim();
          } else if (line.startsWith('Encryption') && currentNetwork) {
            currentNetwork.security_flags = line.split(' : ')[1]?.trim();
          } else if (line.startsWith('Network type') && currentNetwork) {
            currentNetwork.mode = line.split(' : ')[1]?.trim();
          }
        });
  
        // Push the last network if it exists
        if (currentNetwork) {
          networks.push(currentNetwork);
        }
  
        resolve(networks);
      } catch (error) {
        reject(new Error('Failed to get nearby connections on Windows: ' + error.message));
      }
    });
  }
  
  
  
  ,
  getConnectedWiFiInfo: () => {
    return new Promise((resolve, reject) => {
      try {
        const result = execSync('netsh wlan show interfaces').toString();
        const lines = result.split('\n');
        let wifiInfo = {};

        lines.forEach(line => {
          line = line.trim();
          if (line.startsWith('Name')) {
            wifiInfo.name = line.split(':')[1]?.trim();
          } else if (line.startsWith('Description')) {
            wifiInfo.description = line.split(':')[1]?.trim();
          } else if (line.startsWith('GUID')) {
            wifiInfo.guid = line.split(':')[1]?.trim();
          } else if (line.startsWith('Physical address')) {
            wifiInfo.physical_address = line.split(':')[1]?.trim();
          } else if (line.startsWith('Interface type')) {
            wifiInfo.interface_type = line.split(':')[1]?.trim();
          } else if (line.startsWith('State')) {
            wifiInfo.state = line.split(':')[1]?.trim();
          } else if (line.startsWith('SSID')) {
            wifiInfo.ssid = line.split(':')[1]?.trim();
          } else if (line.startsWith('BSSID')) {
            wifiInfo.bssid = line.split(':')[1]?.trim();
          } else if (line.startsWith('Network type')) {
            wifiInfo.network_type = line.split(':')[1]?.trim();
          } else if (line.startsWith('Radio type')) {
            wifiInfo.radio_type = line.split(':')[1]?.trim();
          } else if (line.startsWith('Authentication')) {
            wifiInfo.authentication = line.split(':')[1]?.trim();
          } else if (line.startsWith('Cipher')) {
            wifiInfo.cipher = line.split(':')[1]?.trim();
          } else if (line.startsWith('Connection mode')) {
            wifiInfo.connection_mode = line.split(':')[1]?.trim();
          } else if (line.startsWith('Band')) {
            wifiInfo.band = line.split(':')[1]?.trim();
          } else if (line.startsWith('Channel')) {
            wifiInfo.channel = line.split(':')[1]?.trim();
          } else if (line.startsWith('Receive rate (Mbps)')) {
            wifiInfo.receive_rate = line.split(':')[1]?.trim();
          } else if (line.startsWith('Transmit rate (Mbps)')) {
            wifiInfo.transmit_rate = line.split(':')[1]?.trim();
          } else if (line.startsWith('Signal')) {
            wifiInfo.signal = line.split(':')[1]?.trim();
          } else if (line.startsWith('Profile')) {
            wifiInfo.profile = line.split(':')[1]?.trim();
          }
        });

        if (Object.keys(wifiInfo).length > 0) {
          resolve(wifiInfo);
        } else {
          reject(new Error('No connected WiFi'));
        }
      } catch (error) {
        reject(new Error('Failed to get connected WiFi info on Windows: ' + error.message));
      }
    });
  },
  execCommand(cmd, params) {
    return new Promise((resolve, reject) => {
      execFile(cmd, params, (err, stdout, stderr) => {
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          reject(err);
        } else {
          resolve(stdout);
        }
      });
    });
  },

 checkProfileExists(ap, password) {
  try {
    const existingProfile = fs.readFileSync(profileFilename, 'utf-8');
    const expectedProfile = win32WirelessProfileBuilder(ap, password);
    return existingProfile === expectedProfile;
  } catch (error) {
    return false; // File doesn't exist or couldn't be read
  }
},
  connect: (ap, password) => {
    return new Promise((resolve, reject) => {
      module.exports.getAllNearbyConnections()
        .then(networks => {
          const selectedAp = networks.find(network => {
            return network.ssid === ap;
          });
  
          if (!selectedAp) {
            throw new Error('SSID not found in nearby connections');
          }
  
          if (module.exports.checkProfileExists(selectedAp, password)) {
            console.log('WiFi profile already exists. Skipping profile creation.');
            resolve('Already connected to WiFi');
            return;
          }
  
          fs.writeFileSync(
            profileFilename,
            module.exports.win32WirelessProfileBuilder(selectedAp, password)
          );
  
          return module.exports.execCommand('netsh', [
            'wlan',
            'add',
            'profile',
            `filename=${profileFilename}`
          ]);
        })
        .then(() => {
          return module.exports.execCommand('netsh', [
            'wlan',
            'connect',
            `name="${ap}"`
            
          ]);
        })
        .then(() => {
          resolve('Connected to WiFi successfully');
        })
        .catch(err => {
          reject(new Error('Failed to connect to WiFi: ' + err.message));
        }).
        finally(() => {
          try {
            if (fs.existsSync(profileFilename)) {
              fs.unlinkSync(profileFilename); // Delete the temporary XML profile file
            } else {
              console.error('Profile file does not exist:', profileFilename);
            }
          } catch (error) {
            console.error('Failed to delete profile file:', error.message);
          }
        });
    });
  },
   win32WirelessProfileBuilder(ap, password) {
    let profile_content = `<?xml version="1.0"?> <WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1"> <name>${
      ap.ssid
    }</name> <SSIDConfig> <SSID> <hex>${module.exports.getHexSsid(
      ap.ssid
    )}</hex> <name>${ap.ssid}</name> </SSID> </SSIDConfig>`;
  
    if (ap.security.includes('WPA2')) {
      profile_content += `<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>WPA2PSK</authentication> <encryption>AES</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>passPhrase</keyType> <protected>false</protected> <keyMaterial>${password}</keyMaterial> </sharedKey> </security> </MSM>`;
    } else if (ap.security.includes('WPA')) {
      profile_content += `<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>WPAPSK</authentication> <encryption>TKIP</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>passPhrase</keyType> <protected>false</protected> <keyMaterial>${password}</keyMaterial> </sharedKey> </security> </MSM>`;
    } else {
      if (ap.security_flags.includes('WEP')) {
        profile_content += `<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>open</authentication> <encryption>WEP</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>networkKey</keyType> <protected>false</protected> <keyMaterial>${password}</keyMaterial> </sharedKey> </security> </MSM>`;
      } else {
        profile_content +=
          '<connectionType>ESS</connectionType> <connectionMode>manual</connectionMode> <MSM> <security> <authEncryption> <authentication>open</authentication> <encryption>none</encryption> <useOneX>false</useOneX> </authEncryption> </security> </MSM>';
      }
    }
  
    profile_content += '</WLANProfile>';
    return profile_content;
  }
  ,
   getHexSsid(plainTextSsid) {
    let hex = '';
    for (let i = 0; i < plainTextSsid.length; ++i) {
      hex += plainTextSsid.charCodeAt(i).toString(16);
    }
    return hex;
  }
  
,
  updatePassword: (ssid, newPassword) => {
    try {
      execSync(`netsh wlan set profileparameter name="${ssid}" keyMaterial="${newPassword}"`);
      return 'Password updated successfully';
    } catch (error) {
      throw new Error('Failed to update WiFi password on Windows');
    }
  },
  forgetWiFi: (ssid) => {
    try {
      execSync(`netsh wlan delete profile name="${ssid}"`);
      return 'WiFi forgotten successfully';
    } catch (error) {
      throw new Error('Failed to forget WiFi on Windows');
    }
  },
  disconnectWiFi: () => {
    try {
      execSync('netsh wlan disconnect');
      return 'WiFi disconnected successfully';
    } catch (error) {
      throw new Error('Failed to disconnect WiFi on Windows');
    }
  }
};
