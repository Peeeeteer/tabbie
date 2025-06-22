import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SetupWizardProps {
  onComplete: (esp32URL: string) => void;
  currentESP32URL?: string; // If already connected, show status instead
  isConnected?: boolean;
}

export function SetupWizard({ onComplete, currentESP32URL, isConnected }: SetupWizardProps) {
  const [step, setStep] = useState<'wifi' | 'upload' | 'discover' | 'complete' | 'status'>('wifi');
  const [wifiCredentials, setWifiCredentials] = useState({ ssid: '', password: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredIP, setDiscoveredIP] = useState<string>('');
  const [setupLog, setSetupLog] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  // If already connected, start in status mode
  React.useEffect(() => {
    if (isConnected && currentESP32URL) {
      setStep('status');
      const ip = currentESP32URL.replace('http://', '');
      setDiscoveredIP(ip);
      fetchDeviceInfo();
    }
  }, [isConnected, currentESP32URL]);

  const fetchDeviceInfo = async () => {
    if (!currentESP32URL) return;
    
    try {
      const response = await fetch(`${currentESP32URL}/face/status`);
      const data = await response.json();
      setDeviceInfo(data);
    } catch (error) {
      console.log('Could not fetch device info:', error);
    }
  };

  const addLog = (message: string) => {
    setSetupLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleWifiSubmit = async () => {
    if (!wifiCredentials.ssid || !wifiCredentials.password) {
      addLog('❌ Please enter both WiFi name and password');
      return;
    }

    addLog('📝 WiFi credentials saved');
    setStep('upload');
    await uploadToESP32();
  };

  const uploadToESP32 = async () => {
    setIsUploading(true);
    addLog('📤 Uploading code to ESP32...');
    
    try {
      // Call our backend API to handle the upload
      const response = await fetch('/api/setup/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wifiCredentials)
      });

      if (response.ok) {
        addLog('✅ Successfully uploaded to ESP32!');
        setStep('discover');
        setTimeout(() => discoverESP32(), 3000); // Wait for ESP32 to boot
      } else {
        addLog('❌ Failed to upload to ESP32. Please check USB connection.');
      }
    } catch (error) {
      addLog('❌ Upload failed. Please ensure ESP32 is connected via USB.');
    } finally {
      setIsUploading(false);
    }
  };

  const discoverESP32 = async () => {
    setIsDiscovering(true);
    addLog('🔍 Discovering ESP32 on network...');
    
    try {
      const response = await fetch('/api/setup/discover');
      const data = await response.json();
      
      if (data.ip) {
        addLog(`✅ Found ESP32 at: ${data.ip}`);
        setDiscoveredIP(data.ip);
        setStep('complete');
      } else {
        addLog('❌ Could not find ESP32. Please check WiFi connection.');
      }
    } catch (error) {
      addLog('❌ Discovery failed. Please try manual setup.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleComplete = () => {
    onComplete(`http://${discoveredIP}`);
  };

  const handleManualIP = () => {
    const ip = prompt('Enter ESP32 IP address (check ESP32 display):');
    if (ip) {
      setDiscoveredIP(ip);
      setStep('complete');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          🤖 {step === 'status' ? 'Tabbie Device Status' : 'Tabbie Setup Wizard'}
        </h1>
        <p className="text-muted-foreground">
          {step === 'status' 
            ? 'Your ESP32 configuration and status' 
            : "Let's get your ESP32 connected!"
          }
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center space-x-4 mb-8">
        {[
          { key: 'wifi', label: 'WiFi Setup', icon: '📶' },
          { key: 'upload', label: 'Upload Code', icon: '📤' },
          { key: 'discover', label: 'Find ESP32', icon: '🔍' },
          { key: 'complete', label: 'Complete', icon: '✅' }
        ].map((s, index) => (
          <div 
            key={s.key}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              step === s.key ? 'bg-blue-100 text-blue-800' : 
              ['wifi', 'upload', 'discover', 'complete'].indexOf(step) > index ? 'bg-green-100 text-green-800' : 
              'bg-gray-100 text-gray-500'
            }`}
          >
            <span>{s.icon}</span>
            <span className="text-sm font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border p-6">
        {step === 'wifi' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📶 WiFi Configuration</h2>
            <p className="text-muted-foreground">
              Enter your WiFi credentials to connect your ESP32 to the network.
            </p>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">WiFi Network Name (SSID)</label>
                  <button
                    type="button"
                    onClick={() => {
                      // Open WiFi settings based on OS
                      const userAgent = navigator.userAgent;
                      if (userAgent.includes('Mac')) {
                        // macOS WiFi settings - try new format first, fallback to old
                        try {
                          window.open('x-apple.systempreferences:com.apple.Network-Settings.extension');
                        } catch {
                          window.open('x-apple.systempreferences:com.apple.preference.network?Wi-Fi');
                        }
                      } else if (userAgent.includes('Windows')) {
                        // Windows WiFi settings - multiple fallbacks
                        try {
                          // Try modern Windows 10/11 settings
                          window.open('ms-settings:network-wifi');
                        } catch {
                          try {
                            // Fallback to older Windows settings
                            window.open('ms-settings:network');
                          } catch {
                            // Last resort - control panel
                            alert('Please open Windows Settings → Network & Internet → Wi-Fi\nOr search "WiFi" in Start menu');
                          }
                        }
                      } else {
                        // Fallback - show help
                        alert('To find your WiFi name:\n• Mac: Apple Menu → System Settings → Wi-Fi\n• Windows: Settings → Network & Internet → Wi-Fi\n• Look for "Connected" network name');
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    🔍 Find my WiFi name
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="Your WiFi network name"
                  value={wifiCredentials.ssid}
                  onChange={(e) => setWifiCredentials(prev => ({ ...prev, ssid: e.target.value }))}
                />
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <div className="w-16 h-12 bg-blue-100 rounded border flex items-center justify-center text-xs text-blue-600 flex-shrink-0">
                      📶 WiFi<br/>Settings
                    </div>
                    <div className="text-xs text-blue-700">
                      <strong>Need help finding your WiFi name?</strong><br/>
                      • <strong>Mac:</strong> Apple Menu → System Preferences → Network → Wi-Fi<br/>
                      • <strong>Windows:</strong> Settings → Network & Internet → Wi-Fi<br/>
                      • Look for the network marked as "Connected"
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">WiFi Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Your WiFi password"
                    value={wifiCredentials.password}
                    onChange={(e) => setWifiCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                  >
                    {showPassword ? '🙈 Hide' : '👁️ Show'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Click "Show" to verify you typed it correctly
                </p>
              </div>
            </div>

            <Button onClick={handleWifiSubmit} className="w-full">
              Continue to Upload
            </Button>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold">📤 Uploading to ESP32</h2>
            <p className="text-muted-foreground">
              Make sure your ESP32 is connected via USB cable.
            </p>
            
            {isUploading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Uploading code...</span>
              </div>
            )}
          </div>
        )}

        {step === 'discover' && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold">🔍 Finding ESP32</h2>
            <p className="text-muted-foreground">
              Scanning network for your ESP32...
            </p>
            
            {isDiscovering && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Discovering ESP32...</span>
              </div>
            )}

            <Button onClick={handleManualIP} variant="outline">
              Enter IP Manually
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold">🎉 Setup Complete!</h2>
            <p className="text-muted-foreground">
              Your ESP32 is connected and ready to use.
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-medium text-green-800">ESP32 found at: {discoveredIP}</p>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Start Using Tabbie
            </Button>
          </div>
        )}

        {step === 'status' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">✅ ESP32 Connected</h2>
              <p className="text-muted-foreground">Your Tabbie is up and running!</p>
            </div>

            {/* Device Status Cards */}
            <div className="grid gap-4">
              {/* Connection Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800">Connection Status</h3>
                    <p className="text-sm text-green-700">
                      Connected at <span className="font-mono">{discoveredIP}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Face */}
              {deviceInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {deviceInfo.currentFace === 'focus' ? '🎯' : '📝'}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-800">Current Face</h3>
                      <p className="text-sm text-blue-700">
                        {deviceInfo.currentFace === 'focus' ? 'Focus Mode' : 'Default Text'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* WiFi Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📶</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-800">WiFi Connection</h3>
                    <p className="text-sm text-purple-700">
                      Connected to your network
                    </p>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🤖</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">Device Info</h3>
                    <p className="text-sm text-gray-700">
                      ESP32 with OLED display and LED matrix
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setStep('wifi');
                  setSetupLog([]);
                  setWifiCredentials({ ssid: '', password: '' });
                }}
                variant="outline" 
                className="flex-1"
              >
                🔧 Reconfigure WiFi
              </Button>
              <Button 
                onClick={() => onComplete(currentESP32URL || `http://${discoveredIP}`)}
                className="flex-1"
              >
                ✅ Done
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Setup Log */}
      {setupLog.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Setup Log:</h3>
          <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
            {setupLog.map((log, index) => (
              <div key={index} className="text-gray-600">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 