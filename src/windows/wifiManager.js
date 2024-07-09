const execSync = require('child_process').execSync;

module.exports = {
  getAllNearbyConnections: () => {
    try {
      const result = execSync('netsh wlan show networks mode=bssid').toString();
      const networks = [];
      const ssids = result.match(/SSID \d+ : (.+)/g);
      const bssids = result.match(/BSSID \d+ : (.+)/g);
      const signalLevels = result.match(/Signal\s*:\s*(\d+)%/g);
      const frequencies = result.match(/Frequency\s*:\s*(\d+)/g);
      const channels = result.match(/Channel\s*:\s*(\d+)/g);
      const securityTypes = result.match(/Authentication\s*:\s*(.+)/g);

      for (let i = 0; i < ssids.length; i++) {
        const ssid = ssids[i].replace(/SSID \d+ : /, '').trim();
        const bssid = bssids[i].replace(/BSSID \d+ : /, '').trim();
        const signal = parseInt(signalLevels[i].replace(/Signal\s*:\s*/, '').replace('%', '').trim());
        const frequency = parseInt(frequencies[i].replace(/Frequency\s*:\s*/, '').trim());
        const channel = parseInt(channels[i].replace(/Channel\s*:\s*/, '').trim());
        const security = securityTypes[i].replace(/Authentication\s*:\s*/, '').trim();
        const quality = signal;

        networks.push({
          ssid,
          bssid,
          mac: bssid,
          channel,
          frequency,
          signal_level: signal,
          quality,
          security,
          security_flags: security,
          mode: 'Infrastructure'
        });
      }

      return networks;
    } catch (error) {
      throw new Error('Failed to get nearby connections on Windows');
    }
  },
  getConnectedWiFiInfo: () => {
    try {
      const result = execSync('netsh wlan show interfaces').toString();
      const ssidMatch = result.match(/SSID\s*:\s*(.+)\s+/);
      const bssidMatch = result.match(/BSSID\s*:\s*(.+)\s+/);
      const signalMatch = result.match(/Signal\s*:\s*(\d+)%/);
      const frequencyMatch = result.match(/Frequency\s*:\s*(\d+)/);
      const channelMatch = result.match(/Channel\s*:\s*(\d+)/);
      const securityMatch = result.match(/Authentication\s*:\s*(.+)/);

      if (ssidMatch && bssidMatch && signalMatch && frequencyMatch && channelMatch && securityMatch) {
        const ssid = ssidMatch[1].trim();
        const bssid = bssidMatch[1].trim();
        const signal = parseInt(signalMatch[1]);
        const frequency = parseInt(frequencyMatch[1]);
        const channel = parseInt(channelMatch[1]);
        const security = securityMatch[1].trim();

        return {
          ssid,
          bssid,
          mac: bssid,
          channel,
          frequency,
          signal_level: signal,
          quality: signal,
          security,
          security_flags: security,
          mode: 'Infrastructure'
        };
      }

      throw new Error('No connected WiFi');
    } catch (error) {
      throw new Error('Failed to get connected WiFi info on Windows');
    }
  },
  connect: (ssid, password) => {
    try {
      execSync(`netsh wlan connect name="${ssid}" ssid="${ssid}" key="${password}"`);
      return 'Connected successfully';
    } catch (error) {
      throw new Error('Failed to connect to WiFi on Windows');
    }
  },
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
