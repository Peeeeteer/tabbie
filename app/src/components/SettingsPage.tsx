import React from 'react';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Sun, Volume2, RotateCcw, Sparkles, Square, Moon, Clock } from 'lucide-react';
import { useTodo } from '@/contexts/TodoContext';
import { updateSettings } from '@/utils/storage';
import { useDarkMode } from '@/contexts/DarkModeContext';

interface SettingsPageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings') => void;
  theme?: 'clean' | 'retro';
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onPageChange, theme = 'clean' }) => {
  const { userData } = useTodo();
  const { themeMode, setThemeMode } = useDarkMode();
  const [pomodoroSound, setPomodoroSound] = React.useState(
    userData.settings.pomodoroSound !== undefined ? userData.settings.pomodoroSound : true
  );
  const [selectedTheme, setSelectedTheme] = React.useState<'clean' | 'retro'>(
    userData.settings.theme || 'clean'
  );
  const [workDuration, setWorkDuration] = React.useState(userData.settings.workDuration || 25);
  const [shortBreakDuration, setShortBreakDuration] = React.useState(userData.settings.shortBreakDuration || 5);

  const handlePomodoroSoundChange = (enabled: boolean) => {
    setPomodoroSound(enabled);
    updateSettings({ pomodoroSound: enabled });
  };

  const handleWorkDurationChange = (value: number) => {
    setWorkDuration(value);
    updateSettings({ workDuration: value });
  };

  const handleShortBreakDurationChange = (value: number) => {
    setShortBreakDuration(value);
    updateSettings({ shortBreakDuration: value });
  };

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
      <div className={
        theme === 'retro'
          ? "bg-card border-b-4 border-black dark:border-white"
          : "bg-card border-b"
      }>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={
                theme === 'retro'
                  ? "text-3xl font-black text-foreground"
                  : "text-2xl font-bold text-foreground"
              }>
                ⚙️ Settings
              </h1>
              <p className={
                theme === 'retro'
                  ? "text-muted-foreground font-medium mt-1"
                  : "text-muted-foreground mt-1"
              }>
                Customize your Tabbie experience
              </p>
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
            <CardContent className="space-y-6">
              {/* Design Style - Primary Choice */}
              <div className="space-y-3 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                <div>
                  <label className={
                    theme === 'retro'
                      ? "text-lg font-black text-primary"
                      : "text-base font-bold text-primary"
                  }>
                    Design Style
                  </label>
                  <p className={
                    theme === 'retro'
                      ? "text-xs text-muted-foreground font-medium mt-1"
                      : "text-xs text-muted-foreground mt-1"
                  }>
                    Completely changes how Tabbie looks and feels
                  </p>
                </div>
                <div className="flex gap-3">
                  {/* Clean Button - Styled like Clean UI */}
                  <Button
                    variant="outline"
                    size={theme === 'retro' ? 'lg' : 'default'}
                    onClick={() => handleThemeChange('clean')}
                    className={
                      selectedTheme === 'clean'
                        ? `flex-1 font-semibold border-2 ring-4 ring-blue-500/30 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-500 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40`
                        : `flex-1 font-semibold hover:border-blue-300 hover:shadow-md`
                    }
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Clean
                  </Button>
                  
                  {/* Retro Button - Styled like Retro UI */}
                  <Button
                    variant="outline"
                    size={theme === 'retro' ? 'lg' : 'default'}
                    onClick={() => handleThemeChange('retro')}
                    className={
                      selectedTheme === 'retro'
                        ? `flex-1 font-black border-4 border-black dark:border-white shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(255,255,255,0.3)] bg-yellow-100 dark:bg-yellow-900/30 text-black dark:text-white hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,255,255,0.4)] translate-x-[-2px] translate-y-[-2px]`
                        : `flex-1 font-black border-2 hover:border-black dark:hover:border-white hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]`
                    }
                  >
                    <Square className="h-5 w-5 mr-2 fill-current" />
                    Retro
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Color Mode - Secondary Choice */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <label className={
                    theme === 'retro'
                      ? "text-base font-bold"
                      : "text-sm font-medium"
                  }>
                    Color Mode
                  </label>
                  <p className={
                    theme === 'retro'
                      ? "text-xs text-muted-foreground font-medium"
                      : "text-xs text-muted-foreground"
                  }>
                    Light, dark, or automatic theme switching
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={themeMode === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setThemeMode('light')}
                    className={
                      theme === 'retro'
                        ? "flex-1 font-bold border-2"
                        : "flex-1"
                    }
                  >
                    <Sun className="h-4 w-4 mr-1.5" />
                    Light
                  </Button>
                  <Button
                    variant={themeMode === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setThemeMode('dark')}
                    className={
                      theme === 'retro'
                        ? "flex-1 font-bold border-2"
                        : "flex-1"
                    }
                  >
                    <Moon className="h-4 w-4 mr-1.5" />
                    Dark
                  </Button>
                  <Button
                    variant={themeMode === 'auto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setThemeMode('auto')}
                    className={
                      theme === 'retro'
                        ? "flex-1 font-bold border-2 relative"
                        : "flex-1 relative"
                    }
                  >
                    <Clock className="h-4 w-4 mr-1.5" />
                    Auto
                    {themeMode === 'auto' && (
                      <span className="ml-1 text-xs">★</span>
                    )}
                  </Button>
                </div>
                {themeMode === 'auto' && (
                  <p className={
                    theme === 'retro'
                      ? "text-xs text-muted-foreground font-medium italic"
                      : "text-xs text-muted-foreground italic"
                  }>
                    Dark mode from 6 PM to 6 AM
                  </p>
                )}
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className={
                    theme === 'retro'
                      ? "text-base font-bold"
                      : "text-sm font-medium"
                  }>
                    Welcome Tour
                  </label>
                  <p className={
                    theme === 'retro'
                      ? "text-sm text-muted-foreground font-medium"
                      : "text-sm text-muted-foreground"
                  }>
                    Replay the onboarding experience
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size={theme === 'retro' ? 'default' : 'sm'}
                  onClick={handleResetOnboarding}
                  className={
                    theme === 'retro'
                      ? "font-bold border-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.1)]"
                      : ""
                  }
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restart Tour
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pomodoro Section */}
          <Card className={
            theme === 'retro'
              ? "bg-[#d4f1ff]/30 dark:bg-[#00d4ff]/10 border-2 border-black dark:border-white rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]"
              : ""
          }>
            <CardHeader>
              <CardTitle className={theme === 'retro' ? "flex items-center gap-2 font-bold text-foreground" : "flex items-center gap-2"}>
                <Volume2 className="h-5 w-5" />
                Pomodoro
              </CardTitle>
              <CardDescription className={theme === 'retro' ? "text-muted-foreground font-medium" : ""}>
                Configure pomodoro timer settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className={
                    theme === 'retro'
                      ? "text-base font-bold cursor-pointer"
                      : "text-sm font-medium cursor-pointer"
                  }>
                    Sound Alerts
                  </label>
                  <p className={
                    theme === 'retro'
                      ? "text-sm text-muted-foreground font-medium"
                      : "text-sm text-muted-foreground"
                  }>
                    Play sound when pomodoro timer ends
                  </p>
                </div>
                <ToggleSwitch
                  checked={pomodoroSound}
                  onCheckedChange={handlePomodoroSoundChange}
                  size="md"
                />
              </div>

              <Separator />

              {/* Work Duration */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <label className={
                    theme === 'retro'
                      ? "text-base font-bold"
                      : "text-sm font-medium"
                  }>
                    Work Duration
                  </label>
                  <p className={
                    theme === 'retro'
                      ? "text-sm text-muted-foreground font-medium"
                      : "text-sm text-muted-foreground"
                  }>
                    Length of focus sessions in minutes
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={workDuration}
                    onChange={(e) => handleWorkDurationChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className={
                    theme === 'retro'
                      ? "min-w-[80px] text-center px-3 py-2 bg-primary/10 border-2 border-black dark:border-white rounded-lg font-black text-lg"
                      : "min-w-[80px] text-center px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg font-semibold"
                  }>
                    {workDuration} min
                  </div>
                </div>
              </div>

              {/* Break Duration */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <label className={
                    theme === 'retro'
                      ? "text-base font-bold"
                      : "text-sm font-medium"
                  }>
                    Break Duration
                  </label>
                  <p className={
                    theme === 'retro'
                      ? "text-sm text-muted-foreground font-medium"
                      : "text-sm text-muted-foreground"
                  }>
                    Length of breaks between focus sessions
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={shortBreakDuration}
                    onChange={(e) => handleShortBreakDurationChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className={
                    theme === 'retro'
                      ? "min-w-[80px] text-center px-3 py-2 bg-primary/10 border-2 border-black dark:border-white rounded-lg font-black text-lg"
                      : "min-w-[80px] text-center px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg font-semibold"
                  }>
                    {shortBreakDuration} min
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