import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, Target, Clock, CheckSquare, ChevronLeft, ChevronRight, RefreshCw, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTodo } from '@/contexts/TodoContext';


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
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings') => void;
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
  onPageChange,
}) => {
  const { userData } = useTodo();
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
  const [displayMode, setDisplayMode] = useState<'tasks' | 'pomodoros'>('pomodoros');

  // Generate activity data from real user data
  useEffect(() => {
    const generateActivityData = (): DayActivity[] => {
      const data: DayActivity[] = [];
      const year = currentMonthDate.getFullYear();
      const month = currentMonthDate.getMonth();
      
      // Get first day of month and number of days
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = new Intl.DateTimeFormat('en-CA', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }).format(date);
        
        // Count completed tasks for this day
        const tasksCompletedThisDay = userData.completedTasks.filter(task => {
          const completedDate = new Intl.DateTimeFormat('en-CA', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          }).format(new Date(task.completed));
          return completedDate === dateStr;
        }).length;
        
        // Count completed pomodoros for this day
        const pomodorosCompletedThisDay = userData.pomodoroSessions.filter(session => {
          if (!session.completed || !session.ended || session.type !== 'work') return false;
          const sessionDate = new Intl.DateTimeFormat('en-CA', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          }).format(new Date(session.ended));
          return sessionDate === dateStr;
        }).length;
        
        data.push({
          date: dateStr,
          todos: tasksCompletedThisDay,
          pomodoros: pomodorosCompletedThisDay,
          total: tasksCompletedThisDay + pomodorosCompletedThisDay
        });
      }
      
      return data;
    };

    const monthData = generateActivityData();
    setActivityData(monthData);

    // Calculate real stats based on actual data with timezone-aware dates
    const now = new Date();
    const today = new Intl.DateTimeFormat('en-CA', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(now);
    
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Helper function to get local date string
    const getLocalDateString = (date: Date) => {
      return new Intl.DateTimeFormat('en-CA', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).format(date);
    };

    // Today's stats
    const todayTasks = userData.completedTasks.filter(task => {
      const completedDate = getLocalDateString(new Date(task.completed));
      return completedDate === today;
    }).length;

    const todayPomodoros = userData.pomodoroSessions.filter(session => {
      if (!session.completed || !session.ended || session.type !== 'work') return false;
      const sessionDate = getLocalDateString(new Date(session.ended));
      return sessionDate === today;
    }).length;

    // Week's stats
    const weekTasks = userData.completedTasks.filter(task => {
      const completedDate = new Date(task.completed);
      return completedDate >= weekAgo;
    }).length;

    const weekPomodoros = userData.pomodoroSessions.filter(session => {
      if (!session.completed || !session.ended || session.type !== 'work') return false;
      const sessionDate = new Date(session.ended);
      return sessionDate >= weekAgo;
    }).length;

    // Month's stats
    const monthTasks = userData.completedTasks.filter(task => {
      const completedDate = new Date(task.completed);
      return completedDate >= monthAgo;
    }).length;

    const monthPomodoros = userData.pomodoroSessions.filter(session => {
      if (!session.completed || !session.ended || session.type !== 'work') return false;
      const sessionDate = new Date(session.ended);
      return sessionDate >= monthAgo;
    }).length;

    // Year's stats
    const yearTasks = userData.completedTasks.filter(task => {
      const completedDate = new Date(task.completed);
      return completedDate >= yearAgo;
    }).length;

    const yearPomodoros = userData.pomodoroSessions.filter(session => {
      if (!session.completed || !session.ended || session.type !== 'work') return false;
      const sessionDate = new Date(session.ended);
      return sessionDate >= yearAgo;
    }).length;
    
    const newStats: ActivityStats = {
      today: { todos: todayTasks, pomodoros: todayPomodoros },
      week: { todos: weekTasks, pomodoros: weekPomodoros },
      month: { todos: monthTasks, pomodoros: monthPomodoros },
      year: { todos: yearTasks, pomodoros: yearPomodoros }
    };
    
    setStats(newStats);
  }, [currentMonthDate, userData.completedTasks, userData.pomodoroSessions]);

  // Get color intensity for activity squares
  const getActivityColor = (value: number): string => {
    if (value === 0) return 'bg-muted hover:bg-muted/80 text-muted-foreground';
    if (value <= 2) return 'bg-green-200/20 hover:bg-green-200/30 text-green-700 dark:text-green-300';
    if (value <= 4) return 'bg-green-400/30 hover:bg-green-400/40 text-green-800 dark:text-green-200';
    if (value <= 6) return 'bg-green-500/50 hover:bg-green-500/60 text-green-900 dark:text-green-100';
    if (value <= 8) return 'bg-green-600/70 hover:bg-green-600/80 text-green-900 dark:text-green-50';
    return 'bg-green-700/90 hover:bg-green-700 text-green-900 dark:text-green-50';
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

  // Helper function to check if a date is today
  const isToday = (dateStr: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

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
            <div className="bg-card rounded-lg border p-3 shadow-sm">
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
                                <div className={`w-full h-full rounded-sm transition-colors duration-200 cursor-pointer flex items-center justify-center text-xs font-semibold relative ${getActivityColor(displayMode === 'tasks' ? day.todos : day.pomodoros)}`}>
                                  {displayMode === 'tasks' ? day.todos : day.pomodoros}
                                  {isToday(day.date) && (
                                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm">
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {isToday(day.date) ? 'Today • ' : ''}{formatDate(day.date)}
                                  </div>
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
            <div className="bg-card rounded-lg border p-4 shadow-sm">
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
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">XP Earned</span>
                  <span className="font-medium text-purple-600">{userData.totalXP || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full flex items-center justify-start gap-3 h-12 bg-accent hover:bg-accent/80 text-accent-foreground border-accent"
                  variant="outline"
                  onClick={() => onPageChange?.('tasks')}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-accent/20 rounded-lg">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Add Task</div>
                    <div className="text-xs text-muted-foreground">Create a new to-do item</div>
                  </div>
                </Button>
                
                <Button 
                  className="w-full flex items-center justify-start gap-3 h-12 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                  variant="outline"
                  onClick={() => onPageChange?.('pomodoro')}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Start Pomodoro</div>
                    <div className="text-xs text-muted-foreground">Begin a focus session</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Quick Tabbie */}
            <div className="bg-card rounded-lg border p-4 shadow-sm">
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