import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Zap, Play, Square, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTodo } from '@/contexts/TodoContext';

interface TabbiePageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings' | 'notes') => void;
}

interface TabbieStatus {
  status: string;
  animation: string;
  task: string;
  uptime: number;
  connectedDevices: number;
  ip: string;
}

const TABBIE_IP = "192.168.4.1";

const TabbiePage: React.FC<TabbiePageProps> = ({ onPageChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tabbieStatus, setTabbieStatus] = useState<TabbieStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const [customIP, setCustomIP] = useState(TABBIE_IP);
  const { userData, pomodoroTimer } = useTodo();

  // Auto-connect on component mount
  useEffect(() => {
    checkConnection();
    
    // Set up periodic status updates when connected
    const interval = setInterval(() => {
      if (isConnected) {
        updateStatus();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isConnected]);

  // Monitor pomodoro state changes and sync with Tabbie
  useEffect(() => {
    if (isConnected && pomodoroTimer.isRunning) {
      const currentTask = userData.tasks.find(t => t.id === pomodoroTimer.currentTaskId);
      sendAnimation('pomodoro', currentTask?.title || 'Focus Session');
    } else if (isConnected && !pomodoroTimer.isRunning) {
      sendAnimation('idle');
    }
  }, [pomodoroTimer.isRunning, pomodoroTimer.currentTaskId, isConnected]);

  const checkConnection = async () => {
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      const response = await fetch(`http://${customIP}/api/status`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        const status = await response.json();
        setTabbieStatus(status);
        setIsConnected(true);
        setConnectionError('');
      } else {
        throw new Error('Failed to connect to Tabbie');
      }
    } catch (error) {
      setIsConnected(false);
      setTabbieStatus(null);
      setConnectionError('Cannot connect to Tabbie. Make sure you\'re connected to "Tabbie-Assistant" WiFi network.');
    } finally {
      setIsConnecting(false);
    }
  };

  const updateStatus = async () => {
    if (!isConnected) return;
    
    try {
      const response = await fetch(`http://${customIP}/api/status`);
      if (response.ok) {
        const status = await response.json();
        setTabbieStatus(status);
      }
    } catch (error) {
      // Connection lost
      setIsConnected(false);
      setTabbieStatus(null);
      setConnectionError('Connection to Tabbie lost');
    }
  };

  const sendAnimation = async (animation: string, task?: string) => {
    if (!isConnected) return;
    
    try {
      const response = await fetch(`http://${customIP}/api/animation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animation: animation,
          task: task || ''
        }),
      });
      
      if (response.ok) {
        // Update status to reflect the change
        setTimeout(updateStatus, 500);
      }
    } catch (error) {
      console.error('Failed to send animation:', error);
    }
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WifiOff className="h-5 w-5" />
                  Connect to Tabbie
                </CardTitle>
                <CardDescription>
                  Follow these steps to connect to your Tabbie device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Connection Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Make sure your Tabbie device is powered on</li>
                    <li>Connect to WiFi network: <strong>"Tabbie-Assistant"</strong></li>
                    <li>Password: <strong>"tabbie123"</strong></li>
                    <li>Click "Connect" below</li>
                  </ol>
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
                    placeholder="Tabbie IP Address"
                    value={customIP}
                    onChange={(e) => setCustomIP(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={checkConnection} disabled={isConnecting}>
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Section */}
          {isConnected && tabbieStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <div className="font-semibold">{formatUptime(tabbieStatus.uptime)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Connected Devices</div>
                    <div className="font-semibold">{tabbieStatus.connectedDevices}</div>
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

          {/* Quick Actions */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Test different animations and states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => sendAnimation('idle')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <div className="text-2xl">💤</div>
                    <span>Idle</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sendAnimation('pomodoro', 'Test Focus Session')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <div className="text-2xl">🍅</div>
                    <span>Focus</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sendAnimation('complete', 'Task Completed!')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <div className="text-2xl">✅</div>
                    <span>Complete</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`http://${customIP}`, '_blank')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <div className="text-2xl">🌐</div>
                    <span>Web UI</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration Info */}
          <Card>
            <CardHeader>
              <CardTitle>🔗 Dashboard Integration</CardTitle>
              <CardDescription>
                Tabbie automatically syncs with your productivity workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Play className="h-4 w-4 text-green-500" />
                  <span className="text-sm">When you start a Pomodoro timer, Tabbie shows focus animation</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Task completions trigger celebration animations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Square className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Idle time shows a peaceful waiting state</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default TabbiePage;
