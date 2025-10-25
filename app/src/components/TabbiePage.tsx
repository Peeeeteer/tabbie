import React from 'react';
import { Wifi, WifiOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTabbieSync } from '@/contexts/TabbieContext';

interface TabbiePageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings' | 'notes') => void;
  theme?: 'clean' | 'retro';
}

const TabbiePage: React.FC<TabbiePageProps> = ({ onPageChange, theme = 'clean' }) => {
  const { 
    isConnected, 
    isConnecting, 
    tabbieStatus, 
    connectionError, 
    customIP, 
    checkConnection, 
    setCustomIP: setCustomIPContext,
    activityState 
  } = useTabbieSync();

  // Local state for IP input field
  const [localIP, setLocalIP] = React.useState(customIP);

  // Sync local IP with context when customIP changes
  React.useEffect(() => {
    setLocalIP(customIP);
  }, [customIP]);

  const handleSetIP = () => {
    setCustomIPContext(localIP);
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🤖 Tabbie Assistant
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
              </h1>
              <p className="text-muted-foreground">
                {isConnected ? 'Connected and ready' : 'Connect to your Tabbie device'}
              </p>
            </div>
            <Button 
              onClick={checkConnection} 
              disabled={isConnecting}
              variant={isConnected ? "outline" : "default"}
            >
              {isConnecting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isConnecting ? 'Connecting...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          
          {/* Connection Section */}
          {!isConnected && (
            <Card className={
              theme === 'retro'
                ? "bg-[#ffd4f4]/30 dark:bg-[#ff69b4]/10 border-2 border-black dark:border-white rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]"
                : ""
            }>
              <CardHeader>
                <CardTitle className={theme === 'retro' ? "flex items-center gap-2 font-bold text-foreground" : "flex items-center gap-2"}>
                  <WifiOff className="h-5 w-5" />
                  Connect to Tabbie
                </CardTitle>
                <CardDescription className={theme === 'retro' ? "text-muted-foreground font-medium" : ""}>
                  Follow these steps to connect to your Tabbie device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Connection Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Make sure your Tabbie device is powered on</li>
                    <li className="pl-4">
                      <strong>First time setup?</strong> Configure WiFi first:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs text-muted-foreground">
                        <li>Connect to "Tabbie-Setup" WiFi network on your computer</li>
                        <li>Visit <code className="bg-muted px-1 rounded">tabbie.local</code> or <code className="bg-muted px-1 rounded">192.168.4.1</code> in your browser</li>
                        <li>Choose your home WiFi network and enter password</li>
                        <li>Wait for Tabbie to connect and reconnect your computer to home WiFi</li>
                      </ul>
                    </li>
                    <li>Ensure Tabbie is connected to your WiFi network (check OLED display)</li>
                    <li>Both your computer and Tabbie should be on the same network</li>
                    <li>Click "Connect" below</li>
                  </ol>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Troubleshooting
                  </h4>
                  <div className="text-sm space-y-2">
                    <div><strong>OLED shows "Something went wrong!"?</strong></div>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-muted-foreground">
                      <li>WiFi password might be incorrect</li>
                      <li>WiFi network might be out of range</li>
                      <li>Follow the setup steps shown on Tabbie's screen</li>
                    </ul>
                    <div className="mt-3"><strong>Can't find "Tabbie-Setup" network?</strong></div>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-muted-foreground">
                      <li>Check if Tabbie's OLED shows setup instructions</li>
                      <li>Try restarting Tabbie by unplugging and plugging back in</li>
                      <li>Look for the network in your WiFi settings</li>
                    </ul>
                  </div>
                </div>

                {connectionError && (
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {connectionError}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Tabbie Address (tabbie.local)"
                    value={localIP}
                    onChange={(e) => setLocalIP(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSetIP();
                        checkConnection();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={() => {
                    handleSetIP();
                    checkConnection();
                  }} disabled={isConnecting}>
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Section */}
          {isConnected && tabbieStatus && (
            <Card className={
              theme === 'retro'
                ? "bg-[#96f2d7]/30 dark:bg-[#00e5a0]/10 border-2 border-black dark:border-white rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]"
                : ""
            }>
              <CardHeader>
                <CardTitle className={theme === 'retro' ? "flex items-center gap-2 font-bold text-foreground" : "flex items-center gap-2"}>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Tabbie Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current State</div>
                    <div className="font-semibold capitalize">{tabbieStatus.animation}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Activity Sync</div>
                    <div className="font-semibold capitalize flex items-center gap-1">
                      {activityState === 'pomodoro' && <span className="text-red-500">🍅 Focus</span>}
                      {activityState === 'break' && <span className="text-green-500">☕ Break</span>}
                      {activityState === 'complete' && <span className="text-blue-500">✅ Complete</span>}
                      {activityState === 'idle' && <span className="text-gray-500">💤 Idle</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <div className="font-semibold">{formatUptime(tabbieStatus.uptime)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">IP Address</div>
                    <div className="font-semibold">{tabbieStatus.ip}</div>
                  </div>
                </div>

                {tabbieStatus.task && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-sm text-muted-foreground">Current Task</div>
                    <div className="font-semibold">{tabbieStatus.task}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};

export default TabbiePage;
