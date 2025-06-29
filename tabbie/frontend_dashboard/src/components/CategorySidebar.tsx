import React, { useState } from 'react';
import { 
  Plus, Settings2, X, Monitor, CheckSquare, Clock, Bell, BarChart3, 
  Calendar, Zap, Activity
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
import { useTodo } from '@/contexts/TodoContext';

interface CategorySidebarProps {
  currentPage: 'dashboard' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'timetracking' | 'settings';
  onPageChange: (page: 'dashboard' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'timetracking' | 'settings') => void;
      currentView?: 'all' | 'today' | 'tomorrow' | 'next7days' | 'completed' | 'work' | 'coding' | 'hobby' | 'personal';
  onViewChange?: (view: 'all' | 'today' | 'tomorrow' | 'next7days' | 'completed' | 'work' | 'coding' | 'hobby' | 'personal') => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ currentPage, onPageChange, currentView, onViewChange }) => {
  const {
    userData,
    selectedCategoryId,
    setSelectedCategory,
    addCategory,
    deleteCategory,
    currentTask,
    pomodoroTimer,
  } = useTodo();

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝');

  const categoryColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
  ];

  const categoryIcons = ['📝', '💼', '💻', '🎨', '🏠', '📚', '🎯', '⚡', '🔧', '🎵', '🍎', '✨'];

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const randomColor = categoryColors[Math.floor(Math.random() * categoryColors.length)];
      addCategory(newCategoryName.trim(), randomColor, newCategoryIcon);
      setNewCategoryName('');
      setNewCategoryIcon('📝');
      setIsAddingCategory(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  };

  const getTaskCount = (categoryId: string) => {
    return userData.tasks.filter(task => task.categoryId === categoryId && !task.completed).length;
  };

  const getCompletedCount = (categoryId: string) => {
    return userData.tasks.filter(task => task.categoryId === categoryId && task.completed).length;
  };



  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <div>
              <div className="font-semibold text-sm">Tabbie</div>
              <div className="text-xs text-muted-foreground">Your AI Assistant</div>
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
                onClick={() => {
                  onPageChange('tasks');
                  onViewChange?.('all');
                }}
                isActive={currentPage === 'tasks'}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tasks</span>
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
                onClick={() => onPageChange('pomodoro')}
                isActive={currentPage === 'pomodoro'}
              >
                <Clock className="w-4 h-4" />
                <span>Pomodoro</span>
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
                onClick={() => onPageChange('timetracking')}
                isActive={currentPage === 'timetracking'}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Time Tracking</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>



        {/* Categories - Only show when on tasks page and not on main views */}
        {currentPage === 'tasks' && currentView && !['today', 'tomorrow', 'next7days', 'work', 'coding', 'hobby', 'personal'].includes(currentView) && (
          <SidebarGroup>
            <div className="flex items-center justify-between px-2">
              <SidebarGroupLabel>Lists</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingCategory(true)}
                className="h-6 w-6 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            
            <SidebarMenu>
              {/* Add Category Input */}
              {isAddingCategory && (
                <SidebarMenuItem>
                  <div className="px-2 py-1 space-y-2">
                    <div className="flex gap-1">
                      {categoryIcons.slice(0, 6).map(icon => (
                        <button
                          key={icon}
                          onClick={() => setNewCategoryIcon(icon)}
                          className={`w-6 h-6 text-xs rounded border ${
                            newCategoryIcon === icon
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="List name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleAddCategory} className="h-6 text-xs px-2">
                        Add
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                        }}
                        className="h-6 text-xs px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </SidebarMenuItem>
              )}

              {/* Category List */}
              {userData.categories.map((category) => {
                const taskCount = getTaskCount(category.id);
                const completedCount = getCompletedCount(category.id);
                
                return (
                  <SidebarMenuItem key={category.id}>
                    <div className="flex items-center group">
                      <SidebarMenuButton
                        onClick={() => {
                          setSelectedCategory(category.id);
                        }}
                        isActive={selectedCategoryId === category.id}
                        className="flex-1"
                      >
                        <div className="w-4 h-4 flex items-center justify-center text-sm">
                          {category.icon}
                        </div>
                        <span className="flex-1">{category.name}</span>
                        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          {taskCount > 0 && <span>{taskCount}</span>}
                          {completedCount > 0 && <span className="text-green-600">+{completedCount}</span>}
                        </div>
                      </SidebarMenuButton>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent text-red-600 hover:text-red-700"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Current Pomodoro Session */}
        {(currentTask || pomodoroTimer.currentSession) && (
          <SidebarGroup>
            <SidebarGroupLabel>Current Session</SidebarGroupLabel>
            <div className="px-2 py-2 bg-blue-50 rounded-lg mx-2">
              <div className="text-xs font-medium text-blue-900 mb-1">
                🍅 {currentTask?.title || 'Pomodoro'}
              </div>
              <div className="text-xs text-blue-700">
                {pomodoroTimer.isRunning ? 'Running' : 'Paused'} • {
                  Math.floor(pomodoroTimer.timeLeft / 60)
                }:{
                  (pomodoroTimer.timeLeft % 60).toString().padStart(2, '0')
                }
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onPageChange('settings')}>
              <Settings2 className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
};

export default CategorySidebar; 