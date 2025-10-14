import React from 'react';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Bell, Clock, Moon, Sun, Volume2, Wifi, RotateCcw, Palette } from 'lucide-react';
import { useTodo } from '@/contexts/TodoContext';
import { updateSettings } from '@/utils/storage';

interface SettingsPageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings') => void;
  theme?: 'clean' | 'retro';
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onPageChange, theme = 'clean' }) => {
  const { userData } = useTodo();
  const [notifications, setNotifications] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [autoConnect, setAutoConnect] = React.useState(false);
  const [pomodoroReminders, setPomodoroReminders] = React.useState(true);
  const [selectedTheme, setSelectedTheme] = React.useState<'clean' | 'retro'>(
    userData.settings.theme || 'clean'
  );

  const handleResetOnboarding = () => {
    if (window.confirm('This will show the onboarding flow again. Continue?')) {
      // Set force show flag to bypass task check
      localStorage.setItem('tabbie_onboarding_force_show', 'true');
      // Also remove completion flag
      localStorage.removeItem('tabbie_onboarding_completed');
      window.location.reload();
    }
  };

  const handleThemeChange = (theme: 'clean' | 'retro') => {
    setSelectedTheme(theme);
    updateSettings({ theme });
    // Reload page to apply the new theme
    window.location.reload();
  };

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
          <Card className={
            theme === 'retro'
              ? "bg-[#fff3b0]/30 dark:bg-[#ffd700]/10 border-2 border-black dark:border-white rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]"
              : ""
          }>
            <CardHeader>
              <CardTitle className={theme === 'retro' ? "flex items-center gap-2 font-bold text-foreground" : "flex items-center gap-2"}>
                <Sun className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription className={theme === 'retro' ? "text-muted-foreground font-medium" : ""}>
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
              
              <Separator />
              
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Design Style</label>
                  <p className="text-sm text-muted-foreground">
                    Choose between Clean (modern) or Retro (neobrutalism) design
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedTheme === 'clean' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange('clean')}
                    className="flex-1"
                  >
                    🎯 Clean
                  </Button>
                  <Button
                    variant={selectedTheme === 'retro' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange('retro')}
                    className="flex-1"
                  >
                    📟 Retro
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Note: Full theme switching coming soon. Current selection is saved.
                </p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Onboarding</label>
                  <p className="text-sm text-muted-foreground">
                    View the welcome tour and change your design preference
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetOnboarding}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  View Again
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className={
            theme === 'retro'
              ? "bg-[#d4f1ff]/30 dark:bg-[#00d4ff]/10 border-2 border-black dark:border-white rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]"
              : ""
          }>
            <CardHeader>
              <CardTitle className={theme === 'retro' ? "flex items-center gap-2 font-bold text-foreground" : "flex items-center gap-2"}>
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription className={theme === 'retro' ? "text-muted-foreground font-medium" : ""}>
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
          <Card className={
            theme === 'retro'
              ? "bg-[#ffd4f4]/30 dark:bg-[#ff69b4]/10 border-2 border-black dark:border-white rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]"
              : ""
          }>
            <CardHeader>
              <CardTitle className={theme === 'retro' ? "flex items-center gap-2 font-bold text-foreground" : "flex items-center gap-2"}>
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
          <Card className={
            theme === 'retro'
              ? "bg-[#96f2d7]/30 dark:bg-[#00e5a0]/10 border-2 border-black dark:border-white rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]"
              : ""
          }>
            <CardHeader>
              <CardTitle className={theme === 'retro' ? "flex items-center gap-2 font-bold text-foreground" : "flex items-center gap-2"}>
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