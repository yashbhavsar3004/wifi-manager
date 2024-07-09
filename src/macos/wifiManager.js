const execSync = require('child_process').execSync;

module.exports = {
  getAllNearbyConnections: () => {
    try {
      const result = execSync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s').toString();
      const lines = result.split('\n').slice(1);
      const networks = lines.map(line => {
        const [ssid, bssid, rssi, channel, ...rest] = line.trim().split(/\s+/);
        const frequency = 2412 + (channel - 1) * 5; // Approximate frequency for 2.4 GHz channels
        const signal_level = parseInt(rssi);
        const quality = (signal_level + 100) * 2; // Convert dB to percentage
        const security = rest.join(' ').trim();

        return {
          ssid,
          bssid,
          mac: bssid,
          channel: parseInt(channel),
          frequency,
          signal_level,
          quality,
          security,
          security_flags: security,
          mode: 'Infrastructure'
        };
      }).filter(network => network.ssid);
      return networks;
    } catch (error) {
      throw new Error('Failed to get nearby connections on macOS');
    }
  },
  getConnectedWiFiInfo: () => {
    try {
      const result = execSync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I').toString();
      const ssidMatch = result.match(/ SSID: (.+)/);
      const bssidMatch = result.match(/ BSSID: (.+)/);
      const rssiMatch = result.match(/ agrCtlRSSI: (-\d+)/);
      const channelMatch = result.match(/ channel: (\d+)/);

      if (ssidMatch && bssidMatch && rssiMatch && channelMatch) {
        const ssid = ssidMatch[1].trim();
        const bssid = bssidMatch[1].trim();
        const signal_level = parseInt(rssiMatch[1]);
        const channel = parseInt(channelMatch[1]);
        const frequency = 2412 + (channel - 1) * 5; // Approximate frequency for 2.4 GHz channels
        const quality = (signal_level + 100) * 2; // Convert dB to percentage
        const security = 'WPA/WPA2'; // Placeholder, as macOS does not provide detailed security info

        return {
          ssid,
          bssid,
          mac: bssid,
          channel,
          frequency,
          signal_level,
          quality,
          security,
          security_flags: security,
          mode: 'Infrastructure'
        };
      }

      throw new Error('No connected WiFi');
    } catch (error) {
      throw new Error('Failed to get connected WiFi info on macOS');
    }
  },
  connect: (ssid, password) => {
    try {
      execSync(`networksetup -setairportnetwork en0 "${ssid}" "${password}"`);
      return 'Connected successfully';
    } catch (error) {
      throw new Error('Failed to connect to WiFi on macOS');
    }
  },
  updatePassword: (ssid, newPassword) => {
    try {
      execSync(`networksetup -setairportnetwork en0 "${ssid}" "${newPassword}"`);
      return 'Password updated successfully';
    } catch (error) {
      throw new Error('Failed to update WiFi password on macOS');
    }
  },
  forgetWiFi: (ssid) => {
    try {
      execSync(`networksetup -removepreferredwirelessnetwork en0 "${ssid}"`);
      return 'WiFi forgotten successfully';
    } catch (error) {
      throw new Error('Failed to forget WiFi on macOS');
    }
  },
  disconnectWiFi: () => {
    try {
      execSync('networksetup -setairportpower en0 off');
      return 'WiFi disconnected successfully';
    } catch (error) {
      throw new Error('Failed to disconnect WiFi on macOS');
    }
  }
};
