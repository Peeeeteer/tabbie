import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ActivityPage: React.FC = () => {
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    today: { todos: 0, pomodoros: 0 },
    week: { todos: 0, pomodoros: 0 },
    month: { todos: 0, pomodoros: 0 },
    year: { todos: 0, pomodoros: 0 }
  });
  
  // State for activity view controls
  const [viewType, setViewType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate activity data based on view type
  useEffect(() => {
    const generateDailyData = (): DayActivity[] => {
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

    const generateMonthlyData = (): DayActivity[] => {
      const data: DayActivity[] = [];
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
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

    const generateYearlyData = (): DayActivity[] => {
      const data: DayActivity[] = [];
      const year = currentDate.getFullYear();
      
      // Get existing activity data from localStorage
      const existingData = JSON.parse(localStorage.getItem('tabbie-activity') || '{}');
      
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 15); // Middle of month for representation
        const dateStr = date.toISOString().split('T')[0];
        
        // Aggregate month data
        let monthTodos = 0;
        let monthPomodoros = 0;
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const dayDate = new Date(year, month, day);
          const dayDateStr = dayDate.toISOString().split('T')[0];
          const dayData = existingData[dayDateStr] || { todos: 0, pomodoros: 0 };
          
          // Sample data for demo
          const sampleTodos = Math.floor(Math.random() * 3) + 1;
          const samplePomodoros = Math.floor(Math.random() * 2) + 1;
          
          monthTodos += dayData.todos || sampleTodos;
          monthPomodoros += dayData.pomodoros || samplePomodoros;
        }
        
        data.push({
          date: dateStr,
          todos: monthTodos,
          pomodoros: monthPomodoros,
          total: monthTodos + monthPomodoros
        });
      }
      
      return data;
    };

    let data: DayActivity[] = [];
    
    switch (viewType) {
      case 'daily':
        data = generateDailyData();
        break;
      case 'monthly':
        data = generateMonthlyData();
        break;
      case 'yearly':
        data = generateYearlyData();
        break;
    }

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
  }, [viewType, currentDate]);

  // Get color intensity based on activity level and view type
  const getActivityColor = (total: number): string => {
    if (total === 0) return 'bg-gray-100 hover:bg-gray-200';
    
    // Adjust thresholds based on view type
    let thresholds: number[] = [];
    switch (viewType) {
      case 'daily':
        thresholds = [2, 4, 7, 10];
        break;
      case 'monthly':
        thresholds = [5, 10, 20, 30];
        break;
      case 'yearly':
        thresholds = [100, 300, 600, 1000];
        break;
    }
    
    if (total <= thresholds[0]) return 'bg-green-200 hover:bg-green-300';
    if (total <= thresholds[1]) return 'bg-green-400 hover:bg-green-500';
    if (total <= thresholds[2]) return 'bg-green-600 hover:bg-green-700';
    if (total <= thresholds[3]) return 'bg-green-700 hover:bg-green-800';
    return 'bg-green-800 hover:bg-green-900';
  };

  // Format date for display based on view type
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    
    switch (viewType) {
      case 'daily':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'monthly':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'yearly':
        return date.toLocaleDateString('en-US', { 
          month: 'long' 
        });
      default:
        return dateStr;
    }
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'daily':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'daily':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const getCurrentPeriodLabel = (): string => {
    switch (viewType) {
      case 'daily':
        return currentDate.getFullYear().toString();
      case 'monthly':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'yearly':
        return currentDate.getFullYear().toString();
      default:
        return '';
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
            <p className="text-muted-foreground">Detailed view of your productivity patterns</p>
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
              <Calendar className="h-8 w-8 text-blue-500" />
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
              <Calendar className="h-8 w-8 text-purple-500" />
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
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Activity View Controls */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Activity Timeline</h2>
                <p className="text-sm text-muted-foreground">
                  {viewType === 'daily' ? 'Daily activity over the last year' :
                   viewType === 'monthly' ? 'Monthly breakdown' :
                   'Yearly overview'}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* View Type Selector */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant={viewType === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('daily')}
                  >
                    Daily
                  </Button>
                  <Button 
                    variant={viewType === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('monthly')}
                  >
                    Monthly
                  </Button>
                  <Button 
                    variant={viewType === 'yearly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('yearly')}
                  >
                    Yearly
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={navigatePrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {getCurrentPeriodLabel()}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={navigateNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Month labels for daily view */}
            {viewType === 'daily' && (
              <div className="flex">
                <div className="w-8"></div> {/* Space for day labels */}
                <div className="flex-1 flex justify-between text-xs text-muted-foreground px-1">
                  {months.map(month => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Activity grid */}
            <div className="flex">
              {/* Day labels for daily view */}
              {viewType === 'daily' && (
                <div className="flex flex-col justify-between w-8 text-xs text-muted-foreground py-1">
                  {dayLabels.filter((_, i) => i % 2 === 1).map(day => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              )}

              {/* Activity squares */}
              <div className={viewType === 'daily' ? 'flex-1 space-y-1' : 'w-full'}>
                {viewType === 'daily' ? (
                  // GitHub-style grid for daily view
                  [0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
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
                  ))
                ) : (
                  // Grid/list view for monthly and yearly
                  <div className="grid grid-cols-12 gap-2">
                    {activityData.map((day, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div className={`h-12 rounded-sm transition-colors duration-200 cursor-pointer flex items-center justify-center text-xs font-medium ${getActivityColor(day.total)}`}>
                            {viewType === 'monthly' ? new Date(day.date).getDate() : 
                             viewType === 'yearly' ? new Date(day.date).toLocaleDateString('en-US', { month: 'short' }) : ''}
                          </div>
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
                    ))}
                  </div>
                )}
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
      </div>
    </TooltipProvider>
  );
};

export default ActivityPage; 