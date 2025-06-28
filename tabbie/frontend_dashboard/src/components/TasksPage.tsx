import React, { useState } from 'react';
import { Plus, Play, CheckSquare, Clock, Calendar, Edit3, Save, X, CalendarDays, List, ChevronDown, Hash, User, Briefcase, Code, Palette, Home, Pause, RotateCcw } from 'lucide-react';
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
    resetCategoriesToDefault,
  } = useTodo();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [taskCategory, setTaskCategory] = useState<string>('work');
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>();
  const [editCategory, setEditCategory] = useState<string>('work');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const createPanelRef = React.useRef<HTMLDivElement>(null);
  const editPanelRef = React.useRef<HTMLDivElement>(null);

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
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditDueDate(task.dueDate);
    setEditCategory(task.categoryId);
    setIsEditPanelOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingTask && editTitle.trim()) {
      updateTask(editingTask.id, {
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate,
        categoryId: editCategory,
      });
      setEditingTask(null);
      setEditTitle('');
      setEditDescription('');
      setEditDueDate(undefined);
      setEditCategory('work');
      setIsEditPanelOpen(false);
    }
  };

  const handleCancelEdit = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      setAutoSaveTimeout(null);
    }
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
    setEditDueDate(undefined);
    setEditCategory('work');
    setIsEditPanelOpen(false);
  };

  const autoSaveTask = () => {
    if (editingTask && editTitle.trim()) {
      updateTask(editingTask.id, {
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate,
        categoryId: editCategory,
      });
    }
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeoutId = setTimeout(autoSaveTask, 500);
    setAutoSaveTimeout(timeoutId);
  };

  // Handle outside clicks
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCreatePanelOpen && createPanelRef.current && !createPanelRef.current.contains(event.target as Node)) {
        setIsCreatePanelOpen(false);
      }
      if (isEditPanelOpen && editPanelRef.current && !editPanelRef.current.contains(event.target as Node)) {
        handleCancelEdit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreatePanelOpen, isEditPanelOpen]);

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
            isEditing={false}
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
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${(isCreatePanelOpen || isEditPanelOpen) ? 'mr-96' : 'mr-0'}`}>
        {/* Header with View Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4 h-10">
              <h1 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h1>
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

                {/* Category Dropdown and Add Task Button - Next to other tabs */}
                <div className="pb-3 flex items-center gap-3">
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {renderContent()}
        </div>
      </div>

      {/* Right Sliding Panel for Task Creation */}
      <div 
        ref={createPanelRef}
        className={`
          fixed top-20 right-4 h-[calc(100vh-6rem)] w-96 bg-white border border-gray-200 rounded-lg shadow-xl
          transform transition-transform duration-300 ease-in-out z-50
          ${isCreatePanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className="bg-white border-b border-gray-200 p-6 pb-0">
          <div className="flex items-center justify-between mb-4 h-10">
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
          <div className="pb-3"></div>
        </div>

        {/* Task Creation Form */}
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Category Selection */}
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
              onDateChange={(date) => {
                setNewTaskDueDate(date);
                // Auto-close panel when date is selected via shortcuts
                if (date) {
                  setTimeout(() => setIsCreatePanelOpen(false), 100);
                }
              }}
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

      {/* Right Sliding Panel for Task Editing */}
      <div 
        ref={editPanelRef}
        className={`
          fixed top-20 right-4 h-[calc(100vh-6rem)] w-96 bg-white border border-gray-200 rounded-lg shadow-xl
          transform transition-transform duration-300 ease-in-out z-50
          ${isEditPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className="bg-white border-b border-gray-200 p-6 pb-0">
          <div className="flex items-center justify-between mb-4 h-10">
            <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="pb-3"></div>
        </div>

        {/* Task Edit Form */}
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Category</label>
            <Select value={editCategory} onValueChange={(value) => {
              setEditCategory(value);
              scheduleAutoSave();
            }}>
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
            <label className="text-sm font-semibold text-gray-900">Title</label>
            <Input
              placeholder="Enter task title..."
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                scheduleAutoSave();
              }}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-base"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Description</label>
            <Textarea
              placeholder="Add more details..."
              value={editDescription}
              onChange={(e) => {
                setEditDescription(e.target.value);
                scheduleAutoSave();
              }}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px] resize-none"
            />
          </div>

          {/* Due Date & Time */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Due Date & Time</label>
            <DateTimePicker
              date={editDueDate}
              onDateChange={(date) => {
                setEditDueDate(date);
                scheduleAutoSave();
                // Auto-close panel when date is selected via shortcuts
                if (date) {
                  setTimeout(() => setIsEditPanelOpen(false), 100);
                }
              }}
              placeholder="Pick date and time"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Auto-save indicator */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            ✨ Changes are automatically saved as you type
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

  // Minimal todo item - just title and checkbox
  return (
    <div 
      className="group flex items-center gap-3 py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
      onClick={() => onEdit()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className={`
          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
          ${task.completed 
            ? 'bg-blue-500 border-blue-500 text-white' 
            : 'border-gray-300 hover:border-blue-400'
          }
        `}
      >
        {task.completed && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <span className={`
          text-sm font-medium cursor-pointer
          ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}
        `}>
          {task.title}
        </span>
      </div>

      {/* Small indicators */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.dueDate && (
          <Clock className="w-3 h-3 text-gray-400" />
        )}
        {completedSessions > 0 && (
          <span className="text-xs text-gray-400">🍅{completedSessions}</span>
        )}
        {isCurrentTaskPomodoro && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </div>
    </div>
  );
};

export default TasksPage; 