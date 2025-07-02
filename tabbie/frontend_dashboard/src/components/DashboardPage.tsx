import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, Target, Clock, CheckSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface DayActivity {
  date: string;
  todos: number;
  pomodoros: number;
  total: number;
}

interface ActivityStats {
  today: { todos: number; pomodoros: number };
  week: { todos: number; pomodoros: number };
  month: { todos: number; pomodoros: number };
  year: { todos: number; pomodoros: number };
}

interface DashboardPageProps {
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
}

const DashboardPage: React.FC<DashboardPageProps> = ({
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
}) => {
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    today: { todos: 0, pomodoros: 0 },
    week: { todos: 0, pomodoros: 0 },
    month: { todos: 0, pomodoros: 0 },
    year: { todos: 0, pomodoros: 0 }
  });

  // Generate last 365 days of activity data
  useEffect(() => {
    const generateActivityData = (): DayActivity[] => {
      const data: DayActivity[] = [];
      const today = new Date();
      
      // Get existing activity data from localStorage
      const existingData = JSON.parse(localStorage.getItem('tabbie-activity') || '{}');
      
      for (let i = 364; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const existing = existingData[dateStr] || { todos: 0, pomodoros: 0 };
        
        // Add some sample data for demo purposes (you can remove this later)
        const sampleTodos = i < 30 ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 5);
        const samplePomodoros = i < 30 ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 3);
        
        data.push({
          date: dateStr,
          todos: existing.todos || sampleTodos,
          pomodoros: existing.pomodoros || samplePomodoros,
          total: (existing.todos || sampleTodos) + (existing.pomodoros || samplePomodoros)
        });
      }
      
      return data;
    };

    const data = generateActivityData();
    setActivityData(data);

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const newStats: ActivityStats = {
      today: data.find(d => d.date === today) || { todos: 0, pomodoros: 0 },
      week: data.filter(d => d.date >= weekAgo).reduce((acc, day) => ({
        todos: acc.todos + day.todos,
        pomodoros: acc.pomodoros + day.pomodoros
      }), { todos: 0, pomodoros: 0 }),
      month: data.filter(d => d.date >= monthAgo).reduce((acc, day) => ({
        todos: acc.todos + day.todos,
        pomodoros: acc.pomodoros + day.pomodoros
      }), { todos: 0, pomodoros: 0 }),
      year: data.reduce((acc, day) => ({
        todos: acc.todos + day.todos,
        pomodoros: acc.pomodoros + day.pomodoros
      }), { todos: 0, pomodoros: 0 })
    };
    
    setStats(newStats);
  }, []);

  // Get color intensity based on activity level
  const getActivityColor = (total: number): string => {
    if (total === 0) return 'bg-gray-100 hover:bg-gray-200';
    if (total <= 2) return 'bg-green-200 hover:bg-green-300';
    if (total <= 4) return 'bg-green-400 hover:bg-green-500';
    if (total <= 7) return 'bg-green-600 hover:bg-green-700';
    return 'bg-green-800 hover:bg-green-900';
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get day of week (0 = Sunday)
  const getDayOfWeek = (dateStr: string): number => {
    return new Date(dateStr).getDay();
  };

  // Group activity data into weeks
  const getWeeksData = () => {
    const weeks: DayActivity[][] = [];
    let currentWeek: DayActivity[] = [];
    
    activityData.forEach((day, index) => {
      if (index === 0) {
        // Fill in empty days at the start if the year doesn't start on Sunday
        const startDayOfWeek = getDayOfWeek(day.date);
        for (let i = 0; i < startDayOfWeek; i++) {
          currentWeek.push({ date: '', todos: 0, pomodoros: 0, total: 0 });
        }
      }
      
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    // Add remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', todos: 0, pomodoros: 0, total: 0 });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const weeks = getWeeksData();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your productivity at a glance</p>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.today.todos + stats.today.pomodoros}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.today.todos} tasks • {stats.today.pomodoros} pomodoros
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.week.todos + stats.week.pomodoros}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.week.todos} tasks • {stats.week.pomodoros} pomodoros
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{stats.month.todos + stats.month.pomodoros}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.month.todos} tasks • {stats.month.pomodoros} pomodoros
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Year</p>
                <p className="text-2xl font-bold">{stats.year.todos + stats.year.pomodoros}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.year.todos} tasks • {stats.year.pomodoros} pomodoros
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* GitHub-style Activity Graph */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Activity Overview</h2>
            <p className="text-sm text-muted-foreground">Completed tasks and pomodoro sessions over the last year</p>
          </div>

          <div className="space-y-3">
            {/* Month labels */}
            <div className="flex">
              <div className="w-8"></div> {/* Space for day labels */}
              <div className="flex-1 flex justify-between text-xs text-muted-foreground px-1">
                {months.map(month => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </div>

            {/* Activity grid */}
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col justify-between w-8 text-xs text-muted-foreground py-1">
                {dayLabels.filter((_, i) => i % 2 === 1).map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              {/* Activity squares */}
              <div className="flex-1 space-y-1">
                {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                  <div key={dayIndex} className="flex space-x-1">
                    {weeks.map((week, weekIndex) => {
                      const day = week[dayIndex];
                      if (!day.date) {
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className="w-3 h-3 rounded-sm bg-transparent"
                          />
                        );
                      }

                      return (
                        <Tooltip key={`${weekIndex}-${dayIndex}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-3 h-3 rounded-sm transition-colors duration-200 cursor-pointer ${getActivityColor(day.total)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="text-sm">
                              <div className="font-medium">{formatDate(day.date)}</div>
                              <div>{day.todos} tasks completed</div>
                              <div>{day.pomodoros} pomodoro sessions</div>
                              <div className="font-medium mt-1">Total: {day.total} activities</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-sm bg-gray-100" />
                  <div className="w-3 h-3 rounded-sm bg-green-200" />
                  <div className="w-3 h-3 rounded-sm bg-green-400" />
                  <div className="w-3 h-3 rounded-sm bg-green-600" />
                  <div className="w-3 h-3 rounded-sm bg-green-800" />
                </div>
                <span>More</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Total: {stats.year.todos + stats.year.pomodoros} activities this year
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <CheckSquare className="h-5 w-5" />
              <span>Add New Task</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <Clock className="h-5 w-5" />
              <span>Start Pomodoro</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <BarChart3 className="h-5 w-5" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>

        {/* Tabbie Life - Hardware Control Section */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">🤖 Tabbie Life</h2>
            <p className="text-sm text-muted-foreground mb-6">Monitor and control your Tabbie hardware assistant</p>
            
            {/* Face Control */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Face Control</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium">Current Face:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                  {currentFace === "default" ? "📝 Default Text" : 
                   currentFace === "focus" ? "🎯 Focus Mode" : currentFace}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <Button 
                  onClick={() => handleFaceChange("default")}
                  disabled={isLoading}
                  variant={currentFace === "default" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-16"
                >
                  <span className="text-lg">📝</span>
                  <span className="text-xs">Default</span>
                </Button>
                <Button 
                  onClick={() => handleFaceChange("focus")}
                  disabled={isLoading}
                  variant={currentFace === "focus" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-16 bg-purple-100 hover:bg-purple-200 text-purple-800"
                >
                  <span className="text-lg">🎯</span>
                  <span className="text-xs">Focus</span>
                </Button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Connection Status</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
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
                         "Not found - click Reconnect to retry")}
                    </div>
                  </div>
                </div>
                {!esp32Connected && !isScanning && !isReconnecting && (
                  <Button 
                    onClick={handleReconnect}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    🔄 Reconnect
                  </Button>
                )}
              </div>
            </div>

            {/* Serial Monitor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Serial Monitor</h3>
                <Button 
                  onClick={fetchLogs} 
                  disabled={logsLoading}
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  {logsLoading ? "..." : "↻ Refresh"}
                </Button>
              </div>
              <div className="h-64 overflow-y-auto bg-slate-950 text-slate-100 p-4 rounded-lg">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono mb-1 leading-relaxed">
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
                  <div className="text-slate-400 text-xs font-mono flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="mb-2">📡</div>
                      <div>Waiting for ESP32 logs...</div>
                      <div className="text-xs mt-1">Make sure Tabbie is powered on</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DashboardPage; 