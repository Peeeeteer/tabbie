import React from 'react';
import { Wifi, WifiOff, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTabbieSync } from '@/contexts/TabbieContext';

interface TabbiePageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings' | 'notes') => void;
  theme?: 'clean' | 'retro';
}

const TabbiePage: React.FC<TabbiePageProps> = ({ theme = 'clean' }) => {
  const {
    isConnected,
    isConnecting,
    tabbieStatus,
    connectionError,
    customIP,
    checkConnection,
    setCustomIP: setCustomIPContext,
    activityState,
    disconnect
  } = useTabbieSync();

  const [localIP, setLocalIP] = React.useState(customIP);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleResetWiFi = async () => {
    if (!confirm('This will clear WiFi settings and restart Tabbie in setup mode. Continue?')) return;
    
    setIsResetting(true);
    try {
      await fetch(`http://${customIP}/api/reset`, { method: 'POST' });
      disconnect();
    } catch (e) {
      console.log('Reset sent, Tabbie is restarting...');
      disconnect();
    }
    setIsResetting(false);
  };

  React.useEffect(() => {
    setLocalIP(customIP);
  }, [customIP]);

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🤖 Tabbie
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
            {/* Only show refresh button when connected */}
            {isConnected && (
              <Button
                onClick={checkConnection}
                disabled={isConnecting}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Not Connected */}
        {!isConnected && (
          <Card className={theme === 'retro' ? "border-2 border-black rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]" : ""}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Connect to Tabbie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Simple instruction */}
              <p className="text-sm text-muted-foreground">
                Press the <strong>BOOT button</strong> on your Tabbie to see the IP address, then enter it below.
              </p>

              {/* Connection input */}
              <div className="flex gap-2">
                <Input
                  placeholder="tabbie.local or IP address"
                  value={localIP}
                  onChange={(e) => setLocalIP(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCustomIPContext(localIP);
                      checkConnection();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    setCustomIPContext(localIP);
                    checkConnection();
                  }} 
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>

              {/* Error message */}
              {connectionError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {connectionError}
                </p>
              )}

              {/* First time setup - collapsed by default */}
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  First time setup?
                </summary>
                <div className="mt-2 pl-4 border-l-2 border-muted space-y-1 text-muted-foreground">
                  <p>1. Connect to <strong>"Tabbie-Setup"</strong> WiFi</p>
                  <p>2. Open <strong>192.168.4.1</strong> in browser</p>
                  <p>3. Select your WiFi and enter password</p>
                  <p>4. Tabbie will connect and show its IP</p>
                </div>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Connected */}
        {isConnected && tabbieStatus && (
          <Card className={theme === 'retro' ? "border-2 border-black rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]" : ""}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Connected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">State</div>
                  <div className="font-medium">
                    {activityState === 'focus' && <span className="text-red-500">🍅 Focus</span>}
                    {activityState === 'break' && <span className="text-green-500">☕ Break</span>}
                    {activityState === 'complete' && <span className="text-blue-500">✅ Complete</span>}
                    {activityState === 'paused' && <span className="text-orange-500">⏸️ Paused</span>}
                    {activityState === 'idle' && <span className="text-gray-500">💤 Idle</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">IP</div>
                  <div className="font-medium font-mono text-sm">{tabbieStatus.ip}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="font-medium">{formatUptime(tabbieStatus.uptime)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Animation</div>
                  <div className="font-medium capitalize">{tabbieStatus.animation}</div>
                </div>
              </div>

              {tabbieStatus.task && (
                <div className="mt-4 p-2 bg-muted rounded text-sm">
                  <span className="text-muted-foreground">Task:</span> {tabbieStatus.task}
                </div>
              )}

              {/* Reset WiFi */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetWiFi}
                  disabled={isResetting}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {isResetting ? 'Resetting...' : 'Reset WiFi'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TabbiePage;
