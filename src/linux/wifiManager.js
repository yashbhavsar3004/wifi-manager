const execSync = require('child_process').execSync;

module.exports = {
  getAllNearbyConnections: () => {
    try {
      const result = execSync('nmcli -t -f SSID,BSSID,FREQ,SIGNAL,SECURITY dev wifi').toString();
      return result.split('\n').filter(line => line).map(line => {
        const [ssid, bssid, frequency, signal, security] = line.split(':');
        const quality = parseInt(signal); // Signal quality in percentage
        return { ssid, bssid, mac: bssid, frequency: parseInt(frequency), signal_level: parseInt(signal), quality, security, security_flags: security, mode: 'Infrastructure' };
      });
    } catch (error) {
      throw new Error('Failed to get nearby connections on Linux');
    }
  },
  getConnectedWiFiInfo: () => {
    try {
      const result = execSync('nmcli -t -f active,ssid,bssid,freq,signal,security dev wifi | grep yes').toString();
      const [active, ssid, bssid, frequency, signal, security] = result.split(':');
      return { active: active === 'yes', ssid, bssid, mac: bssid, frequency: parseInt(frequency), signal_level: parseInt(signal), quality: parseInt(signal), security, security_flags: security, mode: 'Infrastructure' };
    } catch (error) {
      throw new Error('Failed to get connected WiFi info on Linux');
    }
  },
  connect: (ssid, password) => {
    try {
      execSync(`nmcli dev wifi connect "${ssid}" password "${password}"`);
      return 'Connected successfully';
    } catch (error) {
      throw new Error('Failed to connect to WiFi on Linux');
    }
  },
  updatePassword: (ssid, newPassword) => {
    try {
      execSync(`nmcli connection modify "${ssid}" wifi-sec.key-mgmt wpa-psk wifi-sec.psk "${newPassword}"`);
      return 'Password updated successfully';
    } catch (error) {
      throw new Error('Failed to update WiFi password on Linux');
    }
  },
  forgetWiFi: (ssid) => {
    try {
      execSync(`nmcli connection delete "${ssid}"`);
      return 'WiFi forgotten successfully';
    } catch (error) {
      throw new Error('Failed to forget WiFi on Linux');
    }
  },
  disconnectWiFi: () => {
    try {
      execSync('nmcli radio wifi off');
      return 'WiFi disconnected successfully';
    } catch (error) {
      throw new Error('Failed to disconnect WiFi on Linux');
    }
  }
};
