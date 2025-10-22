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

  // Get color intensity for activity squares - Clean and simple
  const getActivityColor = (value: number, type: 'tasks' | 'pomodoros'): string => {
    const colors = type === 'tasks' 
      ? {
          zero: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          low: 'bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800',
          med: 'bg-blue-300 dark:bg-blue-700/70 border border-blue-400 dark:border-blue-600',
          high: 'bg-blue-500 dark:bg-blue-600 border border-blue-600 dark:border-blue-500',
          veryhigh: 'bg-blue-600 dark:bg-blue-500 border border-blue-700 dark:border-blue-400'
        }
      : {
          zero: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          low: 'bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800',
          med: 'bg-emerald-300 dark:bg-emerald-700/70 border border-emerald-400 dark:border-emerald-600',
          high: 'bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-500',
          veryhigh: 'bg-emerald-600 dark:bg-emerald-500 border border-emerald-700 dark:border-emerald-400'
        };
    
    if (value === 0) return colors.zero;
    if (value <= 2) return colors.low;
    if (value <= 5) return colors.med;
    if (value <= 8) return colors.high;
    return colors.veryhigh;
  };

  // Retro version with bold colors and borders - improved dark theme
  const getRetroActivityColor = (value: number): string => {
    if (value === 0) return 'bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600';
    if (value <= 2) return 'bg-green-100 dark:bg-green-950 border-2 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 shadow-[2px_2px_0_0_rgba(34,197,94,0.3)] dark:shadow-[2px_2px_0_0_rgba(34,197,94,0.2)]';
    if (value <= 4) return 'bg-green-200 dark:bg-green-900 border-2 border-green-400 dark:border-green-700 text-green-800 dark:text-green-300 shadow-[2px_2px_0_0_rgba(34,197,94,0.5)] dark:shadow-[2px_2px_0_0_rgba(34,197,94,0.3)]';
    if (value <= 6) return 'bg-green-300 dark:bg-green-800 border-2 border-green-500 dark:border-green-600 text-green-900 dark:text-green-200 shadow-[2px_2px_0_0_rgba(34,197,94,0.7)] dark:shadow-[2px_2px_0_0_rgba(34,197,94,0.4)]';
    if (value <= 8) return 'bg-green-400 dark:bg-green-700 border-2 border-green-600 dark:border-green-500 text-green-950 dark:text-green-100 shadow-[2px_2px_0_0_rgba(34,197,94,0.9)] dark:shadow-[2px_2px_0_0_rgba(34,197,94,0.5)]';
    return 'bg-green-500 dark:bg-green-600 border-2 border-green-700 dark:border-green-400 text-white dark:text-white shadow-[3px_3px_0_0_rgba(34,197,94,1)] dark:shadow-[3px_3px_0_0_rgba(34,197,94,0.6)]';
  };

  // Get text color for value display
  const getTextColor = (value: number, type: 'tasks' | 'pomodoros'): string => {
    if (value === 0) return 'text-gray-400 dark:text-gray-600';
    if (value <= 2) return type === 'tasks' ? 'text-blue-700 dark:text-blue-300' : 'text-emerald-700 dark:text-emerald-300';
    if (value <= 5) return type === 'tasks' ? 'text-blue-800 dark:text-blue-100' : 'text-emerald-800 dark:text-emerald-100';
    return 'text-white dark:text-white';
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
      <div className="space-y-4 p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your productivity at a glance</p>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Activity Overview */}
          <div className="lg:col-span-2">
            {/* Compact Calendar */}
            <div className={
              theme === 'retro'
                ? "rounded-[20px] border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-[8px_8px_0_0_rgba(0,0,0,0.12)] dark:shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]"
                : "bg-card rounded-lg border p-4 shadow-sm"
            }>
              {/* Header - Normal Size */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={
                    theme === 'retro'
                      ? "flex items-center justify-center w-10 h-10 bg-gray-900 dark:bg-gray-100 rounded-lg"
                      : "flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg"
                  }>
                    <Calendar className={theme === 'retro' ? "w-5 h-5 text-white dark:text-gray-900" : "w-5 h-5 text-primary"} />
                  </div>
                  <div>
                    <h2 className={theme === 'retro' ? "text-lg font-black text-gray-900 dark:text-gray-100" : "text-lg font-bold"}>
                      {getCurrentMonthLabel()}
                    </h2>
                    <p className={theme === 'retro' ? "text-xs text-gray-600 dark:text-gray-400 font-bold" : "text-xs text-muted-foreground"}>
                      {stats.month.todos} tasks • {stats.month.pomodoros} pomodoros
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Display Mode Toggle - Compact */}
                  <div className={theme === 'retro' ? "flex gap-1" : "flex gap-1 p-0.5 bg-muted rounded-md"}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={displayMode === 'tasks' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setDisplayMode('tasks')}
                          className={
                            theme === 'retro'
                              ? `h-7 px-2 ${displayMode === 'tasks' ? 'bg-blue-500 text-white border-2 border-black rounded-md font-bold' : 'bg-transparent text-foreground border-2 border-gray-300 rounded-md'}`
                              : `h-7 px-2 ${displayMode === 'tasks' ? 'bg-blue-500 text-white' : ''}`
                          }
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Tasks</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={displayMode === 'pomodoros' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setDisplayMode('pomodoros')}
                          className={
                            theme === 'retro'
                              ? `h-7 px-2 ${displayMode === 'pomodoros' ? 'bg-emerald-500 text-white border-2 border-black rounded-md font-bold' : 'bg-transparent text-foreground border-2 border-gray-300 rounded-md'}`
                              : `h-7 px-2 ${displayMode === 'pomodoros' ? 'bg-emerald-500 text-white' : ''}`
                          }
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Pomodoros</p></TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="flex items-center gap-0.5">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={navigatePreviousMonth}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={navigateNextMonth}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Compact Calendar Grid - Half Height */}
              <div className="space-y-1">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {dayLabels.map(day => (
                    <div key={day} className={
                      theme === 'retro'
                        ? "text-center text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase"
                        : "text-center text-[10px] font-semibold text-muted-foreground uppercase"
                    }>
                      {day.charAt(0)}
                    </div>
                  ))}
                </div>

                {/* Half-height month calendar */}
                <div className="space-y-1">
                  {monthWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                      {week.map((day, dayIndex) => (
                        <div key={dayIndex} className="aspect-[2/1]">
                          {day ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`
                                  w-full h-full rounded-lg transition-all duration-200 cursor-pointer 
                                  flex items-center justify-center gap-1.5 relative group
                                  ${theme === 'retro' 
                                    ? getRetroActivityColor(displayMode === 'tasks' ? day.todos : day.pomodoros) + ' hover:translate-x-[-1px] hover:translate-y-[-1px]'
                                    : getActivityColor(displayMode === 'tasks' ? day.todos : day.pomodoros, displayMode) + ' hover:scale-105 hover:shadow-md'
                                  }
                                `}>
                                  <span className={
                                    theme === 'retro'
                                      ? "text-[9px] font-bold"
                                      : `text-[9px] font-medium ${getTextColor(displayMode === 'tasks' ? day.todos : day.pomodoros, displayMode)}`
                                  }>
                                    {new Date(day.date).getDate()}
                                  </span>
                                  <span className={
                                    theme === 'retro'
                                      ? "text-lg font-black"
                                      : `text-lg font-bold ${getTextColor(displayMode === 'tasks' ? day.todos : day.pomodoros, displayMode)}`
                                  }>
                                    {displayMode === 'tasks' ? day.todos : day.pomodoros}
                                  </span>
                                  {isToday(day.date) && (
                                    <div className={
                                      theme === 'retro' 
                                        ? "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-400 border border-orange-600 rounded-full" 
                                        : "absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-white dark:border-gray-900 shadow-sm animate-pulse"
                                    }>
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="p-2">
                                <div className="text-xs space-y-0.5">
                                  <div className="font-semibold">
                                    {isToday(day.date) ? '✨ Today' : formatDate(day.date)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                    <CheckSquare className="w-3 h-3" />
                                    <span>{day.todos} tasks</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{day.pomodoros} pomodoros</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className={
                              theme === 'retro'
                                ? "w-full h-full rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                                : "w-full h-full rounded-lg bg-muted/10"
                            }></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className={theme === 'retro' ? "mt-3 pt-3 border-t-2 border-gray-200 dark:border-gray-700" : "mt-3 pt-3 border-t"}>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className={theme === 'retro' ? "font-bold text-gray-600 dark:text-gray-400" : "text-muted-foreground"}>Less</span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 3, 6, 10].map((val, idx) => (
                      <div 
                        key={idx} 
                        className={`w-5 h-5 rounded ${theme === 'retro' ? getRetroActivityColor(val) : getActivityColor(val, displayMode)}`}
                      />
                    ))}
                  </div>
                  <span className={theme === 'retro' ? "font-bold text-gray-600 dark:text-gray-400" : "text-muted-foreground"}>More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Stats & Actions */}
          <div className="space-y-3">
            {/* Quick Stats - Compact */}
            <div className={
              theme === 'retro'
                ? "rounded-[20px] border-2 border-black dark:border-gray-700 bg-[#d4f1ff] dark:bg-gray-900 p-4 shadow-[8px_8px_0_0_rgba(0,0,0,0.12)] dark:shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]"
                : "bg-card rounded-lg border p-3 shadow-sm"
            }>
              <div className={theme === 'retro' ? "flex items-center gap-2 mb-3" : ""}>
                {theme === 'retro' && (
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white dark:text-gray-900" />
                  </div>
                )}
                <h3 className={theme === 'retro' ? "text-base font-black text-gray-900 dark:text-gray-100" : "text-sm font-semibold mb-2"}>Quick Stats</h3>
              </div>
              <div className={theme === 'retro' ? "space-y-2" : "space-y-1.5"}>
                <div className={theme === 'retro' ? "flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-black dark:border-gray-600" : "flex justify-between text-sm"}>
                  <span className={theme === 'retro' ? "font-bold text-gray-900 dark:text-gray-100 text-sm" : "text-muted-foreground"}>Today</span>
                  <span className={theme === 'retro' ? "text-xl font-black text-gray-900 dark:text-gray-100" : "font-semibold"}>{stats.today.todos + stats.today.pomodoros}</span>
                </div>
                <div className={theme === 'retro' ? "flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-black dark:border-gray-600" : "flex justify-between text-sm"}>
                  <span className={theme === 'retro' ? "font-bold text-gray-900 dark:text-gray-100 text-sm" : "text-muted-foreground"}>This Week</span>
                  <span className={theme === 'retro' ? "text-xl font-black text-gray-900 dark:text-gray-100" : "font-semibold"}>{stats.week.todos + stats.week.pomodoros}</span>
                </div>
                <div className={theme === 'retro' ? "flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-black dark:border-gray-600" : "flex justify-between text-sm"}>
                  <span className={theme === 'retro' ? "font-bold text-gray-900 dark:text-gray-100 text-sm" : "text-muted-foreground"}>This Month</span>
                  <span className={theme === 'retro' ? "text-xl font-black text-gray-900 dark:text-gray-100" : "font-semibold"}>{stats.month.todos + stats.month.pomodoros}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions - Compact */}
            {theme === 'retro' ? (
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wide">Quick Actions</h3>
                <div className="grid gap-2">
                  <button
                    onClick={() => onPageChange?.('tasks')}
                    className="text-left rounded-[20px] border-2 border-black dark:border-gray-600 bg-[#ffe164] dark:bg-yellow-600 p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.12)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.5)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.15)] dark:hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded-lg flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white dark:text-gray-900" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-gray-900 dark:text-gray-100">Add Task</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Create something awesome</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => onPageChange?.('pomodoro')}
                    className="text-left rounded-[20px] border-2 border-black dark:border-gray-600 bg-[#96f2d7] dark:bg-teal-600 p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.12)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.5)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.15)] dark:hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded-lg flex-shrink-0">
                        <Timer className="w-4 h-4 text-white dark:text-gray-900" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-gray-900 dark:text-gray-100">Start Pomodoro</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Focus time, let's go!</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => onPageChange?.('notes')}
                    className="text-left rounded-[20px] border-2 border-black dark:border-gray-600 bg-[#ffd4f4] dark:bg-pink-600 p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.12)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.5)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.15)] dark:hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded-lg flex-shrink-0">
                        <StickyNote className="w-4 h-4 text-white dark:text-gray-900" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-gray-900 dark:text-gray-100">Quick Note</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Capture your thoughts</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg border p-3 shadow-sm">
                <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Button 
                    className="w-full flex items-center justify-start gap-2 h-10 bg-accent hover:bg-accent/80 text-accent-foreground border-accent"
                    variant="outline"
                    onClick={() => onPageChange?.('tasks')}
                  >
                    <div className="flex items-center justify-center w-7 h-7 bg-accent/20 rounded-lg">
                      <CheckSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-xs">Add Task</div>
                    </div>
                  </Button>
                  
                  <Button 
                    className="w-full flex items-center justify-start gap-2 h-10 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                    variant="outline"
                    onClick={() => onPageChange?.('pomodoro')}
                  >
                    <div className="flex items-center justify-center w-7 h-7 bg-primary/20 rounded-lg">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-xs">Start Pomodoro</div>
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