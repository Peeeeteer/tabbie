import React, { useState } from 'react';
import { Plus, Play, CheckSquare, Clock, Calendar, Edit3, Save, X, CalendarDays, List, ChevronDown, Hash, User, Briefcase, Code, Palette, Home, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTodo } from '@/contexts/TodoContext';
import type { Task } from '@/types/todo';

interface TasksPageProps {
  currentView: 'all' | 'today' | 'next7days' | 'completed' | 'work' | 'coding' | 'hobby' | 'personal';
  onViewChange?: (view: 'all' | 'today' | 'next7days' | 'completed' | 'work' | 'coding' | 'hobby' | 'personal') => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ currentView, onViewChange }) => {
  const {
    userData,
    selectedCategoryId,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    startPomodoro,
    pomodoroTimer,
  } = useTodo();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [taskCategory, setTaskCategory] = useState<string>('work');
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  const getTodayTasks = () => {
    return userData.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === today.toDateString();
    });
  };

  const getTomorrowTasks = () => {
    return userData.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === tomorrow.toDateString();
    });
  };

  const getNext7DaysTasks = () => {
    return userData.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate > tomorrow && taskDate <= next7Days;
    });
  };

  const getAllTasks = () => {
    return userData.tasks.filter(task => !task.completed);
  };

  const getCompletedTasks = () => {
    return userData.tasks.filter(task => task.completed);
  };

  const getCategoryTasks = () => {
    if (!selectedCategoryId) return [];
    return userData.tasks.filter(task => 
      task.categoryId === selectedCategoryId && !task.completed
    );
  };

  const getTodayTaskCount = () => getTodayTasks().length;
  const getNext7DaysTaskCount = () => getTomorrowTasks().length + getNext7DaysTasks().length;
  const getAllTaskCount = () => getAllTasks().length;
  const getCompletedTaskCount = () => getCompletedTasks().length;

  const handleTaskTitleChange = (value: string) => {
    setNewTaskTitle(value);
    
    // Handle @ mentions for category selection
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const mention = value.substring(atIndex + 1).toLowerCase();
      const matchingCategory = userData.categories.find(cat => 
        cat.name.toLowerCase().startsWith(mention) || cat.id.toLowerCase().startsWith(mention)
      );
      if (matchingCategory) {
        setTaskCategory(matchingCategory.id);
      }
    }
  };

  const handleAddTask = (dueDate?: Date, targetCategoryId?: string) => {
    if (newTaskTitle.trim()) {
      let categoryId = targetCategoryId || taskCategory;
      
      // Remove @ mentions from the title
      let cleanTitle = newTaskTitle.trim();
      const atIndex = cleanTitle.lastIndexOf('@');
      if (atIndex !== -1) {
        const beforeAt = cleanTitle.substring(0, atIndex).trim();
        cleanTitle = beforeAt;
      }
      
      // If no specific category provided, use the selected category from the form
      if (!categoryId) {
        categoryId = taskCategory || userData.categories[0]?.id || 'work';
      }
      
      addTask(cleanTitle, categoryId, newTaskDescription, newTaskDueDate || dueDate);
      
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate(undefined);
      setTaskCategory('work');
      setIsCreatePanelOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, dueDate?: Date) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask(dueDate);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const handleSaveEdit = () => {
    if (editingTask) {
      updateTask(editingTask, {
        title: editTitle,
        description: editDescription,
      });
      setEditingTask(null);
      setEditTitle('');
      setEditDescription('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
  };

  const selectedCategory = userData.categories.find(cat => cat.id === selectedCategoryId);

  const getCategoryTasksByType = (categoryType: string) => {
    const category = userData.categories.find(cat => cat.id === categoryType);
    if (!category) return [];
    return userData.tasks.filter(task => 
      task.categoryId === category.id && !task.completed
    );
  };

  const getCategoryTaskCount = (categoryType: string) => {
    return getCategoryTasksByType(categoryType).length;
  };

  const renderCategoryTasks = (categoryId: string, icon: string, name: string) => {
    const tasks = getCategoryTasksByType(categoryId);
    return renderTaskSection(`${icon} ${name}`, tasks, undefined, tasks.length);
  };

  const renderTaskSection = (title: string, tasks: Task[], sectionDate?: Date, count?: number) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          {count !== undefined && count > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{count}</span>
          )}
        </div>
        {sectionDate && (
          <div className="text-sm text-gray-500">
            {sectionDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isEditing={editingTask === task.id}
            editTitle={editTitle}
            editDescription={editDescription}
            onEditTitleChange={setEditTitle}
            onEditDescriptionChange={setEditDescription}
            onToggleComplete={() => toggleTaskComplete(task.id)}
            onStartPomodoro={() => startPomodoro(task)}
            onEdit={() => handleEditTask(task)}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            canStartPomodoro={!pomodoroTimer.isRunning}
            showTime={true}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-3">✨</div>
            <p className="text-gray-500">No tasks {title.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'all':
        return renderTaskSection('All Tasks', getAllTasks(), undefined, getAllTaskCount());
      
      case 'today':
        return (
          <div>
            {renderTaskSection('Today', getTodayTasks(), today, getTodayTaskCount())}
          </div>
        );
      
      case 'next7days':
        return (
          <div>
            {renderTaskSection('Today', getTodayTasks(), today, getTodayTaskCount())}
            {renderTaskSection('Tomorrow', getTomorrowTasks(), tomorrow, getTomorrowTasks().length)}
            {renderTaskSection('Next 7 Days', getNext7DaysTasks(), undefined, getNext7DaysTasks().length)}
          </div>
        );
      
      case 'completed':
        return renderTaskSection('Completed Tasks', getCompletedTasks(), undefined, getCompletedTaskCount());
      
      case 'work':
        return renderCategoryTasks('work', '💼', 'Work');
      
      case 'coding':
        return renderCategoryTasks('coding', '💻', 'Coding');
      
      case 'hobby':
        return renderCategoryTasks('hobby', '🎨', 'Hobby');
      
      case 'personal':
        return renderCategoryTasks('personal', '🏠', 'Personal');
      
      default:
        return <div>Select a view</div>;
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'work': return <Briefcase className="w-4 h-4" />;
      case 'coding': return <Code className="w-4 h-4" />;
      case 'hobby': return <Palette className="w-4 h-4" />;
      case 'personal': return <Home className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'all': return 'All Tasks';
      case 'today': return 'Today';
      case 'next7days': return 'Next 7 Days';
      case 'completed': return 'Completed';
      case 'work': return 'Work Tasks';
      case 'coding': return 'Coding Tasks';
      case 'hobby': return 'Hobby Tasks';
      case 'personal': return 'Personal Tasks';
      default: return 'Tasks';
    }
  };

  return (
    <div className="flex h-full bg-white relative">
      {/* Main Content Area - Full Width */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isCreatePanelOpen ? 'mr-96' : 'mr-0'}`}>
        {/* Header with View Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4 h-10">
              <h1 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h1>
              <span className="text-sm text-gray-500 h-10 flex items-center">
                {today.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>

            {/* View Navigation Tabs - Aligned with Sidebar */}
            <div className="flex items-center justify-between border-b" style={{ marginLeft: '-24px', paddingLeft: '24px', marginRight: '-24px', paddingRight: '24px' }}>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => onViewChange?.('all')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentView === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    All
                    {getAllTaskCount() > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {getAllTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onViewChange?.('today')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentView === 'today'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Today
                    {getTodayTaskCount() > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {getTodayTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onViewChange?.('next7days')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentView === 'next7days'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Next 7 Days
                    {getNext7DaysTaskCount() > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {getNext7DaysTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onViewChange?.('completed')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentView === 'completed'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Completed
                    {getCompletedTaskCount() > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {getCompletedTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                {/* Category Dropdown - Next to other tabs */}
                <div className="pb-3">
                  <Select value={['work', 'coding', 'hobby', 'personal'].includes(currentView) ? currentView : ''} onValueChange={(value) => onViewChange?.(value as any)}>
                    <SelectTrigger className="w-32 h-8 border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">
                        <div className="flex items-center gap-2">
                          <span>💼</span>
                          <span>Work</span>
                          {getCategoryTaskCount('work') > 0 && (
                            <span className="ml-auto bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                              {getCategoryTaskCount('work')}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="coding">
                        <div className="flex items-center gap-2">
                          <span>💻</span>
                          <span>Coding</span>
                          {getCategoryTaskCount('coding') > 0 && (
                            <span className="ml-auto bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                              {getCategoryTaskCount('coding')}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="hobby">
                        <div className="flex items-center gap-2">
                          <span>🎨</span>
                          <span>Hobby</span>
                          {getCategoryTaskCount('hobby') > 0 && (
                            <span className="ml-auto bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                              {getCategoryTaskCount('hobby')}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="personal">
                        <div className="flex items-center gap-2">
                          <span>🏠</span>
                          <span>Personal</span>
                          {getCategoryTaskCount('personal') > 0 && (
                            <span className="ml-auto bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                              {getCategoryTaskCount('personal')}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add Task Button - Same height as tabs */}
              <div className="pb-3">
                <Button 
                  onClick={() => setIsCreatePanelOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-8"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {renderContent()}
        </div>
      </div>

      {/* Right Sliding Panel for Task Creation */}
      <div className={`
        fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 
        transform transition-transform duration-300 ease-in-out z-50 shadow-2xl
        ${isCreatePanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Panel Header - Matching main content style */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCreatePanelOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Continuation line */}
          <div className="border-b border-gray-200" style={{ marginLeft: '-24px', marginRight: '-24px' }}></div>
        </div>

        {/* Task Creation Form */}
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Category Selection - Moved up */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Category</label>
            <Select value={taskCategory} onValueChange={setTaskCategory}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                {userData.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">What do you need to do?</label>
            <Input
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChange={(e) => handleTaskTitleChange(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-base"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Description</label>
            <Textarea
              placeholder="Add more details..."
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px] resize-none"
            />
          </div>



          {/* Due Date & Time */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Due Date & Time</label>
            <DateTimePicker
              date={newTaskDueDate}
              onDateChange={setNewTaskDueDate}
              placeholder="Pick date and time"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-3">
            <Button 
              onClick={() => handleAddTask()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={!newTaskTitle.trim()}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Task
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setNewTaskTitle('');
                  setNewTaskDescription('');
                  setNewTaskDueDate(undefined);
                  setTaskCategory('work');
                }}
              >
                Clear
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setIsCreatePanelOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              ✨ Pro Tips
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                Use @work, @coding, @hobby, @personal for quick category assignment
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                Press Enter to instantly create your task
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                Add descriptions for complex or important tasks
              </li>
            </ul>
          </div>
        </div>
      </div>


    </div>
  );
};

interface TaskItemProps {
  task: Task;
  isEditing: boolean;
  editTitle: string;
  editDescription: string;
  onEditTitleChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onToggleComplete: () => void;
  onStartPomodoro: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  canStartPomodoro: boolean;
  showTime?: boolean;
}

// Pomodoro Progress Circle Component
const PomodoroProgress: React.FC<{ 
  isRunning: boolean; 
  timeLeft: number; 
  totalTime: number; 
  onToggle: () => void;
}> = ({ isRunning, timeLeft, totalTime, onToggle }) => {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
      <div className="relative w-6 h-6">
        <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 28 28">
          <circle
            cx="14"
            cy="14"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-red-200"
          />
          <circle
            cx="14"
            cy="14"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-red-500 transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-red-600">🍅</span>
        </div>
      </div>
      <span className="text-xs font-medium text-red-700">
        {formatTime(timeLeft)}
      </span>
      <button
        onClick={onToggle}
        className="ml-1 p-1 hover:bg-red-100 rounded transition-colors"
      >
        {isRunning ? (
          <Pause className="w-3 h-3 text-red-600" />
        ) : (
          <Play className="w-3 h-3 text-red-600" />
        )}
      </button>
    </div>
  );
};

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isEditing,
  editTitle,
  editDescription,
  onEditTitleChange,
  onEditDescriptionChange,
  onToggleComplete,
  onStartPomodoro,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  canStartPomodoro,
  showTime = false,
}) => {
  const categoryConfig = {
    work: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    personal: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    coding: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    hobby: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  }[task.categoryId] || { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-gradient-to-r from-red-50/50 to-transparent';
      case 'medium': return 'border-l-blue-400 bg-gradient-to-r from-blue-50/50 to-transparent';
      case 'low': return 'border-l-green-400 bg-gradient-to-r from-green-50/50 to-transparent';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const now = new Date();
    const isToday = dueDate.toDateString() === now.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return `Today ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (isTomorrow) return `Tomorrow ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const completedSessions = task.pomodoroSessions?.filter(s => s.completed).length || 0;
  
  // Get Pomodoro timer state from context
  const { pomodoroTimer, currentTask, pausePomodoro, resumePomodoro } = useTodo();
  const isCurrentTaskPomodoro = pomodoroTimer?.currentSession?.taskId === task.id;
  
  const handlePomodoroToggle = () => {
    if (isCurrentTaskPomodoro) {
      if (pomodoroTimer.isRunning) {
        pausePomodoro();
      } else {
        resumePomodoro();
      }
    } else {
      onStartPomodoro();
    }
  };

  if (isEditing) {
    return (
      <div className="p-5 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
        <div className="space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            placeholder="Task title"
            className="font-medium text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Textarea
            value={editDescription}
            onChange={(e) => onEditDescriptionChange(e.target.value)}
            placeholder="Add a description..."
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSaveEdit} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="border-gray-300">
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      group p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all duration-200 
      ${getPriorityColor(task.priority)}
      ${task.completed ? 'opacity-70' : 'hover:translate-y-[-1px]'}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button
            onClick={onToggleComplete}
            className={`
              mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform
              ${task.completed 
                ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white scale-110 shadow-lg animate-pulse' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-105'
              }
            `}
          >
            {task.completed && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={`
              font-semibold text-gray-900 leading-snug
              ${task.completed ? 'line-through text-gray-500' : ''}
            `}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className={`
                text-sm mt-2 leading-relaxed
                ${task.completed ? 'text-gray-400' : 'text-gray-600'}
              `}>
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className={`
                inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                ${categoryConfig.color} ${categoryConfig.bg} ${categoryConfig.border}
              `}>
                {task.categoryId.charAt(0).toUpperCase() + task.categoryId.slice(1)}
              </span>
              
              {task.dueDate && showTime && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {formatDueDate(task.dueDate.toISOString())}
                </span>
              )}
              
              {/* Show Pomodoro Progress if this task is currently running */}
              {isCurrentTaskPomodoro && pomodoroTimer && (
                <PomodoroProgress
                  isRunning={pomodoroTimer.isRunning}
                  timeLeft={pomodoroTimer.timeLeft}
                  totalTime={25 * 60} // 25 minutes default
                  onToggle={handlePomodoroToggle}
                />
              )}
              
              {completedSessions > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                  🍅 {completedSessions}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit task"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          {canStartPomodoro && !task.completed && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePomodoroToggle}
              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={isCurrentTaskPomodoro ? (pomodoroTimer.isRunning ? "Pause Pomodoro" : "Resume Pomodoro") : "Start Pomodoro"}
            >
              {isCurrentTaskPomodoro && pomodoroTimer.isRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage; 