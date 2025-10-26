import React, { useState } from 'react';
import { 
  Plus, Settings2, X, Monitor, CheckSquare, Clock, Bell, BarChart3, 
  Calendar, Zap, Activity, ChevronDown, ChevronRight, AlertTriangle,
  Palette, MoreHorizontal, Trophy, Wrench, Play, Pause, Square, Coffee, SkipForward,
  BookOpen, Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTodo } from '@/contexts/TodoContext';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';

interface CategorySidebarProps {
  currentPage: 'dashboard' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'notes' | 'activity' | 'timetracking' | 'settings' | 'tabbie';
  onPageChange: (page: 'dashboard' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'notes' | 'activity' | 'timetracking' | 'settings' | 'tabbie') => void;
      currentView?: 'today' | 'tomorrow' | 'next7days' | 'completed' | string; // Allow any string for dynamic category IDs
  onViewChange?: (view: 'today' | 'tomorrow' | 'next7days' | 'completed' | string) => void; // Allow any string for dynamic category IDs
  activityStats?: {
    totalPomodoros: number;
  };
  theme?: 'clean' | 'retro';
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ 
  currentPage, 
  onPageChange, 
  currentView: _currentView,
  onViewChange,
  activityStats,
  theme = 'clean'
}) => {
  const {
    userData,
    selectedCategoryId,
    setSelectedCategory,
    addCategory,
    deleteCategory,
    currentTaskId,
    pomodoroTimer,
    resetCategoriesToDefault,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    skipBreak,
    startNextSession,
    completeWorkSession,
  } = useTodo();

  // Get current task from userData using currentTaskId
  const currentTask = currentTaskId ? userData.tasks.find(t => t.id === currentTaskId) || null : null;

  // Enhanced state management
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝');
  const [newCategoryColor, setNewCategoryColor] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);

  // Helper function to format time
  const formatTime = (seconds: number): string => {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    return seconds < 0 ? `+${timeStr}` : timeStr;
  };

  // Check if work session is overdue
  const isWorkOverdue = pomodoroTimer.sessionType === 'work' && pomodoroTimer.timeLeft < 0;
  
  // Check if break session is overdue
  const isBreakOverdue = pomodoroTimer.sessionType === 'shortBreak' && pomodoroTimer.timeLeft < 0;


  const categoryColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
    '#6366F1', '#14B8A6', '#F97316', '#EF4444', '#A855F7', '#0EA5E9', '#F43F5E', '#65A30D',
  ];

  const categoryIcons = ['📝', '💼', '💻', '🎨', '🏠', '📚', '🎯', '⚡', '🔧', '🎵', '🍎', '✨', '🚀', '💡', '🎮', '🏃'];

  // Smart default color selection
  const getNextColor = () => {
    const usedColors = userData.categories.map(cat => cat.color);
    const availableColors = categoryColors.filter(color => !usedColors.includes(color));
    return availableColors[0] || categoryColors[0];
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const color = newCategoryColor || getNextColor();
      addCategory(newCategoryName.trim(), color, newCategoryIcon);
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryIcon('📝');
      setNewCategoryColor('');
      setIsAddingCategory(false);
      setShowAdvancedOptions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryName('');
      setNewCategoryIcon('📝');
      setNewCategoryColor('');
      setShowAdvancedOptions(false);
    }
  };



  const getTaskCount = (categoryId: string) => {
    return userData.tasks.filter(task => task.categoryId === categoryId && !task.completed).length;
  };

  const getCompletedCount = (categoryId: string) => {
    // Only display completed tasks from last 14 days for clean UI
    // All completed tasks are still stored in userData.tasks for historical analysis
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    return userData.tasks.filter(task => 
      task.categoryId === categoryId && 
      task.completed && 
      task.updated && 
      new Date(task.updated) >= twoWeeksAgo
    ).length;
  };

  const getTotalTaskCount = () => {
    return userData.tasks.filter(task => !task.completed).length;
  };

  return (
    <TooltipProvider>
      <SidebarHeader className="border-b border-sidebar-border">
        <div 
          className="flex items-center gap-2 px-2 py-4 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
          onClick={() => onPageChange('activity')}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Tabbie</div>
              <div className="text-xs text-muted-foreground">Your AI Assistant</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>{activityStats?.totalPomodoros || 0} 🍅</span>
              </div>

            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard Button */}
        {theme === 'retro' && (
          <div className="px-2 pt-3 pb-2">
            <Button
              onClick={() => onPageChange('dashboard')}
              className="w-full h-12 bg-[#ffe164] dark:bg-[#ffd633] text-gray-900 dark:text-gray-900 hover:bg-[#fff9c4] dark:hover:bg-[#ffe164] hover:text-gray-900 dark:hover:text-gray-900 border-2 border-black dark:border-gray-600 rounded-xl shadow-[6px_6px_0_0_rgba(0,0,0,0.12)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.15)] dark:hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.4)] font-black hover:translate-y-[-2px] transition-all text-base"
            >
              Dashboard
            </Button>
          </div>
        )}
        
        {/* Main Navigation */}
        <SidebarGroup className={theme === 'retro' ? "mt-2" : ""}>
          <SidebarGroupLabel className={theme === 'retro' ? "text-xs font-black uppercase tracking-wider text-foreground mb-2" : ""}>Main</SidebarGroupLabel>
          <SidebarMenu className={theme === 'retro' ? "gap-3" : ""}>
            {!theme || theme !== 'retro' ? (
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onPageChange('dashboard')}
                  isActive={currentPage === 'dashboard'}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null}
            
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => {
                  onPageChange('tasks');
                  onViewChange?.('next7days');
                }}
                isActive={currentPage === 'tasks'}
                className={
                  theme === 'retro' && currentPage === 'tasks'
                    ? "h-12 px-4 !bg-[#d4f1ff] dark:!bg-blue-900/30 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-black"
                    : theme === 'retro'
                    ? "h-12 px-4 border-2 border-transparent hover:bg-[#d4f1ff]/60 dark:hover:bg-blue-900/30 hover:text-gray-900 dark:hover:text-gray-100 hover:border-black dark:hover:border-gray-600 rounded-xl font-bold transition-all"
                    : ""
                }
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tasks</span>
                {getTotalTaskCount() > 0 && (
                  <span className={
                    theme === 'retro'
                      ? "ml-auto text-xs bg-foreground text-background px-2 py-0.5 rounded-md border-2 border-black dark:border-white font-bold shadow-[1px_1px_0_0_rgba(0,0,0,0.5)] dark:shadow-[1px_1px_0_0_rgba(255,255,255,0.3)]"
                      : "ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
                  }>
                    {getTotalTaskCount()}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('pomodoro')}
                isActive={currentPage === 'pomodoro'}
                className={
                  theme === 'retro' && currentPage === 'pomodoro'
                    ? "h-12 px-4 !bg-[#ffd4f4] dark:!bg-pink-900/30 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-black"
                    : theme === 'retro'
                    ? "h-12 px-4 border-2 border-transparent hover:bg-[#ffd4f4]/60 dark:hover:bg-pink-900/30 hover:text-gray-900 dark:hover:text-gray-100 hover:border-black dark:hover:border-gray-600 rounded-xl font-bold transition-all"
                    : ""
                }
              >
                <Clock className="w-4 h-4" />
                <span>Pomodoro</span>
                {pomodoroTimer.isRunning && (
                  <span className={
                    theme === 'retro'
                      ? "ml-auto mr-1.5 w-2.5 h-2.5 bg-orange-500 dark:bg-orange-400 border-2 border-black dark:border-white rounded-sm animate-pulse shadow-[1px_1px_0_0_rgba(0,0,0,0.5)]"
                      : "ml-auto mr-1.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse"
                  }>
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('notes')}
                isActive={currentPage === 'notes'}
                className={
                  theme === 'retro' && currentPage === 'notes'
                    ? "h-12 px-4 !bg-[#96f2d7] dark:!bg-teal-900/30 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-black"
                    : theme === 'retro' ? "h-12 px-4 border-2 border-transparent hover:bg-[#96f2d7]/60 dark:hover:bg-teal-900/30 hover:text-gray-900 dark:hover:text-gray-100 hover:border-black dark:hover:border-gray-600 rounded-xl font-bold transition-all" : ""
                }
              >
                <BookOpen className="w-4 h-4" />
                <span>Notes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('reminders')}
                isActive={currentPage === 'reminders'}
                className={
                  theme === 'retro' && currentPage === 'reminders'
                    ? "h-12 px-4 !bg-[#fff3b0] dark:!bg-yellow-900/30 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-black"
                    : theme === 'retro' ? "h-12 px-4 border-2 border-transparent hover:bg-[#fff3b0]/60 dark:hover:bg-yellow-900/30 hover:text-gray-900 dark:hover:text-gray-100 hover:border-black dark:hover:border-gray-600 rounded-xl font-bold transition-all" : ""
                }
              >
                <Bell className="w-4 h-4" />
                <span>Reminders</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('events')}
                isActive={currentPage === 'events'}
                className={
                  theme === 'retro' && currentPage === 'events'
                    ? "h-12 px-4 !bg-[#ffd4a3] dark:!bg-orange-900/30 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-black"
                    : theme === 'retro' ? "h-12 px-4 border-2 border-transparent hover:bg-[#ffd4a3]/60 dark:hover:bg-orange-900/30 hover:text-gray-900 dark:hover:text-gray-100 hover:border-black dark:hover:border-gray-600 rounded-xl font-bold transition-all" : ""
                }
              >
                <Zap className="w-4 h-4" />
                <span>Events</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('notifications')}
                isActive={currentPage === 'notifications'}
                className={
                  theme === 'retro' && currentPage === 'notifications'
                    ? "h-12 px-4 !bg-[#e9d5ff] dark:!bg-purple-900/30 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-black"
                    : theme === 'retro' ? "h-12 px-4 border-2 border-transparent hover:bg-[#e9d5ff]/60 dark:hover:bg-purple-900/30 hover:text-gray-900 dark:hover:text-gray-100 hover:border-black dark:hover:border-gray-600 rounded-xl font-bold transition-all" : ""
                }
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('activity')}
                isActive={currentPage === 'activity'}
                className={
                  theme === 'retro' && currentPage === 'activity'
                    ? "h-12 px-4 !bg-[#fed7aa] dark:!bg-orange-900/30 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-black"
                    : theme === 'retro' ? "h-12 px-4 border-2 border-transparent hover:bg-[#fed7aa]/60 dark:hover:bg-orange-900/30 hover:text-gray-900 dark:hover:text-gray-100 hover:border-black dark:hover:border-gray-600 rounded-xl font-bold transition-all" : ""
                }
              >
                <BarChart3 className="w-4 h-4" />
                <span>Insight</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('tabbie')}
                isActive={currentPage === 'tabbie'}
                className={
                  theme === 'retro' && currentPage === 'tabbie'
                    ? "h-12 px-4 !bg-[#ffe164] dark:!bg-yellow-900/30 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-black"
                    : theme === 'retro' ? "h-12 px-4 border-2 border-transparent hover:bg-[#ffe164]/60 dark:hover:bg-yellow-900/30 hover:text-gray-900 dark:hover:text-gray-100 hover:border-black dark:hover:border-gray-600 rounded-xl font-bold transition-all" : ""
                }
              >
                <Bot className="w-4 h-4" />
                <span>Tabbie</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>


        {/* Categories - REMOVED, categories now managed in Tasks page */}

        {/* Current Pomodoro Session */}
        {(currentTask || pomodoroTimer.currentSession) && (
          <SidebarGroup>
            <SidebarGroupLabel>Current Session</SidebarGroupLabel>
            <div className={
              theme === 'retro'
                ? "px-3 py-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-[12px] mx-2 border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]"
                : "px-3 py-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-800 rounded-lg mx-2 border border-blue-200 dark:border-gray-600 shadow-sm"
            }>
              <div 
                className={
                  theme === 'retro'
                    ? "text-sm font-black text-gray-900 dark:text-gray-100 mb-3 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                    : "text-sm font-semibold text-blue-900 dark:text-gray-100 mb-3 cursor-pointer hover:text-blue-700 dark:hover:text-gray-300 transition-colors flex items-center gap-2"
                }
                onClick={() => onPageChange('pomodoro')}
                title="Click to view full pomodoro timer"
              >
                <span className="text-lg">
                  {isWorkOverdue ? '⏰' : pomodoroTimer.sessionType === 'work' ? '🍅' : '☕'}
                </span>
                <span className="truncate">{currentTask?.title || 'Pomodoro'}</span>
              </div>
              
              {/* Progress Bar */}
              {pomodoroTimer.currentSession && (
                <div className="mb-3">
                  <div className={
                    theme === 'retro'
                      ? "w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 mb-1 border border-black dark:border-gray-600"
                      : "w-full bg-blue-200 dark:bg-gray-700 rounded-full h-2 mb-1"
                  }>
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isWorkOverdue ? 'bg-orange-500 dark:bg-orange-600' : 
                        isBreakOverdue ? 'bg-red-500 dark:bg-red-600' : 'bg-blue-500 dark:bg-blue-600'
                      }`}
                      style={{ 
                        width: `${Math.max(0, Math.min(100, 
                          ((pomodoroTimer.currentSession.duration * 60 - pomodoroTimer.timeLeft) / 
                          (pomodoroTimer.currentSession.duration * 60)) * 100
                        ))}%` 
                      }}
                    />
                  </div>
                  <div className={
                    theme === 'retro'
                      ? "text-xs text-gray-700 dark:text-gray-300 font-bold"
                      : "text-xs text-blue-600 dark:text-gray-300"
                  }>
                    {Math.round(Math.max(0, Math.min(100, 
                      ((pomodoroTimer.currentSession.duration * 60 - pomodoroTimer.timeLeft) / 
                      (pomodoroTimer.currentSession.duration * 60)) * 100
                    )))}% complete
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className={
                  theme === 'retro'
                    ? "text-sm text-gray-900 dark:text-gray-100"
                    : "text-sm text-blue-700 dark:text-gray-300"
                }>
                  <div className={`font-mono font-bold text-lg ${
                    isWorkOverdue ? 'text-orange-600 dark:text-orange-400' : 
                    isBreakOverdue ? 'text-red-600 dark:text-red-400' : 
                    theme === 'retro' ? 'text-gray-900 dark:text-gray-100' : 'text-blue-800 dark:text-blue-400'
                  }`}>
                    {formatTime(pomodoroTimer.timeLeft)}
                  </div>
                  <div className={
                    theme === 'retro'
                      ? "mt-1 text-xs font-bold text-gray-700 dark:text-gray-300"
                      : "mt-1 text-xs font-medium text-blue-700 dark:text-gray-400"
                  }>
                    {isWorkOverdue ? 'Take break' : 
                     isBreakOverdue ? 'Break over!' :
                     pomodoroTimer.sessionType === 'work' ? 'Focus Time' : 'Break Time'}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {isWorkOverdue ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={completeWorkSession}
                          className={
                            theme === 'retro'
                              ? "h-8 w-8 p-0 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-2 border-transparent hover:border-orange-300 dark:hover:border-orange-700 rounded-md"
                              : "h-8 w-8 p-0 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                          }
                        >
                          <Coffee className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Take Break</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : isBreakOverdue ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={skipBreak}
                          className={
                            theme === 'retro'
                              ? "h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-transparent hover:border-green-300 dark:hover:border-green-700 rounded-md"
                              : "h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                          }
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Continue Working</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : pomodoroTimer.sessionType === 'shortBreak' && pomodoroTimer.isRunning ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={skipBreak}
                          className={
                            theme === 'retro'
                              ? "h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-transparent hover:border-green-300 dark:hover:border-green-700 rounded-md"
                              : "h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                          }
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Skip Break</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : pomodoroTimer.isRunning ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={pausePomodoro}
                          className={
                            theme === 'retro'
                              ? "h-8 w-8 p-0 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 rounded-md"
                              : "h-8 w-8 p-0 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30"
                          }
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Pause Timer</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={resumePomodoro}
                          className={
                            theme === 'retro'
                              ? "h-8 w-8 p-0 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 rounded-md"
                              : "h-8 w-8 p-0 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30"
                          }
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Resume Timer</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={stopPomodoro}
                        className={
                          theme === 'retro'
                            ? "h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700 rounded-md"
                            : "h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                        }
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Stop Session</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-3 py-2">
              <SidebarMenuButton 
                onClick={() => onPageChange('settings')} 
                className={
                  theme === 'retro' && currentPage === 'settings'
                    ? "flex-1 bg-[#ffd4f4]/20 dark:bg-[#ff69b4]/10 text-foreground border-2 border-black dark:border-white rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.1)] font-bold"
                    : theme === 'retro' ? "flex-1 border-2 border-transparent hover:bg-accent/50 hover:border-gray-400 dark:hover:border-gray-600 rounded-md font-medium" : "flex-1"
                }
              >
                <Settings2 className="w-4 h-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </TooltipProvider>
  );
};

export default CategorySidebar; 