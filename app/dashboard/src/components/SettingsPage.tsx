import React from 'react';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bell, Clock, Moon, Sun, Volume2, Wifi } from 'lucide-react';

interface SettingsPageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onPageChange }) => {
  const [notifications, setNotifications] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [autoConnect, setAutoConnect] = React.useState(false);
  const [pomodoroReminders, setPomodoroReminders] = React.useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your preferences and app behavior</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          
          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how Tabbie looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark themes
                  </p>
                </div>
                <DarkModeToggle variant="switch" showIcon={true} />
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Push Notifications</label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for important events
                  </p>
                </div>
                <ToggleSwitch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  size="md"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Sound Alerts</label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications and timers
                  </p>
                </div>
                <ToggleSwitch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  size="md"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Pomodoro Reminders</label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded when pomodoro sessions end
                  </p>
                </div>
                <ToggleSwitch
                  checked={pomodoroReminders}
                  onCheckedChange={setPomodoroReminders}
                  size="md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Connection
              </CardTitle>
              <CardDescription>
                Manage device connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Auto-Connect</label>
                  <p className="text-sm text-muted-foreground">
                    Automatically connect to device on startup
                  </p>
                </div>
                <ToggleSwitch
                  checked={autoConnect}
                  onCheckedChange={setAutoConnect}
                  size="md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Toggle Switch Showcase */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Toggle Switch Examples
              </CardTitle>
              <CardDescription>
                Different sizes and states of toggle switches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Small Switch</span>
                    <ToggleSwitch checked={true} onCheckedChange={() => {}} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Medium Switch</span>
                    <ToggleSwitch checked={false} onCheckedChange={() => {}} size="md" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Large Switch</span>
                    <ToggleSwitch checked={true} onCheckedChange={() => {}} size="lg" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disabled (On)</span>
                    <ToggleSwitch checked={true} onCheckedChange={() => {}} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disabled (Off)</span>
                    <ToggleSwitch checked={false} onCheckedChange={() => {}} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Interactive</span>
                    <ToggleSwitch 
                      checked={notifications} 
                      onCheckedChange={setNotifications} 
                      size="md" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 