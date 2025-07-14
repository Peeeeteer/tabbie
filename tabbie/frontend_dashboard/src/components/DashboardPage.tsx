import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, Target, Clock, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
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
  onNavigateToActivity?: () => void;
  onNavigateToTabbie?: () => void;
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
  onNavigateToActivity,
  onNavigateToTabbie,
}) => {
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    today: { todos: 0, pomodoros: 0 },
    week: { todos: 0, pomodoros: 0 },
    month: { todos: 0, pomodoros: 0 },
    year: { todos: 0, pomodoros: 0 }
  });
  
  // State for month navigation on dashboard
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  
  // State for display mode toggle
  const [displayMode, setDisplayMode] = useState<'tasks' | 'pomodoros'>('tasks');

  // Generate current month activity data for dashboard
  useEffect(() => {
    const generateCurrentMonthData = (): DayActivity[] => {
      const data: DayActivity[] = [];
      const year = currentMonthDate.getFullYear();
      const month = currentMonthDate.getMonth();
      
      // Get existing activity data from localStorage
      const existingData = JSON.parse(localStorage.getItem('tabbie-activity') || '{}');
      
      // Get first day of month and number of days
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        
        const existing = existingData[dateStr] || { todos: 0, pomodoros: 0 };
        
        // Sample data for demo
        const sampleTodos = Math.floor(Math.random() * 10);
        const samplePomodoros = Math.floor(Math.random() * 8);
        
        data.push({
          date: dateStr,
          todos: existing.todos || sampleTodos,
          pomodoros: existing.pomodoros || samplePomodoros,
          total: (existing.todos || sampleTodos) + (existing.pomodoros || samplePomodoros)
        });
      }
      
      return data;
    };

    const monthData = generateCurrentMonthData();
    setActivityData(monthData);

    // Calculate stats based on current month data and broader timeframes
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // For broader stats, we need to get more data from localStorage
    const existingData = JSON.parse(localStorage.getItem('tabbie-activity') || '{}');
    const getAllDaysData = (days: number) => {
      const data: DayActivity[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const existing = existingData[dateStr] || { todos: 0, pomodoros: 0 };
        const sampleTodos = Math.floor(Math.random() * 5);
        const samplePomodoros = Math.floor(Math.random() * 3);
        data.push({
          date: dateStr,
          todos: existing.todos || sampleTodos,
          pomodoros: existing.pomodoros || samplePomodoros,
          total: (existing.todos || sampleTodos) + (existing.pomodoros || samplePomodoros)
        });
      }
      return data;
    };

    const yearData = getAllDaysData(365);
    
    const newStats: ActivityStats = {
      today: monthData.find(d => d.date === today) || { todos: 0, pomodoros: 0 },
      week: yearData.filter(d => d.date >= weekAgo).reduce((acc, day) => ({
        todos: acc.todos + day.todos,
        pomodoros: acc.pomodoros + day.pomodoros
      }), { todos: 0, pomodoros: 0 }),
      month: monthData.reduce((acc, day) => ({
        todos: acc.todos + day.todos,
        pomodoros: acc.pomodoros + day.pomodoros
      }), { todos: 0, pomodoros: 0 }),
      year: yearData.reduce((acc, day) => ({
        todos: acc.todos + day.todos,
        pomodoros: acc.pomodoros + day.pomodoros
      }), { todos: 0, pomodoros: 0 })
    };
    
    setStats(newStats);
  }, [currentMonthDate]);

  // Get color intensity for activity squares
  const getActivityColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100 hover:bg-gray-200 text-gray-400';
    if (value <= 2) return 'bg-green-200 hover:bg-green-300 text-green-800';
    if (value <= 4) return 'bg-green-400 hover:bg-green-500 text-green-900';
    if (value <= 6) return 'bg-green-600 hover:bg-green-700 text-white';
    if (value <= 8) return 'bg-green-700 hover:bg-green-800 text-white';
    return 'bg-green-800 hover:bg-green-900 text-white';
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Month navigation functions
  const navigatePreviousMonth = () => {
    const newDate = new Date(currentMonthDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonthDate(newDate);
  };

  const navigateNextMonth = () => {
    const newDate = new Date(currentMonthDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonthDate(newDate);
  };

  const getCurrentMonthLabel = (): string => {
    return currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get current month calendar layout
  const getMonthCalendarData = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday=0, Tuesday=1, etc.
    const daysInMonth = lastDay.getDate();
    
    const weeks: (DayActivity | null)[][] = [];
    let currentWeek: (DayActivity | null)[] = [];
    
    // Fill in empty days at the start
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = activityData.find(d => {
        const date = new Date(d.date);
        return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
      });
      
      currentWeek.push(dayData || { 
        date: new Date(year, month, day).toISOString().split('T')[0], 
        todos: 0, 
        pomodoros: 0, 
        total: 0 
      });
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    // Fill remaining days in last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const monthWeeks = getMonthCalendarData();
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Activity Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-3 shadow-sm">
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">This Month</h2>
                    <p className="text-xs text-muted-foreground">
                      {displayMode === 'tasks' ? stats.month.todos : stats.month.pomodoros} {displayMode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Display Mode Toggle */}
                    <div className="flex border rounded-md mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={displayMode === 'tasks' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDisplayMode('tasks')}
                            className="h-6 px-2 rounded-r-none"
                          >
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Show tasks completed</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={displayMode === 'pomodoros' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDisplayMode('pomodoros')}
                            className="h-6 px-2 rounded-l-none border-l"
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Show pomodoros completed</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={navigatePreviousMonth}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-medium min-w-[80px] text-center">
                      {getCurrentMonthLabel()}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={navigateNextMonth}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={onNavigateToActivity}
                          className="h-6 w-6 p-0 ml-2"
                        >
                          <BarChart3 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View full activity details</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1">
                  {dayLabels.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-0.5">
                      {day.slice(0, 1)}
                    </div>
                  ))}
                </div>

                {/* Month calendar - 50% shorter */}
                <div className="space-y-0.5">
                  {monthWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                      {week.map((day, dayIndex) => (
                        <div key={dayIndex} className="aspect-[2/1]">
                          {day ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`w-full h-full rounded-sm transition-colors duration-200 cursor-pointer flex items-center justify-center text-xs font-semibold ${getActivityColor(displayMode === 'tasks' ? day.todos : day.pomodoros)}`}>
                                  {displayMode === 'tasks' ? day.todos : day.pomodoros}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="text-sm">
                                  <div className="font-medium">{formatDate(day.date)}</div>
                                  <div>{day.todos} tasks • {day.pomodoros} pomodoros</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="w-full h-full"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Stats & Actions */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Today</span>
                  <span className="font-medium">{stats.today.todos + stats.today.pomodoros}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="font-medium">{stats.week.todos + stats.week.pomodoros}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-medium">{stats.month.todos + stats.month.pomodoros}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full flex items-center justify-start gap-3 h-12 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300"
                  variant="outline"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Add Task</div>
                    <div className="text-xs text-blue-600">Create a new to-do item</div>
                  </div>
                </Button>
                
                <Button 
                  className="w-full flex items-center justify-start gap-3 h-12 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
                  variant="outline"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Start Pomodoro</div>
                    <div className="text-xs text-green-600">Begin a focus session</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Quick Tabbie */}
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">🤖 Quick Tabbie</h3>
              
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  esp32Connected 
                    ? (isHealthChecking ? 'bg-blue-500 animate-pulse' : 'bg-green-500')
                    : (isScanning || isReconnecting)
                      ? 'bg-yellow-500 animate-pulse' 
                      : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">
                  {esp32Connected 
                    ? (isHealthChecking ? 'Checking...' : 'Connected')
                    : isReconnecting
                      ? 'Reconnecting...'
                      : isScanning 
                        ? 'Scanning...' 
                        : 'Disconnected'
                  }
                </span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                className="w-full text-xs"
                onClick={onNavigateToTabbie}
              >
                View Details →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DashboardPage; 