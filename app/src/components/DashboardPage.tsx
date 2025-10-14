import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, Target, Clock, CheckSquare, ChevronLeft, ChevronRight, RefreshCw, RotateCcw, Sparkles, Timer, StickyNote } from 'lucide-react';
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
  onNavigateToActivity?: () => void;
  onPageChange?: (page: 'dashboard' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'activity' | 'timetracking' | 'settings' | 'tabbie') => void;
  theme?: 'clean' | 'retro';
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToActivity,
  onPageChange,
  theme = 'clean',
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

  // Retro version with bold colors and borders
  const getRetroActivityColor = (value: number): string => {
    if (value === 0) return 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500';
    if (value <= 2) return 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 shadow-[2px_2px_0_0_rgba(34,197,94,0.3)]';
    if (value <= 4) return 'bg-green-200 dark:bg-green-800/40 border-2 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300 shadow-[2px_2px_0_0_rgba(34,197,94,0.5)]';
    if (value <= 6) return 'bg-green-300 dark:bg-green-700/50 border-2 border-green-500 dark:border-green-500 text-green-900 dark:text-green-200 shadow-[2px_2px_0_0_rgba(34,197,94,0.7)]';
    if (value <= 8) return 'bg-green-400 dark:bg-green-600/60 border-2 border-green-600 dark:border-green-400 text-green-950 dark:text-green-100 shadow-[2px_2px_0_0_rgba(34,197,94,0.9)]';
    return 'bg-green-500 dark:bg-green-500/70 border-2 border-green-700 dark:border-green-300 text-white dark:text-green-50 shadow-[3px_3px_0_0_rgba(34,197,94,1)]';
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
            <div className={
              theme === 'retro'
                ? "rounded-[24px] border-2 border-black bg-[#fff3b0] p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.12)]"
                : "bg-card rounded-lg border p-3 shadow-sm"
            }>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className={theme === 'retro' ? "flex items-center gap-3" : ""}>
                    {theme === 'retro' && (
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className={theme === 'retro' ? "text-xl font-black text-gray-900" : "text-base font-semibold"}>This Month</h2>
                      <p className={theme === 'retro' ? "text-sm text-gray-700 font-bold" : "text-xs text-muted-foreground"}>
                        {displayMode === 'tasks' ? stats.month.todos : stats.month.pomodoros} {displayMode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Display Mode Toggle */}
                    <div className={theme === 'retro' ? "flex gap-1 mr-2" : "flex border rounded-md mr-2"}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={theme === 'retro' ? 'default' : (displayMode === 'tasks' ? 'default' : 'ghost')}
                            size="sm"
                            onClick={() => setDisplayMode('tasks')}
                            className={
                              theme === 'retro'
                                ? `h-7 px-3 ${displayMode === 'tasks' ? 'bg-foreground text-background border-2 border-black dark:border-white rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,0.4)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.2)] font-bold' : 'bg-transparent text-foreground border-2 border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500'}`
                                : "h-6 px-2 rounded-r-none"
                            }
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
                            variant={theme === 'retro' ? 'default' : (displayMode === 'pomodoros' ? 'default' : 'ghost')}
                            size="sm"
                            onClick={() => setDisplayMode('pomodoros')}
                            className={
                              theme === 'retro'
                                ? `h-7 px-3 ${displayMode === 'pomodoros' ? 'bg-foreground text-background border-2 border-black dark:border-white rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,0.4)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.2)] font-bold' : 'bg-transparent text-foreground border-2 border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500'}`
                                : "h-6 px-2 rounded-l-none border-l"
                            }
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
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {/* Day headers */}
                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <div className="w-6"></div>
                  <div className="grid grid-cols-7 gap-1">
                    {dayLabels.map(day => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-0.5">
                        {day.slice(0, 1)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Month calendar - 50% shorter */}
                <div className="space-y-0.5">
                  {monthWeeks.map((week, weekIndex) => {
                    const firstDay = week.find(d => d !== null);
                    const dayOfMonth = firstDay ? new Date(firstDay.date).getDate() : '';
                    
                    return (
                      <div key={weekIndex} className="grid grid-cols-[auto_1fr] gap-2">
                        <div className="w-6 flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {dayOfMonth}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {week.map((day, dayIndex) => (
                            <div key={dayIndex} className={theme === 'retro' ? "aspect-square" : "aspect-[2/1]"}>
                              {day ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`w-full h-full ${theme === 'retro' ? 'rounded-md' : 'rounded-sm'} transition-all duration-200 cursor-pointer flex items-center justify-center text-2xl font-bold relative ${theme === 'retro' ? getRetroActivityColor(displayMode === 'tasks' ? day.todos : day.pomodoros) : getActivityColor(displayMode === 'tasks' ? day.todos : day.pomodoros)} ${theme === 'retro' && day.todos + day.pomodoros > 0 ? 'hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)]' : ''}`}>
                                      {displayMode === 'tasks' ? day.todos : day.pomodoros}
                                      {isToday(day.date) && (
                                        <div className={theme === 'retro' ? "absolute -top-1 -right-1 w-3 h-3 bg-orange-400 dark:bg-orange-500 border-2 border-orange-600 dark:border-orange-400 rounded-full shadow-[2px_2px_0_0_rgba(249,115,22,1)]" : "absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm"}>
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Stats & Actions */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className={
              theme === 'retro'
                ? "rounded-[24px] border-2 border-black bg-[#d4f1ff] p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.12)]"
                : "bg-card rounded-lg border p-4 shadow-sm"
            }>
              <div className={theme === 'retro' ? "flex items-center gap-2 mb-4" : ""}>
                {theme === 'retro' && (
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                )}
                <h3 className={theme === 'retro' ? "text-lg font-black text-gray-900" : "text-sm font-semibold mb-3"}>Quick Stats</h3>
              </div>
              <div className={theme === 'retro' ? "space-y-3" : "space-y-2"}>
                <div className={theme === 'retro' ? "flex justify-between items-center p-3 bg-white rounded-xl border-2 border-black" : "flex justify-between text-sm"}>
                  <span className={theme === 'retro' ? "font-bold text-gray-900" : "text-muted-foreground"}>Today</span>
                  <span className={theme === 'retro' ? "text-2xl font-black text-gray-900" : "font-medium"}>{stats.today.todos + stats.today.pomodoros}</span>
                </div>
                <div className={theme === 'retro' ? "flex justify-between items-center p-3 bg-white rounded-xl border-2 border-black" : "flex justify-between text-sm"}>
                  <span className={theme === 'retro' ? "font-bold text-gray-900" : "text-muted-foreground"}>This Week</span>
                  <span className={theme === 'retro' ? "text-2xl font-black text-gray-900" : "font-medium"}>{stats.week.todos + stats.week.pomodoros}</span>
                </div>
                <div className={theme === 'retro' ? "flex justify-between items-center p-3 bg-white rounded-xl border-2 border-black" : "flex justify-between text-sm"}>
                  <span className={theme === 'retro' ? "font-bold text-gray-900" : "text-muted-foreground"}>This Month</span>
                  <span className={theme === 'retro' ? "text-2xl font-black text-gray-900" : "font-medium"}>{stats.month.todos + stats.month.pomodoros}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {theme === 'retro' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Quick Actions</h3>
                <div className="grid gap-4">
                  <button
                    onClick={() => onPageChange?.('tasks')}
                    className="text-left rounded-[24px] border-2 border-black bg-[#ffe164] p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.12)] hover:shadow-[12px_12px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[-2px] transition-all"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-900 rounded-xl mb-3">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-black text-xl text-gray-900 mb-1">Add Task</h4>
                    <p className="text-sm text-gray-700 font-medium">Create something awesome</p>
                  </button>
                  
                  <button
                    onClick={() => onPageChange?.('pomodoro')}
                    className="text-left rounded-[24px] border-2 border-black bg-[#96f2d7] p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.12)] hover:shadow-[12px_12px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[-2px] transition-all"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-900 rounded-xl mb-3">
                      <Timer className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-black text-xl text-gray-900 mb-1">Start Pomodoro</h4>
                    <p className="text-sm text-gray-700 font-medium">Focus time, let's go!</p>
                  </button>
                  
                  <button
                    onClick={() => onPageChange?.('notes')}
                    className="text-left rounded-[24px] border-2 border-black bg-[#ffd4f4] p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.12)] hover:shadow-[12px_12px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[-2px] transition-all"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-900 rounded-xl mb-3">
                      <StickyNote className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-black text-xl text-gray-900 mb-1">Quick Note</h4>
                    <p className="text-sm text-gray-700 font-medium">Capture your thoughts</p>
                  </button>
                </div>
              </div>
            ) : (
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
            )}

          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DashboardPage; 