import React from 'react';
import { Button } from "@/components/ui/button";

interface YourTabbiePageProps {
  currentFace: string;
  isLoading: boolean;
  esp32Connected: boolean;
  esp32URL: string;
  isScanning: boolean;
  isReconnecting: boolean;
  isHealthChecking: boolean;
  logs: string[];
  logsLoading: boolean;
  handleFaceChange: (faceType: string) => void;
  handleReconnect: () => void;
  fetchLogs: () => void;
  handleManualIP?: (ip: string) => void;
}

const YourTabbiePage: React.FC<YourTabbiePageProps> = ({
  currentFace,
  isLoading,
  esp32Connected,
  esp32URL,
  isScanning,
  isReconnecting,
  isHealthChecking,
  logs,
  logsLoading,
  handleFaceChange,
  handleReconnect,
  fetchLogs,
  handleManualIP,
}) => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🤖 Your Tabbie</h1>
        <p className="text-muted-foreground">Monitor and control your Tabbie hardware assistant</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Face Control Section */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Face Control</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Current Face:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
              {currentFace === "default" ? "📝 Default Text" : 
               currentFace === "focus" ? "🎯 Focus Mode" : currentFace}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <Button 
              onClick={() => handleFaceChange("default")}
              disabled={isLoading}
              variant={currentFace === "default" ? "default" : "outline"}
              className="flex flex-col items-center gap-2 h-20"
            >
              <span className="text-2xl">📝</span>
              <span className="text-sm">Default</span>
            </Button>
            <Button 
              onClick={() => handleFaceChange("focus")}
              disabled={isLoading}
              variant={currentFace === "focus" ? "default" : "outline"}
              className="flex flex-col items-center gap-2 h-20 bg-purple-100 hover:bg-purple-200 text-purple-800"
            >
              <span className="text-2xl">🎯</span>
              <span className="text-sm">Focus</span>
            </Button>
          </div>
        </div>

        {/* Connection Status Section */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full ${
                esp32Connected 
                  ? (isHealthChecking ? 'bg-blue-500 animate-pulse' : 'bg-green-500')
                  : (isScanning || isReconnecting)
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-red-500'
              }`} />
              <div>
                <div className="text-sm font-medium">
                  Status: {
                    esp32Connected 
                      ? (isHealthChecking ? 'Checking...' : 'Connected')
                      : isReconnecting
                        ? 'Reconnecting...'
                        : isScanning 
                          ? 'Scanning...' 
                          : 'Disconnected'
                  }
                </div>
                <div className="text-xs text-muted-foreground">
                  ESP32: {esp32URL || 
                    (isReconnecting ? "Attempting to reconnect..." : 
                     isScanning ? "Scanning network..." : 
                     "Not found - try Manual IP: 192.168.0.113")}
                </div>
              </div>
            </div>
            {!esp32Connected && !isScanning && !isReconnecting && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleReconnect}
                  variant="outline"
                  size="sm"
                >
                  🔄 Reconnect
                </Button>
                {handleManualIP && (
                  <Button 
                    onClick={() => {
                      const ip = prompt('Enter ESP32 IP address (e.g., 192.168.0.113):');
                      if (ip) {
                        handleManualIP(ip);
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    📝 Manual IP
                  </Button>
                )}
                {esp32Connected && esp32URL && (
                  <Button 
                    onClick={async () => {
                      try {
                        await fetch(`${esp32URL}/face/default`);
                        alert('Connection status shown on ESP32 display');
                      } catch (error) {
                        alert('Could not communicate with ESP32');
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    📺 Show Status
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Connection Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Device Type</span>
              <span className="font-medium">ESP32 Tabbie Assistant</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Communication</span>
              <span className="font-medium">Wi-Fi Local Network</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Protocol</span>
              <span className="font-medium">HTTP API</span>
            </div>
          </div>

          {/* Setup Instructions */}
          {!esp32Connected && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">🔧 Setup Instructions</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>1. Make sure ESP32 is powered on and connected via USB</div>
                <div>2. Check ESP32 OLED display for WiFi connection status</div>
                <div>3. If WiFi fails, update .env file with correct credentials</div>
                <div>4. Upload code: <code className="bg-blue-100 px-1 rounded">pio run --target upload</code></div>
                <div>5. Use "Manual IP" button and enter IP from OLED display</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Serial Monitor - Full Width */}
      <div className="mt-6 bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Serial Monitor</h2>
          <Button 
            onClick={fetchLogs} 
            disabled={logsLoading}
            variant="ghost" 
            size="sm"
          >
            {logsLoading ? "Loading..." : "↻ Refresh Logs"}
          </Button>
        </div>
        
        <div className="h-80 overflow-y-auto bg-slate-950 text-slate-100 p-4 rounded-lg">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1 leading-relaxed">
                <span className="text-slate-400 mr-2">›</span>
                <span className={
                  log.includes("WiFi Connected Successfully") || log.includes("Web server started") 
                    ? "text-green-400" 
                    : log.includes("Happy face") || log.includes("Default animation")
                    ? "text-blue-400"
                    : log.includes("Sad face")
                    ? "text-orange-400"
                    : log.includes("Focus face")
                    ? "text-purple-400"
                    : log.includes("Failed") || log.includes("Error") || log.includes("❌")
                    ? "text-red-400"
                    : log.includes("✅")
                    ? "text-green-400"
                    : "text-slate-300"
                }>
                  {log}
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-sm font-mono flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mb-2 text-2xl">📡</div>
                <div>Waiting for ESP32 logs...</div>
                <div className="text-xs mt-2">Make sure your Tabbie is powered on and connected</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YourTabbiePage; 

