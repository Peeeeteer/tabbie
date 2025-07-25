import React, { useState } from 'react';
import { 
  Plus, Settings2, X, Monitor, CheckSquare, Clock, Bell, BarChart3, 
  Calendar, Zap, Activity, ChevronDown, ChevronRight, AlertTriangle,
  Palette, MoreHorizontal, Trophy, Wrench, Play, Pause, Square, Coffee, SkipForward
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
  currentPage: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'settings';
  onPageChange: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'settings') => void;
      currentView?: 'today' | 'tomorrow' | 'next7days' | 'completed' | string; // Allow any string for dynamic category IDs
  onViewChange?: (view: 'today' | 'tomorrow' | 'next7days' | 'completed' | string) => void; // Allow any string for dynamic category IDs
  activityStats?: {
    totalXP: number;
    totalPomodoros: number;
  };
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ 
  currentPage, 
  onPageChange, 
  currentView: _currentView,
  onViewChange,
  activityStats
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
                <span>{activityStats?.totalXP || 0} XP</span>
                <span>•</span>
                <span>{activityStats?.totalPomodoros || 0} 🍅</span>
              </div>

            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('dashboard')}
                isActive={currentPage === 'dashboard'}
              >
                <Monitor className="w-4 h-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('yourtabbie')}
                isActive={currentPage === 'yourtabbie'}
              >
                <Wrench className="w-4 h-4" />
                <span>Your Tabbie</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => {
                  onPageChange('tasks');
                  onViewChange?.('next7days');
                }}
                isActive={currentPage === 'tasks'}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tasks</span>
                {getTotalTaskCount() > 0 && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {getTotalTaskCount()}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('pomodoro')}
                isActive={currentPage === 'pomodoro'}
              >
                <Clock className="w-4 h-4" />
                <span>Pomodoro</span>
                {pomodoroTimer.isRunning && (
                  <span className="ml-auto mr-1.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse">
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('reminders')}
                isActive={currentPage === 'reminders'}
              >
                <Bell className="w-4 h-4" />
                <span>Reminders</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('events')}
                isActive={currentPage === 'events'}
              >
                <Zap className="w-4 h-4" />
                <span>Events</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('notifications')}
                isActive={currentPage === 'notifications'}
              >
                <Activity className="w-4 h-4" />
                <span>Notifications</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('calendar')}
                isActive={currentPage === 'calendar'}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onPageChange('activity')}
                isActive={currentPage === 'activity'}
              >
                <Activity className="w-4 h-4" />
                <span>Activity</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Gamification Hint */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="relative mx-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 group hover:bg-blue-50 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Upgrade Tabbie</div>
                      <div className="text-xs text-gray-500">0 XP • Coming soon</div>
                    </div>
                  </div>
                  <div className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                    Soon
                  </div>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Enhanced Categories Section - Always visible on tasks page */}
        {currentPage === 'tasks' && (
          <SidebarGroup>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCategoriesCollapsed(!categoriesCollapsed)}
                  className="flex items-center gap-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded p-1 transition-colors"
                >
                  {categoriesCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <SidebarGroupLabel className="cursor-pointer">Categories</SidebarGroupLabel>
                </button>
                {userData.categories.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {userData.categories.length}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {userData.categories.length === 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetCategoriesToDefault}
                    className="h-6 text-xs px-2 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Quick Start
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCategory(true)}
                    className="h-7 w-7 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {!categoriesCollapsed && (
              <SidebarMenu>
                {/* Enhanced Add Category Section */}
                {isAddingCategory && (
                  <SidebarMenuItem>
                    <div className="px-3 py-3 space-y-3 bg-sidebar-accent/30 rounded-lg mx-2 border border-sidebar-border">
                      {/* Category Name Input */}
                      <div className="space-y-1">
                        <Input
                          placeholder="Category name (e.g., Work, Personal)"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={handleKeyPress}
                          className="h-8 text-sm border-sidebar-border focus:border-blue-500"
                          autoFocus
                        />
                      </div>

                      {/* Icon Selection - Always visible */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Icon</div>
                        <div className="grid grid-cols-6 gap-1">
                          {categoryIcons.slice(0, showAdvancedOptions ? categoryIcons.length : 6).map(icon => (
                            <button
                              key={icon}
                              onClick={() => setNewCategoryIcon(icon)}
                              className={`w-7 h-7 text-sm rounded border transition-colors ${
                                newCategoryIcon === icon
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-sidebar-border hover:border-gray-300 hover:bg-sidebar-accent'
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Progressive Disclosure for Advanced Options */}
                      {showAdvancedOptions && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Color</div>
                          <div className="grid grid-cols-8 gap-1">
                            {categoryColors.map(color => (
                              <button
                                key={color}
                                onClick={() => setNewCategoryColor(color)}
                                className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                                  newCategoryColor === color
                                    ? 'border-gray-800 shadow-sm'
                                    : 'border-gray-200'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim()}
                            className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700"
                          >
                            Create
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setIsAddingCategory(false);
                              setNewCategoryName('');
                              setNewCategoryIcon('📝');
                              setNewCategoryColor('');
                              setShowAdvancedOptions(false);
                            }}
                            className="h-7 text-xs px-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                          className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                        >
                          {showAdvancedOptions ? 'Less' : 'More'}
                          <Palette className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </SidebarMenuItem>
                )}

                {/* Empty State */}
                {userData.categories.length === 0 && !isAddingCategory && (
                  <SidebarMenuItem>
                    <div className="px-3 py-4 text-center space-y-2 bg-sidebar-accent/20 rounded-lg mx-2 border border-dashed border-sidebar-border">
                      <div className="text-2xl">📂</div>
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium">No categories yet</div>
                        <div>Organize your tasks with categories</div>
                      </div>
                    </div>
                  </SidebarMenuItem>
                )}

                {/* Enhanced Category List */}
                {userData.categories.map((category) => {
                  const taskCount = getTaskCount(category.id);
                  const completedCount = getCompletedCount(category.id);
                  
                  return (
                    <SidebarMenuItem key={category.id}>
                      <div className="flex items-center group">
                        <SidebarMenuButton
                          onClick={() => {
                            setSelectedCategory(category.id);
                            onViewChange?.(category.id as any);
                          }}
                          isActive={_currentView === category.id}
                          className="flex-1"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center text-sm">
                              {category.icon}
                            </div>
                            <div 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                          <span className="flex-1">{category.name}</span>
                          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                            {taskCount > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded cursor-help">{taskCount}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{taskCount} active task{taskCount !== 1 ? 's' : ''}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {completedCount > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-green-600 cursor-help">+{completedCount}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{completedCount} completed in last 2 weeks</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </SidebarMenuButton>
                        
                        {/* Simple Delete with Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm(`Delete "${category.name}" category? ${taskCount > 0 ? `This will also delete ${taskCount} tasks.` : ''}`)) {
                                  deleteCategory(category.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <AlertTriangle className="w-3 h-3 mr-2" />
                              Delete
                              {taskCount > 0 && (
                                <span className="ml-auto text-xs">({taskCount} tasks)</span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroup>
        )}

                {/* Current Pomodoro Session */}
        {(currentTask || pomodoroTimer.currentSession) && (
          <SidebarGroup>
            <SidebarGroupLabel>Current Session</SidebarGroupLabel>
            <div className="px-3 py-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mx-2 border border-blue-200 shadow-sm">
              <div 
                className="text-sm font-semibold text-blue-900 mb-3 cursor-pointer hover:text-blue-700 transition-colors flex items-center gap-2"
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
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isWorkOverdue ? 'bg-orange-500' : 
                        isBreakOverdue ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${Math.max(0, Math.min(100, 
                          ((pomodoroTimer.currentSession.duration * 60 - pomodoroTimer.timeLeft) / 
                          (pomodoroTimer.currentSession.duration * 60)) * 100
                        ))}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-blue-600">
                    {Math.round(Math.max(0, Math.min(100, 
                      ((pomodoroTimer.currentSession.duration * 60 - pomodoroTimer.timeLeft) / 
                      (pomodoroTimer.currentSession.duration * 60)) * 100
                    )))}% complete
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700">
                  <div className={`font-mono font-bold text-lg ${
                    isWorkOverdue ? 'text-orange-600' : 
                    isBreakOverdue ? 'text-green-600' : 
                    'text-blue-800'
                  }`}>
                    {formatTime(pomodoroTimer.timeLeft)}
                  </div>
                  <div className="mt-1 text-xs font-medium">
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
                          className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-100"
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
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
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
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
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
                          className="h-8 w-8 p-0 text-blue-700 hover:bg-blue-200"
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
                          className="h-8 w-8 p-0 text-blue-700 hover:bg-blue-200"
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
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
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
              <SidebarMenuButton onClick={() => onPageChange('settings')} className="flex-1">
                <Settings2 className="w-4 h-4" />
                <span>Settings</span>
              </SidebarMenuButton>
              <div className="ml-2">
                <DarkModeToggle variant="switch" size="sm" showIcon={false} />
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </TooltipProvider>
  );
};

export default CategorySidebar; 