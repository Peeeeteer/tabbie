import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, Calendar, X, CalendarDays, List, RotateCcw, MoreVertical, Edit, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTodo } from '@/contexts/TodoContext';
import type { Task } from '@/types/todo';

interface TasksPageProps {
  currentView: 'all' | 'today' | 'tomorrow' | 'next7days' | 'completed' | 'work' | 'coding' | 'hobby' | 'personal';
  onViewChange?: (view: 'all' | 'today' | 'tomorrow' | 'next7days' | 'completed' | 'work' | 'coding' | 'hobby' | 'personal') => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ currentView, onViewChange }) => {
  const {
    userData,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    startPomodoro,
    resetCategoriesToDefault,
  } = useTodo();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [taskCategory, setTaskCategory] = useState<string>('work');
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [autoCreatedTaskId, setAutoCreatedTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>();
  const [editCategory, setEditCategory] = useState<string>('work');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const createPanelRef = React.useRef<HTMLDivElement>(null);
  const editPanelRef = React.useRef<HTMLDivElement>(null);
  const viewPanelRef = React.useRef<HTMLDivElement>(null);
  const navigationRef = React.useRef<HTMLDivElement>(null);

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
      const taskDateString = taskDate.toDateString();
      const todayString = today.toDateString();
      const tomorrowString = tomorrow.toDateString();
      
      // Task should be after tomorrow and within next 7 days
      return taskDateString !== todayString && 
             taskDateString !== tomorrowString && 
             taskDate > tomorrow && 
             taskDate <= next7Days;
    });
  };

  const getAllTasks = () => {
    return userData.tasks.filter(task => !task.completed);
  };

  const getCompletedTasks = () => {
    return userData.tasks.filter(task => task.completed);
  };



  const getTodayTaskCount = () => getTodayTasks().length;
  const getTomorrowTaskCount = () => getTomorrowTasks().length;
  const getNext7DaysTaskCount = () => getNext7DaysTasks().length;
  const getAllTaskCount = () => getAllTasks().length;
  const getCompletedTaskCount = () => getCompletedTasks().length;

  const formatSmartDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (targetDate.getTime() === today.getTime()) {
      return `Today by ${timeStr}`;
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow by ${timeStr}`;
    } else if (targetDate.getTime() < today.getTime()) {
      return `Overdue since ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return `${date.toLocaleDateString('en-US', { weekday: 'long' })} by ${timeStr}`;
      } else {
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} by ${timeStr}`;
      }
    }
  };

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

    // Auto-create task when user starts typing
    if (value.trim() && !autoCreatedTaskId) {
      const categoryId = taskCategory || userData.categories[0]?.id || 'work';
      const newTaskId = addTask(value.trim(), categoryId, '', undefined);
      setAutoCreatedTaskId(newTaskId);
    } else if (!value.trim() && autoCreatedTaskId) {
      // Delete auto-created task if user clears the title
      deleteTask(autoCreatedTaskId);
      setAutoCreatedTaskId(null);
    } else if (value.trim() && autoCreatedTaskId) {
      // Update existing auto-created task
      updateTask(autoCreatedTaskId, { title: value.trim() });
    }
  };

  const handleAddTask = (dueDate?: Date, targetCategoryId?: string, autoCreate = false): string | undefined => {
    if (newTaskTitle.trim() || autoCreate) {
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
      
      const newTaskId = addTask(cleanTitle || 'New Task', categoryId, newTaskDescription, dueDate || newTaskDueDate);
      
      if (!autoCreate) {
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskDueDate(undefined);
        setTaskCategory('work');
        setIsCreatePanelOpen(false);
        setAutoCreatedTaskId(null);
      }
      
      return newTaskId;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, dueDate?: Date) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // If we have an auto-created task, finalize it and close panel
      if (autoCreatedTaskId && newTaskTitle.trim()) {
        // Final update to ensure all form data is saved
        updateTask(autoCreatedTaskId, {
          title: newTaskTitle.trim(),
          description: newTaskDescription,
          dueDate: newTaskDueDate || dueDate,
          categoryId: taskCategory,
        });
        setIsCreatePanelOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskDueDate(undefined);
        setTaskCategory('work');
        setAutoCreatedTaskId(null);
      } else {
        // Create new task normally
        handleAddTask(dueDate);
      }
    }
    if (e.key === 'Escape') {
      setIsCreatePanelOpen(false);
    }
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setIsViewPanelOpen(true);
    setIsEditPanelOpen(false);
    setIsCreatePanelOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditDueDate(task.dueDate);
    setEditCategory(task.categoryId);
    setIsEditPanelOpen(true);
    setIsViewPanelOpen(false);
    // Don't close create panel if it's open - user might want to keep creating
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
  // Helper function to check if the click target should not close panels
  const shouldIgnoreClick = (target: Element): boolean => {
    // Panel and navigation elements
    const isClickingNavigation = navigationRef.current && navigationRef.current.contains(target);
    const isClickingCreatePanel = createPanelRef.current && createPanelRef.current.contains(target);
    const isClickingEditPanel = editPanelRef.current && editPanelRef.current.contains(target);
    const isClickingViewPanel = viewPanelRef.current && viewPanelRef.current.contains(target);
    
    if (isClickingNavigation || isClickingCreatePanel || isClickingEditPanel || isClickingViewPanel) {
      return true;
    }
    
    // Popover/dropdown elements (date picker, category selector, etc.)
    const popoverSelectors = [
      '[data-radix-popper-content-wrapper]',
      '[data-radix-select-content]',
      '[data-radix-popover-content]',
      '[data-radix-calendar]',
      '[data-radix-select-viewport]',
      '[data-radix-select-item]',
      '.react-datepicker',
      '.react-datepicker__tab-loop',
      '[role="dialog"]',
      '[role="listbox"]',
      '[role="menu"]',
      '[role="combobox"]',
      '[role="option"]',
      '[data-state="open"]',
      '.prose', // Rich text editor
      '[data-tippy-root]', // Tooltip elements
      '.ProseMirror', // Rich text editor content
      '.tiptap', // TipTap editor
      '[data-radix-portal]', // Radix portals
    ];
    
    return popoverSelectors.some(selector => target.closest(selector));
  };

  // Update auto-created task when due date, description, or category changes
  React.useEffect(() => {
    if (autoCreatedTaskId && newTaskTitle.trim()) {
      updateTask(autoCreatedTaskId, {
        title: newTaskTitle.trim(),
        description: newTaskDescription,
        dueDate: newTaskDueDate,
        categoryId: taskCategory,
      });
    }
  }, [autoCreatedTaskId, newTaskDescription, newTaskDueDate, taskCategory]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (shouldIgnoreClick(target)) {
        return;
      }
      
      // Close panels when clicking outside
      if (isCreatePanelOpen) {
        setIsCreatePanelOpen(false);
      }
      if (isEditPanelOpen) {
        handleCancelEdit();
      }
      if (isViewPanelOpen) {
        setIsViewPanelOpen(false);
        setViewingTask(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreatePanelOpen, isEditPanelOpen, isViewPanelOpen]);

  

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
            onToggleComplete={() => toggleTaskComplete(task.id)}
            onView={() => handleViewTask(task)}
            onEdit={() => handleEditTask(task)}
            onStartPomodoro={() => startPomodoro(task)}
            onDelete={() => deleteTask(task.id)}
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
      
      case 'tomorrow':
        return (
          <div>
            {renderTaskSection('Tomorrow', getTomorrowTasks(), tomorrow, getTomorrowTaskCount())}
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



  const getViewTitle = () => {
    switch (currentView) {
      case 'all': return 'All Tasks';
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
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
      {/* Main Content Area - Always has margin for consistent sizing */}
      <div className="flex-1 flex flex-col h-full mr-[576px]">
        {/* Header with View Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4 h-10">
              <h1 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h1>
            </div>

            {/* View Navigation Tabs - Aligned with Sidebar */}
            <div ref={navigationRef} className="flex items-center justify-between border-b" style={{ marginLeft: '-24px', paddingLeft: '24px', marginRight: '-24px', paddingRight: '24px' }}>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onViewChange?.('all')}
                  className={`pb-3 px-0.5 border-b-2 font-medium text-sm transition-colors ${
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
                  className={`pb-3 px-0.5 border-b-2 font-medium text-sm transition-colors ${
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
                  onClick={() => onViewChange?.('tomorrow')}
                  className={`pb-3 px-0.5 border-b-2 font-medium text-sm transition-colors ${
                    currentView === 'tomorrow'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Tomorrow
                    {getTomorrowTaskCount() > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {getTomorrowTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onViewChange?.('next7days')}
                  className={`pb-3 px-0.5 border-b-2 font-medium text-sm transition-colors ${
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
                  className={`pb-3 px-0.5 border-b-2 font-medium text-sm transition-colors ${
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
                  <Select value={['work', 'coding', 'hobby', 'personal'].includes(currentView) ? currentView : ''} onValueChange={(value) => onViewChange?.(value as 'work' | 'coding' | 'hobby' | 'personal')}>
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
                    onClick={() => {
                      setIsCreatePanelOpen(true);
                      setIsViewPanelOpen(false);
                      setViewingTask(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-8"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
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
          fixed top-0 right-0 h-full w-[576px] bg-white border-l border-gray-200 
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900">Category</label>
              {userData.categories.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetCategoriesToDefault}
                  className="h-6 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            {userData.categories.length > 0 ? (
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
            ) : (
              <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-md bg-gray-50">
                No categories available. Click "Reset" to restore default categories.
              </div>
            )}
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
            <RichTextEditor
              content={newTaskDescription}
              onChange={setNewTaskDescription}
              placeholder="Add more details..."
              className="min-h-[200px]"
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

          {/* Instructions */}
          <div className="pt-6">
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
              💡 <strong>Tips:</strong> Task is created automatically as you type. Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to finish, <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close.
            </div>
          </div>
        </div>
      </div>

      {/* Right Sliding Panel for Task Editing */}
      <div 
        ref={editPanelRef}
        className={`
          fixed top-0 right-0 h-full w-[576px] bg-white border-l border-gray-200 
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900">Category</label>
              {userData.categories.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetCategoriesToDefault}
                  className="h-6 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            {userData.categories.length > 0 ? (
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
            ) : (
              <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-md bg-gray-50">
                No categories available. Click "Reset" to restore default categories.
              </div>
            )}
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
            <RichTextEditor
              content={editDescription}
              onChange={(content) => {
                setEditDescription(content);
                scheduleAutoSave();
              }}
              placeholder="Add more details..."
              className="min-h-[200px]"
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

      {/* Right Sliding Panel for Task Viewing */}
      <div 
        ref={viewPanelRef}
        className={`
          fixed top-0 right-0 h-full w-[576px] bg-white border-l border-gray-200 
          transform transition-transform duration-300 ease-in-out z-50
          ${isViewPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsViewPanelOpen(false);
                setViewingTask(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => viewingTask && handleEditTask(viewingTask)}
              variant="outline"
              size="sm"
              className="font-medium"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => viewingTask && startPomodoro(viewingTask)}
              className="font-medium"
            >
              <Play className="w-4 h-4 mr-2" />
              Pomodoro
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (viewingTask) {
                  deleteTask(viewingTask.id);
                  setIsViewPanelOpen(false);
                  setViewingTask(null);
                }
              }}
              className="font-medium text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Task View Content */}
        {viewingTask && (
          <div className="flex-1 overflow-y-auto">
            {/* Title Section */}
            <div className="p-6 pb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">
                  {userData.categories.find(cat => cat.id === viewingTask.categoryId)?.icon || '📝'}
                </span>
                <div className="flex-1">
                  <h1 className={`text-2xl font-semibold leading-tight ${
                    viewingTask.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>
                    {viewingTask.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="font-medium">
                      {userData.categories.find(cat => cat.id === viewingTask.categoryId)?.name || 'Unknown'}
                    </span>
                    {viewingTask.dueDate && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatSmartDate(new Date(viewingTask.dueDate))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {viewingTask.description && (
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div 
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: viewingTask.description }}
                  />
                </div>
              </div>
            )}

            {/* Details Section */}
            <div className="px-6 pb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Task Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Status</label>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      viewingTask.completed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {viewingTask.completed ? (
                        <>
                          <CheckSquare className="w-3 h-3" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Created</label>
                    <div className="text-sm text-gray-700">
                      {new Date(viewingTask.created).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Due Date - Full Width if Present */}
                {viewingTask.dueDate && (
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    <label className="text-xs font-medium text-gray-500">Due Date</label>
                                         <div className="flex items-center gap-2 text-sm text-gray-700">
                       <Calendar className="w-4 h-4 text-gray-400" />
                       <span className="font-medium">
                         {formatSmartDate(new Date(viewingTask.dueDate))}
                       </span>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onView: () => void;
  onEdit: () => void;
  onStartPomodoro: () => void;
  onDelete: () => void;
}



const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onView,
  onEdit,
  onStartPomodoro,
  onDelete,
}) => {
  const { userData } = useTodo();
  const completedSessions = task.pomodoroSessions?.filter(s => s.completed).length || 0;
  
  // Get Pomodoro timer state from context
  const { pomodoroTimer } = useTodo();
  const isCurrentTaskPomodoro = pomodoroTimer?.currentSession?.taskId === task.id;

  // Minimal todo item - just title and checkbox
  return (
    <div 
      className="group flex items-center gap-3 py-2 px-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
      onClick={() => onView()}
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
      
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm">
          {userData.categories.find(cat => cat.id === task.categoryId)?.icon || '📝'}
        </span>
        <span className={`
          text-sm font-medium cursor-pointer
          ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}
        `}>
          {task.title}
        </span>
      </div>

      {/* Small indicators and menu */}
      <div className="flex items-center gap-1">
        {/* Always visible indicators */}
        <div className="flex items-center gap-1">
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
        
        {/* Three dots menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Todo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStartPomodoro();
              }}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Pomodoro
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TasksPage; 