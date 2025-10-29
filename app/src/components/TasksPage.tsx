import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, Calendar, X, CalendarDays, RotateCcw, MoreVertical, Edit, Play, Trash2, Eye, GripVertical, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Slider } from '@/components/ui/slider';
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
import { useTabbieSync } from '@/contexts/TabbieContext';
import type { Task } from '@/types/todo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

  import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
  } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TasksPageProps {
  currentView: 'today' | 'tomorrow' | 'next7days' | 'completed' | string; // Allow any string for dynamic category IDs
  onViewChange?: (view: 'today' | 'tomorrow' | 'next7days' | 'completed' | string) => void; // Allow any string for dynamic category IDs
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings') => void;
  theme?: 'clean' | 'retro';
}

const TasksPage: React.FC<TasksPageProps> = ({ currentView, onViewChange, onPageChange, theme = 'clean' }) => {
  const {
    userData,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    startPomodoro,
    stopPomodoro,
    resetCategoriesToDefault,
    reorderTasks,
    pomodoroTimer,
    addCategory,
    deleteCategory,
  } = useTodo();
  
  const { triggerTaskCompletion } = useTabbieSync();

  // Wrapper to trigger love animation when completing a task
  const handleToggleTaskComplete = (taskId: string) => {
    const task = userData.tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      // If this task has an active pomodoro running, stop it first
      if (pomodoroTimer?.currentSession?.taskId === taskId) {
        stopPomodoro();
      }
      
      // Task is being completed - trigger love animation
      triggerTaskCompletion(task.title);
    }
    toggleTaskComplete(taskId);
  };

  // Category creation options
  const categoryIcons = ['📝', '💼', '🎨', '🏠', '💪', '🎯', '📚', '🛒', '💡', '🎮', '🎵', '✈️', '🍔', '💰', '🔧', '📱'];
  const categoryColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
    '#F97316', '#14B8A6', '#6366F1', '#A855F7', '#EAB308', '#22C55E', '#F43F5E', '#06B6D4'
  ];

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [newTaskEstimatedPomodoros, setNewTaskEstimatedPomodoros] = useState<number>(3);
  const [taskCategory, setTaskCategory] = useState<string | undefined>('work');
  const [newTaskWorkspaceUrls, setNewTaskWorkspaceUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [autoCreatedTaskId, setAutoCreatedTaskId] = useState<string | null>(null);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [isUnscheduledCollapsed, setIsUnscheduledCollapsed] = useState(false);
  const [isTomorrowCollapsed, setIsTomorrowCollapsed] = useState(false);
  const [isNext7DaysCollapsed, setIsNext7DaysCollapsed] = useState(false);
  const [isTodayCollapsed, setIsTodayCollapsed] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>();
  const [editEstimatedPomodoros, setEditEstimatedPomodoros] = useState<number>(3);
  const [editCategory, setEditCategory] = useState<string | undefined>('work');
  const [editWorkspaceUrls, setEditWorkspaceUrls] = useState<string[]>([]);
  const [editUrlInput, setEditUrlInput] = useState('');
  const autoSaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTaskRef = React.useRef<() => void>(() => {});
  const [completedTasksDateFilter, setCompletedTasksDateFilter] = useState<'7days' | '30days' | 'all'>('30days');
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝');
  const [newCategoryColor, setNewCategoryColor] = useState('');
  const [completedTasksPage, setCompletedTasksPage] = useState(1);
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string; taskCount: number } | null>(null);

  // Function to reset the create task form
  const resetCreateTaskForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate(undefined);
    setNewTaskEstimatedPomodoros(3);
    setTaskCategory(undefined);
    setNewTaskWorkspaceUrls([]);
    setNewUrlInput('');
    setAutoCreatedTaskId(null);
  };

  const createPanelRef = React.useRef<HTMLDivElement>(null);
  const editPanelRef = React.useRef<HTMLDivElement>(null);
  const viewPanelRef = React.useRef<HTMLDivElement>(null);
  const navigationRef = React.useRef<HTMLDivElement>(null);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Timezone-aware date utilities
  const getLocalDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const today = getLocalDate(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  const getTodayTasks = () => {
    return userData.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const taskDate = getLocalDate(new Date(task.dueDate));
      
      // Include today's tasks AND overdue tasks (due date is before today)
      return taskDate.getTime() <= today.getTime();
    }).sort((a, b) => {
      // Sort overdue tasks first (by due date ascending), then today's tasks
      const aDate = getLocalDate(new Date(a.dueDate!));
      const bDate = getLocalDate(new Date(b.dueDate!));
      const aDiff = aDate.getTime() - today.getTime();
      const bDiff = bDate.getTime() - today.getTime();
      
      // If both are overdue or both are today, sort by order
      if ((aDiff < 0 && bDiff < 0) || (aDiff >= 0 && bDiff >= 0)) {
        return a.order - b.order;
      }
      
      // Overdue tasks come first
      return aDiff < 0 ? -1 : 1;
    });
  };

  const getTomorrowTasks = () => {
    return userData.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const taskDate = getLocalDate(new Date(task.dueDate));
      return taskDate.getTime() === tomorrow.getTime();
    }).sort((a, b) => a.order - b.order);
  };

  const getNext7DaysTasks = () => {
    return userData.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const taskDate = getLocalDate(new Date(task.dueDate));
      
      // Task should be after tomorrow and within next 7 days
      return taskDate.getTime() > tomorrow.getTime() && 
             taskDate.getTime() <= next7Days.getTime();
    }).sort((a, b) => a.order - b.order);
  };

  const getCompletedTasks = () => {
    const now = new Date();
    const sevenDaysAgo = getLocalDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = getLocalDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    // Filter completed tasks based on date filter
    let filteredTasks = userData.completedTasks;
    if (completedTasksDateFilter === '7days') {
      filteredTasks = userData.completedTasks.filter(task => 
        getLocalDate(new Date(task.completed)) >= sevenDaysAgo
      );
    } else if (completedTasksDateFilter === '30days') {
      filteredTasks = userData.completedTasks.filter(task => 
        getLocalDate(new Date(task.completed)) >= thirtyDaysAgo
      );
    }
    // 'all' shows all completed tasks
    
    // Convert CompletedTask to Task format for compatibility with existing components
    const convertedTasks = filteredTasks.map(completedTask => ({
      id: completedTask.id,
      title: completedTask.title,
      description: completedTask.description,
      categoryId: completedTask.categoryId,
      completed: true,
      priority: completedTask.priority,
      dueDate: completedTask.dueDate,
      created: completedTask.created,
      updated: completedTask.completed, // Use completion date as updated date
      pomodoroSessions: completedTask.pomodoroSessions,
      estimatedPomodoros: completedTask.estimatedPomodoros,
      order: new Date(completedTask.completed).getTime(), // Use completion timestamp as order
    } as Task)).sort((a, b) => b.order - a.order); // Sort by completion date, newest first

    // Apply pagination for large lists
    const ITEMS_PER_PAGE = 50;
    return convertedTasks.slice(0, completedTasksPage * ITEMS_PER_PAGE);
  };



  const getTodayTaskCount = () => getTodayTasks().length;
  const getTomorrowTaskCount = () => getTomorrowTasks().length;
  const getNext7DaysTaskCount = () => getNext7DaysTasks().length;
  const getCompletedTaskCount = () => getCompletedTasks().length;
  
  const getTotalCompletedTasksCount = () => {
    const now = new Date();
    const sevenDaysAgo = getLocalDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = getLocalDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    let filteredTasks = userData.completedTasks;
    if (completedTasksDateFilter === '7days') {
      filteredTasks = userData.completedTasks.filter(task => 
        getLocalDate(new Date(task.completed)) >= sevenDaysAgo
      );
    } else if (completedTasksDateFilter === '30days') {
      filteredTasks = userData.completedTasks.filter(task => 
        getLocalDate(new Date(task.completed)) >= thirtyDaysAgo
      );
    }
    return filteredTasks.length;
  };

  const handleLoadMoreCompletedTasks = () => {
    setCompletedTasksPage(prev => prev + 1);
  };

  const handleCompletedTasksDateFilterChange = (filter: '7days' | '30days' | 'all') => {
    setCompletedTasksDateFilter(filter);
    setCompletedTasksPage(1); // Reset pagination when filter changes
  };

  const formatSmartDate = (date: Date) => {
    const targetDate = getLocalDate(date);
    
    const timeStr = new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).format(date);
    
    if (targetDate.getTime() === today.getTime()) {
      return `Today by ${timeStr}`;
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow by ${timeStr}`;
    } else if (targetDate.getTime() < today.getTime()) {
      return `Overdue since ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)}`;
    } else {
      const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return `${new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)} by ${timeStr}`;
      } else {
        return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)} by ${timeStr}`;
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
      const categoryId = taskCategory || userData.categories[0]?.id;
      const newTaskId = addTask(value.trim(), categoryId, '', undefined, newTaskEstimatedPomodoros, newTaskWorkspaceUrls);
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
        categoryId = taskCategory || userData.categories[0]?.id;
      }
      
      const newTaskId = addTask(cleanTitle || 'New Task', categoryId, newTaskDescription, dueDate || newTaskDueDate, newTaskEstimatedPomodoros, newTaskWorkspaceUrls);
      
      if (!autoCreate) {
        resetCreateTaskForm();
        setIsCreatePanelOpen(false);
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
          estimatedPomodoros: newTaskEstimatedPomodoros,
          workspaceUrls: newTaskWorkspaceUrls,
        });
        setIsCreatePanelOpen(false);
        resetCreateTaskForm();
      } else {
        // Create new task normally
        handleAddTask(dueDate);
      }
    }
    if (e.key === 'Escape') {
      setIsCreatePanelOpen(false);
      resetCreateTaskForm();
    }
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setIsViewPanelOpen(true);
    setIsEditPanelOpen(false);
    autoSaveTaskRef.current = () => {};
    setIsCreatePanelOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditDueDate(task.dueDate);
    setEditEstimatedPomodoros(task.estimatedPomodoros || 3);
    setEditCategory(task.categoryId);
    setEditWorkspaceUrls(task.workspaceUrls || []);
    setEditUrlInput('');
    setIsEditPanelOpen(true);
    setIsViewPanelOpen(false);
    // Don't close create panel if it's open - user might want to keep creating
  };



  const handleStartPomodoro = (task: Task) => {
    // Start the pomodoro directly
    startPomodoro(task);
    
    // Navigate to pomodoro page
    if (onPageChange) {
      onPageChange('pomodoro');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = userData.tasks.find(t => t.id === event.active.id);
    setActiveDragTask(task || null);
  };

  const handleDragCancel = () => {
    setActiveDragTask(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const draggedTask = userData.tasks.find(task => task.id === active.id);
    if (!draggedTask) return;

    // Check if we're dragging to a different time section
    const overData = over.data?.current;
    const activeData = active.data?.current;

    if (overData?.section && activeData?.section && overData.section !== activeData.section) {
      // Cross-section dragging - update due date
      let newDueDate: Date | undefined;
      
      switch (overData.section) {
        case 'today':
          newDueDate = new Date();
          newDueDate.setHours(23, 59, 59, 999); // End of today
          break;
        case 'tomorrow':
          newDueDate = new Date();
          newDueDate.setDate(newDueDate.getDate() + 1);
          newDueDate.setHours(23, 59, 59, 999); // End of tomorrow
          break;
        case 'next7days':
          newDueDate = new Date();
          newDueDate.setDate(newDueDate.getDate() + 3); // Default to 3 days from now
          newDueDate.setHours(23, 59, 59, 999);
          break;
        case 'unscheduled':
          newDueDate = undefined; // Remove due date to make it unscheduled
          break;
      }

      // Update task with new due date (or remove it for unscheduled)
      updateTask(draggedTask.id, { dueDate: newDueDate });
    } else {
      // Same section reordering
      let filteredTasks: Task[] = [];
      
      switch (currentView) {
        case 'today':
          filteredTasks = getTodayTasks();
          break;
        case 'tomorrow':
          filteredTasks = getTomorrowTasks();
          break;
        case 'next7days':
          filteredTasks = [...getTodayTasks(), ...getTomorrowTasks(), ...getNext7DaysTasks(), ...getUnscheduledTasks()];
          break;
        case 'completed':
          filteredTasks = getCompletedTasks();
          break;
        case 'work':
          filteredTasks = getCategoryTasksByType('work');
          break;
        case 'coding':
          filteredTasks = getCategoryTasksByType('coding');
          break;
        case 'hobby':
          filteredTasks = getCategoryTasksByType('hobby');
          break;
        case 'personal':
          filteredTasks = getCategoryTasksByType('personal');
          break;
        default:
          filteredTasks = [...getTodayTasks(), ...getTomorrowTasks(), ...getNext7DaysTasks(), ...getUnscheduledTasks()];
      }

      const oldIndex = filteredTasks.findIndex(task => task.id === active.id);
      const newIndex = filteredTasks.findIndex(task => task.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
        const taskIds = reorderedTasks.map(task => task.id);
        reorderTasks(taskIds);
      }
    }
  };



  const handleCancelEdit = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
    setEditDueDate(undefined);
    setEditCategory(userData.categories[0]?.id);
    setIsEditPanelOpen(false);
  };

  const autoSaveTask = React.useCallback(() => {
    if (editingTask) {
      const currentTitle = titleInputRef.current?.value || editTitle;
      updateTask(editingTask.id, {
        title: currentTitle,
        description: editDescription,
        dueDate: editDueDate,
        categoryId: editCategory,
        estimatedPomodoros: editEstimatedPomodoros,
        workspaceUrls: editWorkspaceUrls,
      });
    }
  }, [editingTask, editTitle, editDescription, editDueDate, editCategory, editEstimatedPomodoros, editWorkspaceUrls, updateTask]);

  React.useEffect(() => {
    autoSaveTaskRef.current = autoSaveTask;
  }, [autoSaveTask]);

  React.useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, []);

  const scheduleAutoSave = React.useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveTaskRef.current();
    }, 500);
  }, []);

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

  // Update auto-created task when due date, description, category, or estimated pomodoros changes
  React.useEffect(() => {
    if (autoCreatedTaskId && newTaskTitle.trim()) {
      updateTask(autoCreatedTaskId, {
        title: newTaskTitle.trim(),
        description: newTaskDescription,
        dueDate: newTaskDueDate,
        categoryId: taskCategory,
        estimatedPomodoros: newTaskEstimatedPomodoros,
        workspaceUrls: newTaskWorkspaceUrls,
      });
    }
  }, [autoCreatedTaskId, newTaskDescription, newTaskDueDate, taskCategory, newTaskEstimatedPomodoros, newTaskWorkspaceUrls]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (shouldIgnoreClick(target)) {
        return;
      }
      
      // Close panels when clicking outside
      if (isCreatePanelOpen) {
        setIsCreatePanelOpen(false);
        resetCreateTaskForm();
      }
      if (isEditPanelOpen) {
        handleCancelEdit();
      }
      if (isViewPanelOpen) {
        setIsViewPanelOpen(false);
        setViewingTask(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isViewPanelOpen) {
          setIsViewPanelOpen(false);
          setViewingTask(null);
        } else if (isEditPanelOpen) {
          handleCancelEdit();
        } else if (isCreatePanelOpen) {
          setIsCreatePanelOpen(false);
          resetCreateTaskForm();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreatePanelOpen, isEditPanelOpen, isViewPanelOpen]);

  

  const getCategoryTasksByType = (categoryType: string) => {
    const category = userData.categories.find(cat => cat.id === categoryType);
    if (!category) return [];
    return userData.tasks.filter(task => 
      task.categoryId === category.id && !task.completed
    ).sort((a, b) => a.order - b.order);
  };

  const getCategoryTaskCount = (categoryType: string) => {
    return getCategoryTasksByType(categoryType).length;
  };



  const getUnscheduledTasks = () => {
    const now = new Date();
    return userData.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return true; // No due date = unscheduled
      
      // If due date is more than 7 days away, also consider unscheduled
      const taskDate = new Date(task.dueDate);
      const diffTime = taskDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 7;
    }).sort((a, b) => {
      // Sort by creation date (newest first) to help with large lists
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });
  };

  const getUnscheduledTaskCount = () => {
    return getUnscheduledTasks().length;
  };

  const getOverdueTasks = () => {
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return userData.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
      return taskDateOnly.getTime() < todayOnly.getTime();
    });
  };

  const renderCategoryTasks = (categoryId: string, icon: string, name: string) => {
    const tasks = getCategoryTasksByType(categoryId);
    return renderTaskSection(`${icon} ${name}`, tasks, undefined, tasks.length, true, categoryId);
  };

  const renderNext7DaysWithCrossDrag = () => {
    const todayTasks = getTodayTasks();
    const tomorrowTasks = getTomorrowTasks();
    const next7DaysTasks = getNext7DaysTasks();
    const unscheduledTasks = getUnscheduledTasks();
    const overdueTasks = getOverdueTasks();

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-8">
          {/* Today Section */}
          <DroppableSection section="today" className="mb-8" isDragging={!!activeDragTask}>
            <div className={`flex items-center justify-between mb-4 rounded-lg p-2 transition-all duration-200 ${
              activeDragTask && isTodayCollapsed 
                ? 'bg-gray-50 border border-dashed border-gray-300 group-data-[is-over=true]:bg-gray-100 group-data-[is-over=true]:border-gray-400' 
                : ''
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTodayCollapsed(!isTodayCollapsed)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                >
                  {isTodayCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  )}
                  <h3 className="font-semibold text-lg text-foreground">Today</h3>
                  {todayTasks.length > 0 && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {todayTasks.length}{overdueTasks.length > 0 && (
                        <span className="text-orange-600 ml-1">({overdueTasks.length} overdue)</span>
                      )}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3">
                {!isTodayCollapsed && overdueTasks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Move all overdue tasks to tomorrow
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(23, 59, 59, 999);
                      overdueTasks.forEach(task => {
                        updateTask(task.id, { dueDate: tomorrow });
                      });
                    }}
                    className="h-7 px-2 text-xs text-orange-600 hover:text-orange-700 hover:border-orange-300"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Reschedule All Overdue
                  </Button>
                )}
                {!isTodayCollapsed && todayTasks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Unassign all today tasks (remove due dates)
                      todayTasks.forEach(task => {
                        updateTask(task.id, { dueDate: undefined });
                      });
                    }}
                    className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:border-red-300"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Unassign All
                  </Button>
                )}
                <div className="text-sm text-gray-500">
                  {today.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
            


            {!isTodayCollapsed && (
              <div className="space-y-1 min-h-[60px] border-2 border-dashed border-transparent rounded-lg p-2 transition-colors group-data-[is-over=true]:bg-blue-50 group-data-[is-over=true]:border-blue-400 group-data-[dragging=true]:border-gray-300">
                <SortableContext
                  items={todayTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {todayTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={() => handleToggleTaskComplete(task.id)}
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onStartPomodoro={() => handleStartPomodoro(task)}
                      onDelete={() => deleteTask(task.id)}
                      isDraggable={true}
                      section="today"
                      theme={theme}
                    />
                  ))}
                </SortableContext>
                {todayTasks.length === 0 && !activeDragTask && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm text-gray-500">No tasks scheduled for today</p>
                  </div>
                )}
                {todayTasks.length === 0 && activeDragTask && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm text-gray-500">Drop tasks here for today</p>
                  </div>
                )}
              </div>
            )}
          </DroppableSection>

          {/* Tomorrow Section */}
          <DroppableSection section="tomorrow" className="mb-8" isDragging={!!activeDragTask}>
            <div className={`flex items-center justify-between mb-4 rounded-lg p-2 transition-all duration-200 ${
              activeDragTask && isTomorrowCollapsed 
                ? 'bg-gray-50 border border-dashed border-gray-300 group-data-[is-over=true]:bg-gray-100 group-data-[is-over=true]:border-gray-400' 
                : ''
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTomorrowCollapsed(!isTomorrowCollapsed)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                >
                  {isTomorrowCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  )}
                  <h3 className="font-semibold text-lg text-foreground">Tomorrow</h3>
                  {tomorrowTasks.length > 0 && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{tomorrowTasks.length}</span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3">
                {!isTomorrowCollapsed && tomorrowTasks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Unassign all tomorrow tasks (remove due dates)
                      tomorrowTasks.forEach(task => {
                        updateTask(task.id, { dueDate: undefined });
                      });
                    }}
                    className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:border-red-300"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Unassign All
                  </Button>
                )}
                <div className="text-sm text-gray-500">
                  {tomorrow.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
            


            {!isTomorrowCollapsed && (
              <div className="space-y-1 min-h-[60px] border-2 border-dashed border-transparent rounded-lg p-2 transition-colors group-data-[is-over=true]:bg-blue-50 group-data-[is-over=true]:border-blue-400 group-data-[dragging=true]:border-gray-300">
                <SortableContext
                  items={tomorrowTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {tomorrowTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={() => handleToggleTaskComplete(task.id)}
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onStartPomodoro={() => handleStartPomodoro(task)}
                      onDelete={() => deleteTask(task.id)}
                      isDraggable={true}
                      section="tomorrow"
                      theme={theme}
                    />
                  ))}
                </SortableContext>
                {tomorrowTasks.length === 0 && !activeDragTask && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm text-gray-500">No tasks scheduled for tomorrow</p>
                  </div>
                )}
                {tomorrowTasks.length === 0 && activeDragTask && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm text-gray-500">Drop tasks here for tomorrow</p>
                  </div>
                )}
              </div>
            )}
          </DroppableSection>

          {/* Next 7 Days Section */}
          <DroppableSection section="next7days" className="mb-8" isDragging={!!activeDragTask}>
            <div className={`flex items-center justify-between mb-4 rounded-lg p-2 transition-all duration-200 ${
              activeDragTask && isNext7DaysCollapsed 
                ? 'bg-gray-50 border border-dashed border-gray-300 group-data-[is-over=true]:bg-gray-100 group-data-[is-over=true]:border-gray-400' 
                : ''
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNext7DaysCollapsed(!isNext7DaysCollapsed)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                >
                  {isNext7DaysCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  )}
                  <h3 className="font-semibold text-lg text-foreground">Next 7 Days</h3>
                  {next7DaysTasks.length > 0 && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{next7DaysTasks.length}</span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3">
                {!isNext7DaysCollapsed && next7DaysTasks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Unassign all next7days tasks (remove due dates)
                      next7DaysTasks.forEach(task => {
                        updateTask(task.id, { dueDate: undefined });
                      });
                    }}
                    className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:border-red-300"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Unassign All
                  </Button>
                )}
              </div>
            </div>
            


            {!isNext7DaysCollapsed && (
              <div className="space-y-1 min-h-[60px] border-2 border-dashed border-transparent rounded-lg p-2 transition-colors group-data-[is-over=true]:bg-blue-50 group-data-[is-over=true]:border-blue-400 group-data-[dragging=true]:border-gray-300">
                <SortableContext
                  items={next7DaysTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {next7DaysTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={() => handleToggleTaskComplete(task.id)}
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onStartPomodoro={() => handleStartPomodoro(task)}
                      onDelete={() => deleteTask(task.id)}
                      isDraggable={true}
                      section="next7days"
                      theme={theme}
                    />
                  ))}
                </SortableContext>
                {next7DaysTasks.length === 0 && !activeDragTask && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm text-gray-500">No tasks scheduled for next 7 days</p>
                  </div>
                )}
                {next7DaysTasks.length === 0 && activeDragTask && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm text-gray-500">Drop tasks here for later this week</p>
                  </div>
                )}
              </div>
            )}
          </DroppableSection>

          {/* Unscheduled Section */}
          <DroppableSection section="unscheduled" className="mb-8" isDragging={!!activeDragTask}>
                        <div className={`flex items-center justify-between mb-4 rounded-lg p-2 transition-all duration-200 ${
              activeDragTask && isUnscheduledCollapsed 
                ? 'bg-gray-50 border border-dashed border-gray-300 group-data-[is-over=true]:bg-gray-100 group-data-[is-over=true]:border-gray-400' 
                : ''
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUnscheduledCollapsed(!isUnscheduledCollapsed)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                >
                  {isUnscheduledCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  )}
                  <h3 className={
                    theme === 'retro'
                      ? "font-black text-lg text-gray-800 dark:text-gray-100"
                      : "font-semibold text-lg text-gray-800 dark:text-gray-100"
                  }>Unscheduled</h3>
                  {unscheduledTasks.length > 0 && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{unscheduledTasks.length}</span>
                  )}
                </button>
              </div>
            </div>
            


            {!isUnscheduledCollapsed && (
              <div className="space-y-1 min-h-[60px] border-2 border-dashed border-transparent rounded-lg p-2 transition-colors group-data-[is-over=true]:bg-blue-50 group-data-[is-over=true]:border-blue-400 group-data-[dragging=true]:border-gray-300">
                <SortableContext
                  items={unscheduledTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {unscheduledTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={() => handleToggleTaskComplete(task.id)}
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onStartPomodoro={() => handleStartPomodoro(task)}
                      onDelete={() => deleteTask(task.id)}
                      isDraggable={true}
                      section="unscheduled"
                      theme={theme}
                    />
                  ))}
                </SortableContext>
                {unscheduledTasks.length === 0 && !activeDragTask && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm text-gray-500">No unscheduled tasks</p>
                  </div>
                )}
                {unscheduledTasks.length === 0 && activeDragTask && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm text-gray-500">Drop tasks here to unschedule</p>
                  </div>
                )}
              </div>
            )}
          </DroppableSection>
        </div>
        
        <DragOverlay>
          {activeDragTask ? (
            <DragOverlayTaskItem task={activeDragTask} theme={theme} />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  const renderTaskSection = (title: string, tasks: Task[], sectionDate?: Date, count?: number, isDraggable: boolean = false, section?: string) => (
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
      {isDraggable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={() => toggleTaskComplete(task.id)}
                  onView={() => handleViewTask(task)}
                  onEdit={() => handleEditTask(task)}
                  onStartPomodoro={() => handleStartPomodoro(task)}
                  onDelete={() => deleteTask(task.id)}
                  isDraggable={true}
                  section={section}
                  theme={theme}
                />
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-3xl mb-3">✨</div>
                  <p className="text-gray-500">No tasks {title.toLowerCase()}</p>
                </div>
              )}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {activeDragTask ? (
              <DragOverlayTaskItem task={activeDragTask} theme={theme} />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
      <div className="space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleComplete={() => toggleTaskComplete(task.id)}
            onView={() => handleViewTask(task)}
            onEdit={() => handleEditTask(task)}
            onStartPomodoro={() => handleStartPomodoro(task)}
            onDelete={() => deleteTask(task.id)}
            theme={theme}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-3">✨</div>
            <p className="text-gray-500">No tasks {title.toLowerCase()}</p>
          </div>
        )}
      </div>
      )}
    </div>
  );

  const renderContent = () => {
    // Check if currentView is a category ID
    const currentCategory = userData.categories.find(cat => cat.id === currentView);
    
    switch (currentView) {
      case 'today':
        return (
          <div>
            {renderTaskSection('Today', getTodayTasks(), today, getTodayTaskCount(), true, 'today')}
          </div>
        );
      
      case 'tomorrow':
        return (
          <div>
            {renderTaskSection('Tomorrow', getTomorrowTasks(), tomorrow, getTomorrowTaskCount(), true, 'tomorrow')}
          </div>
        );
      
      case 'next7days':
        return renderNext7DaysWithCrossDrag();
      
      case 'completed':
        return (
          <div>
            {/* Date Filter for Completed Tasks */}
            <div className={theme === 'retro' ? "mb-6 p-4 bg-gray-50 dark:bg-gray-800 border-2 dark:border border-black dark:border-gray-600 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-sm" : "mb-6 p-4 bg-gray-50 rounded-lg"}>
              <div className="flex items-center justify-between">
                <h3 className={theme === 'retro' ? "text-sm font-black dark:font-semibold text-gray-900 dark:text-gray-100" : "text-sm font-medium text-gray-700"}>Filter by completion date:</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCompletedTasksDateFilterChange('7days')}
                    className={
                      theme === 'retro'
                        ? `px-3 py-1 text-xs font-black dark:font-semibold rounded-lg dark:rounded-md transition-colors border-2 dark:border shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-none ${
                            completedTasksDateFilter === '7days'
                              ? 'bg-black dark:bg-blue-500 text-white border-black dark:border-blue-500'
                              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 border-black dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`
                        : `px-3 py-1 text-xs rounded-md transition-colors ${
                            completedTasksDateFilter === '7days'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-card text-muted-foreground border border-border hover:bg-accent'
                          }`
                    }
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => handleCompletedTasksDateFilterChange('30days')}
                    className={
                      theme === 'retro'
                        ? `px-3 py-1 text-xs font-black dark:font-semibold rounded-lg dark:rounded-md transition-colors border-2 dark:border shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-none ${
                            completedTasksDateFilter === '30days'
                              ? 'bg-black dark:bg-blue-500 text-white border-black dark:border-blue-500'
                              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 border-black dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`
                        : `px-3 py-1 text-xs rounded-md transition-colors ${
                            completedTasksDateFilter === '30days'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-card text-muted-foreground border border-border hover:bg-accent'
                          }`
                    }
                  >
                    Last 30 days
                  </button>
                  <button
                    onClick={() => handleCompletedTasksDateFilterChange('all')}
                    className={
                      theme === 'retro'
                        ? `px-3 py-1 text-xs font-black dark:font-semibold rounded-lg dark:rounded-md transition-colors border-2 dark:border shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-none ${
                            completedTasksDateFilter === 'all'
                              ? 'bg-black dark:bg-blue-500 text-white border-black dark:border-blue-500'
                              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 border-black dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`
                        : `px-3 py-1 text-xs rounded-md transition-colors ${
                            completedTasksDateFilter === 'all'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-card text-muted-foreground border border-border hover:bg-accent'
                          }`
                    }
                  >
                    All time
                  </button>
                </div>
              </div>
            </div>
            {renderTaskSection('Completed Tasks', getCompletedTasks(), undefined, getCompletedTaskCount(), false, 'completed')}
            
            {/* Load More button for completed tasks */}
            {getCompletedTaskCount() < getTotalCompletedTasksCount() && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleLoadMoreCompletedTasks}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Load More ({getCompletedTaskCount()} of {getTotalCompletedTasksCount()})
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        // Handle dynamic categories
        if (currentCategory) {
          return renderCategoryTasks(currentCategory.id, currentCategory.icon, currentCategory.name);
        }
        return renderNext7DaysWithCrossDrag();
    }
  };



  const getViewTitle = () => {
    // Check if currentView is a category ID
    const currentCategory = userData.categories.find(cat => cat.id === currentView);
    
    switch (currentView) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'next7days': return 'Overview';
      case 'completed': return 'Completed';
      default:
        // Handle dynamic categories
        if (currentCategory) {
          return `${currentCategory.name} Tasks`;
        }
        return 'Tasks';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-full bg-background relative">
      {/* Main Content Area - Always has margin for consistent sizing */}
      <div className="flex-1 flex flex-col h-full mr-[576px]">
        {/* Header with View Navigation */}
        <div className="bg-card border-b border-border">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4 h-10">
              <h1 className="text-2xl font-bold text-foreground">{getViewTitle()}</h1>
            </div>

            {/* View Navigation Tabs - Aligned with Sidebar */}
            <div ref={navigationRef} className="flex items-center justify-between border-b pb-2" style={{ marginLeft: '-24px', paddingLeft: '24px', marginRight: '-24px', paddingRight: '24px' }}>
              <div className="flex items-center space-x-3">

                <button
                  onClick={() => onViewChange?.('next7days')}
                  className={
                    theme === 'retro'
                      ? `px-4 py-2 font-black text-sm transition-all whitespace-nowrap rounded-xl ${
                          currentView === 'next7days'
                            ? 'bg-[#ffe164] dark:bg-yellow-600 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.2)] dark:hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px]'
                            : 'bg-transparent text-foreground border-2 border-transparent hover:border-black dark:hover:border-gray-600'
                        }`
                      : `pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                          currentView === 'next7days'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Overview
                    {(getTodayTaskCount() + getTomorrowTaskCount() + getNext7DaysTaskCount() + getUnscheduledTaskCount()) > 0 && (
                      <span className={theme === 'retro' ? "bg-black text-white px-2 py-0.5 rounded-md text-xs border border-black font-bold" : "bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"}>
                        {getTodayTaskCount() + getTomorrowTaskCount() + getNext7DaysTaskCount() + getUnscheduledTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onViewChange?.('today')}
                  className={
                    theme === 'retro'
                      ? `px-4 py-2 font-black text-sm transition-all whitespace-nowrap rounded-xl ${
                          currentView === 'today'
                            ? 'bg-[#d4f1ff] dark:bg-blue-600 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.2)] dark:hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px]'
                            : 'bg-transparent text-foreground border-2 border-transparent hover:border-black dark:hover:border-gray-600'
                        }`
                      : `pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                          currentView === 'today'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Today
                    {getTodayTaskCount() > 0 && (
                      <span className={theme === 'retro' ? "bg-black text-white px-2 py-0.5 rounded-md text-xs border border-black font-bold" : "bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"}>
                        {getTodayTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onViewChange?.('tomorrow')}
                  className={
                    theme === 'retro'
                      ? `px-4 py-2 font-black text-sm transition-all whitespace-nowrap rounded-xl ${
                          currentView === 'tomorrow'
                            ? 'bg-[#96f2d7] dark:bg-teal-600 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.2)] dark:hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px]'
                            : 'bg-transparent text-foreground border-2 border-transparent hover:border-black dark:hover:border-gray-600'
                        }`
                      : `pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                          currentView === 'tomorrow'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Tomorrow
                    {getTomorrowTaskCount() > 0 && (
                      <span className={theme === 'retro' ? "bg-black text-white px-2 py-0.5 rounded-md text-xs border border-black font-bold" : "bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"}>
                        {getTomorrowTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onViewChange?.('completed')}
                  className={
                    theme === 'retro'
                      ? `px-4 py-2 font-black text-sm transition-all whitespace-nowrap rounded-xl ${
                          currentView === 'completed'
                            ? 'bg-[#ffd4f4] dark:bg-pink-600 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.2)] dark:hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px]'
                            : 'bg-transparent text-foreground border-2 border-transparent hover:border-black dark:hover:border-gray-600'
                        }`
                      : `pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                          currentView === 'completed'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Completed
                    {getCompletedTaskCount() > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={theme === 'retro' ? "bg-black text-white px-2 py-0.5 rounded-md text-xs cursor-help border border-black font-bold" : "bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs cursor-help"}>
                            {getCompletedTaskCount()}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getCompletedTaskCount()} completed in last 2 weeks</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </button>

                {/* Category Dropdown and Add Task Button - Next to other tabs */}
                <div className="flex items-center gap-3">
                  <Select 
                    value={userData.categories.some(cat => cat.id === currentView) ? currentView : ''} 
                    onValueChange={(value) => onViewChange?.(value as any)}
                  >
                    <SelectTrigger className={
                      theme === 'retro'
                        ? `w-48 px-4 py-2 bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-xl shadow-[3px_3px_0_0_rgba(0,0,0,0.12)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[-1px] transition-all font-bold text-foreground ${userData.categories.some(cat => cat.id === currentView) ? 'bg-[#fff3b0] dark:bg-[#ffd700]/20' : ''}`
                        : "w-40 h-8 border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }>
                      <SelectValue placeholder="Categories" />
                    </SelectTrigger>
                    <SelectContent 
                      align="start"
                      className={theme === 'retro' ? "border-2 border-black dark:border-white rounded-xl shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] bg-white dark:bg-gray-900 p-2" : ""}
                    >
                      {userData.categories.map((category) => {
                        const taskCount = getCategoryTaskCount(category.id);
                        return (
                          <div key={category.id} className="flex items-center gap-1 mb-1 group">
                            <SelectItem 
                              value={category.id}
                              className={theme === 'retro' ? "flex-1 rounded-lg hover:bg-accent/50 font-bold cursor-pointer" : "flex-1"}
                            >
                              <div className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                <div 
                                  className={theme === 'retro' ? "w-2 h-2 rounded-sm flex-shrink-0 border border-black dark:border-white" : "w-2 h-2 rounded-full flex-shrink-0"}
                                  style={{ backgroundColor: category.color }}
                                />
                                <span>{category.name}</span>
                                {taskCount > 0 && (
                                  <span className={theme === 'retro' ? "ml-auto bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-md text-xs border border-black dark:border-white font-bold" : "ml-auto bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs"}>
                                    {taskCount}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletingCategory({ id: category.id, name: category.name, taskCount });
                              }}
                              className={
                                theme === 'retro'
                                  ? "h-8 w-8 p-0 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700 rounded-md transition-colors"
                                  : "h-8 w-8 p-0 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                              }
                              type="button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                      <div 
                        className={theme === 'retro' ? "mt-2 pt-2 border-t-2 border-gray-300 dark:border-gray-600" : "mt-1 pt-1 border-t"}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setIsAddCategoryModalOpen(true);
                          }}
                          className={
                            theme === 'retro'
                              ? "w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ffe164] dark:hover:bg-[#ffd700]/20 font-bold text-foreground border-2 border-transparent hover:border-black dark:hover:border-white transition-all"
                              : "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm"
                          }
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create New Category</span>
                        </button>
                      </div>
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={() => {
                      // Reset form first
                      resetCreateTaskForm();
                      
                      // Close edit panel if open
                      if (isEditPanelOpen) {
                        setIsEditPanelOpen(false);
                        setEditingTask(null);
                      }
                      
                      setIsCreatePanelOpen(true);
                      setIsViewPanelOpen(false);
                      setViewingTask(null);
                      
                      // Auto-select category based on current view
                      if (userData.categories.some(cat => cat.id === currentView)) {
                        setTaskCategory(currentView);
                      }
                    }}
                    className={
                      theme === 'retro'
                        ? "px-4 py-2 bg-[#96f2d7] dark:bg-teal-600 hover:bg-[#96f2d7] dark:hover:bg-teal-600 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.2)] dark:hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px] transition-all font-black"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-8"
                    }
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
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {renderContent()}
        </div>
      </div>

      {/* Right Sliding Panel for Task Creation */}
      <div 
        ref={createPanelRef}
        className={`
          fixed top-0 right-0 h-full w-[480px] bg-card border-l border-border 
          transform transition-transform duration-300 ease-in-out z-40 flex flex-col
          ${isCreatePanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className={theme === 'retro' ? "bg-[#FFE164] border-b-2 border-black dark:border-gray-600 p-6 pb-4 flex-shrink-0" : "bg-card border-b border-border p-6 pb-0 flex-shrink-0"}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={theme === 'retro' ? "text-2xl font-black text-gray-900 flex items-center gap-2" : "text-xl font-semibold text-foreground"}>
              {theme === 'retro' && <Plus className="w-6 h-6" />}
              Create New Task
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsCreatePanelOpen(false);
                resetCreateTaskForm();
              }}
              className={theme === 'retro' ? "text-gray-900 hover:bg-black/10 rounded-md h-8 w-8" : "text-muted-foreground hover:text-foreground"}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          {theme === 'retro' && (
            <div className="text-xs text-gray-900 font-bold bg-[#FFE164] border-2 border-black dark:border-gray-700 rounded-lg px-3 py-1.5 inline-block shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
              Changes are automatically saved as you type
            </div>
          )}
          {!theme || theme === 'clean' ? (
            <div className="text-xs text-gray-500 mb-4">
              Changes are automatically saved as you type
            </div>
          ) : null}
        </div>

        {/* Task Creation Form */}
        <div className="flex-1 overflow-y-auto">
          <div className={theme === 'retro' ? "p-4 space-y-4" : "p-6 space-y-6"}>
          {/* Category Selection */}
          <div className={theme === 'retro' ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm" : "space-y-2"}>
            <div className="flex items-center justify-between">
              <label className={theme === 'retro' ? "text-sm font-semibold text-gray-700 dark:text-gray-300" : "text-sm font-semibold text-gray-900"}>Category</label>
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
              <Select value={taskCategory || 'no-category'} onValueChange={(value) => setTaskCategory(value === 'no-category' ? undefined : value)}>
                <SelectTrigger className={theme === 'retro' ? "border-2 dark:border border-black dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 font-bold dark:font-normal focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] dark:focus:shadow-none" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}>
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-category">
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>No Category</span>
                    </div>
                  </SelectItem>
                  {userData.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: category.color }}
                        />
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
          <div className={theme === 'retro' ? "bg-[#d4f1ff] dark:bg-gray-800 border-2 dark:border border-black dark:border-gray-700 rounded-xl dark:rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-sm space-y-3" : "space-y-2"}>
            <label className={theme === 'retro' ? "text-sm font-black dark:font-semibold text-gray-900 dark:text-gray-300" : "text-sm font-semibold text-gray-900"}>What do you need to do?</label>
            <Input
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChange={(e) => handleTaskTitleChange(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e)}
              className={theme === 'retro' ? "border-2 dark:border border-black dark:border-gray-600 rounded-lg dark:rounded-md bg-white dark:bg-gray-900 font-bold dark:font-normal focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] dark:focus:shadow-none text-base h-11" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-base"}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className={theme === 'retro' ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3" : "space-y-2"}>
            <label className={theme === 'retro' ? "text-sm font-semibold text-gray-700 dark:text-gray-300" : "text-sm font-semibold text-gray-900"}>Description</label>
            <div className={theme === 'retro' ? "border border-gray-300 dark:border-gray-600 rounded-md" : ""}>
              <RichTextEditor
                content={newTaskDescription}
                onChange={setNewTaskDescription}
                placeholder="Add more details..."
                className="min-h-[200px]"
              />
            </div>
          </div>

          {/* Due Date & Time */}
          <div className={theme === 'retro' ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3" : "space-y-3"}>
            <div className="flex items-center justify-between">
              <label className={theme === 'retro' ? "text-sm font-semibold text-gray-700 dark:text-gray-300" : "text-sm font-semibold text-gray-900"}>Due Date</label>
              {newTaskDueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewTaskDueDate(undefined)}
                  className="text-gray-500 hover:text-red-600 h-auto p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {/* Quick Date Shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={newTaskDueDate && format(newTaskDueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const today = new Date();
                  today.setHours(9, 0, 0, 0);
                  setNewTaskDueDate(today);
                }}
                className={
                  theme === 'retro'
                    ? `h-9 text-xs font-black dark:font-semibold rounded-lg dark:rounded-md ${
                        newTaskDueDate && format(newTaskDueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? 'bg-black dark:bg-blue-500 text-white border-2 dark:border border-black dark:border-blue-500 shadow-[3px_3px_0_0_rgba(0,0,0,0.25)] dark:shadow-none'
                          : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 border-2 dark:border border-black dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`
                    : "h-8 text-xs"
                }
              >
                Today
              </Button>
              
              <Button
                type="button"
                variant={newTaskDueDate && format(newTaskDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const tomorrow = addDays(new Date(), 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  setNewTaskDueDate(tomorrow);
                }}
                className={theme === 'retro' ? `h-9 text-xs font-black dark:font-semibold rounded-lg dark:rounded-md ${newTaskDueDate && format(newTaskDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd') ? 'bg-black dark:bg-blue-500 text-white border-2 dark:border border-black dark:border-blue-500 shadow-[3px_3px_0_0_rgba(0,0,0,0.25)] dark:shadow-none' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 border-2 dark:border border-black dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}` : "h-8 text-xs"}
              >
                Tomorrow
              </Button>
              
              <Button
                type="button"
                variant={newTaskDueDate && format(newTaskDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 3), 'yyyy-MM-dd') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const threeDays = addDays(new Date(), 3);
                  threeDays.setHours(9, 0, 0, 0);
                  setNewTaskDueDate(threeDays);
                }}
                className={theme === 'retro' ? `h-9 text-xs font-black dark:font-semibold rounded-lg dark:rounded-md ${newTaskDueDate && format(newTaskDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 3), 'yyyy-MM-dd') ? 'bg-black dark:bg-blue-500 text-white border-2 dark:border border-black dark:border-blue-500 shadow-[3px_3px_0_0_rgba(0,0,0,0.25)] dark:shadow-none' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 border-2 dark:border border-black dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}` : "h-8 text-xs"}
              >
                3 Days
              </Button>
              
              <Button
                type="button"
                variant={newTaskDueDate && format(newTaskDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 7), 'yyyy-MM-dd') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const nextWeek = addDays(new Date(), 7);
                  nextWeek.setHours(9, 0, 0, 0);
                  setNewTaskDueDate(nextWeek);
                }}
                className={theme === 'retro' ? `h-9 text-xs font-black dark:font-semibold rounded-lg dark:rounded-md ${newTaskDueDate && format(newTaskDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 7), 'yyyy-MM-dd') ? 'bg-black dark:bg-blue-500 text-white border-2 dark:border border-black dark:border-blue-500 shadow-[3px_3px_0_0_rgba(0,0,0,0.25)] dark:shadow-none' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 border-2 dark:border border-black dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}` : "h-8 text-xs"}
              >
                Next Week
              </Button>
            </div>
            
            {/* Custom Date/Time Option */}
            <div className="space-y-2">
              <DateTimePicker
                date={newTaskDueDate}
                onDateChange={setNewTaskDueDate}
                placeholder="Or pick specific date & time"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                hideQuickSelect={true}
              />
            </div>
          </div>

          {/* Estimated Pomodoros */}
          <div className={theme === 'retro' ? "bg-[#ffd4f4] dark:bg-gray-800 border-2 dark:border border-black dark:border-gray-700 rounded-xl dark:rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-sm space-y-3" : "space-y-3 pt-2"}>
            <label className={theme === 'retro' ? "text-sm font-black dark:font-semibold text-gray-900 dark:text-gray-300 flex items-center gap-2" : "text-sm font-semibold text-gray-900"}>
              {theme === 'retro' && <Timer className="w-4 h-4" />}
              Estimated Pomodoros
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {theme === 'retro' ? (
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 rounded-lg flex items-center justify-center text-xl shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] dark:shadow-sm">
                    🍅
                  </div>
                ) : (
                  <span className="text-2xl">🍅</span>
                )}
                <div className="flex-1">
                  <Slider
                    value={[newTaskEstimatedPomodoros]}
                    onValueChange={(value) => setNewTaskEstimatedPomodoros(value[0])}
                    min={1}
                    max={15}
                    step={1}
                    className="w-full"
                  />
                </div>
                <span className={theme === 'retro' ? "min-w-[3rem] text-center font-black dark:font-bold text-2xl dark:text-xl text-gray-900 dark:text-blue-400 bg-white dark:bg-blue-900/30 border-2 dark:border-0 border-black rounded-lg px-3 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] dark:shadow-none" : "min-w-[3rem] text-center font-semibold text-blue-600"}>
                  {newTaskEstimatedPomodoros}
                </span>
              </div>
              <div className={theme === 'retro' ? "text-xs text-gray-700 dark:text-gray-400 font-bold dark:font-normal flex items-center gap-2 bg-white dark:bg-gray-900 border-2 dark:border-0 border-black rounded-lg dark:rounded-md px-3 py-2" : "text-xs text-gray-500 flex items-center gap-1"}>
                <Clock className="w-3 h-3" />
                Approximately {newTaskEstimatedPomodoros * 30} minutes of focused work
              </div>
            </div>
          </div>

          {/* Workspace URLs */}
          <div className={theme === 'retro' ? "bg-[#96f2d7] dark:bg-gray-800 border-2 dark:border border-black dark:border-gray-700 rounded-xl dark:rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-sm space-y-3" : "space-y-3 pt-2 border-t border-gray-100"}>
            <label className={theme === 'retro' ? "text-sm font-black dark:font-semibold text-gray-900 dark:text-gray-300 flex items-center gap-2" : "text-sm font-semibold text-gray-900 flex items-center gap-2"}>
              {theme === 'retro' ? (
                <>
                  <div className="w-5 h-5 bg-white dark:bg-gradient-to-br dark:from-green-500 dark:to-teal-500 border-2 dark:border-0 border-black rounded flex items-center justify-center text-sm">
                    🔗
                  </div>
                  Workspace URLs
                  <span className="text-xs text-gray-700 dark:text-gray-400 font-medium dark:font-normal bg-white dark:bg-gray-700 border dark:border-0 border-black rounded px-2 py-0.5">optional</span>
                </>
              ) : (
                <>
                  <span className="text-lg">🔗</span>
                  Workspace URLs
                  <span className="text-xs text-gray-500 font-normal">(optional)</span>
                </>
              )}
            </label>
            <div className="space-y-3">
              <div className={theme === 'retro' ? "text-xs text-gray-700 dark:text-gray-400 font-bold dark:font-normal bg-white dark:bg-gray-900 border-2 dark:border-0 border-black rounded-lg dark:rounded-md px-3 py-2" : "text-xs text-gray-600"}>
                Add URLs that will automatically open when you start a Pomodoro for this task
              </div>
              
              {/* URL Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  placeholder="Enter URL (e.g., github.com/user/repo)"
                  className={theme === 'retro' ? "flex-1 px-3 py-2 text-sm border-2 dark:border border-black dark:border-gray-600 rounded-lg dark:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] dark:focus:shadow-none bg-white dark:bg-gray-900 font-bold dark:font-normal" : "flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newUrlInput.trim()) {
                      e.preventDefault();
                      if (!newTaskWorkspaceUrls.includes(newUrlInput.trim())) {
                        setNewTaskWorkspaceUrls([...newTaskWorkspaceUrls, newUrlInput.trim()]);
                        setNewUrlInput('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (newUrlInput.trim() && !newTaskWorkspaceUrls.includes(newUrlInput.trim())) {
                      setNewTaskWorkspaceUrls([...newTaskWorkspaceUrls, newUrlInput.trim()]);
                      setNewUrlInput('');
                    }
                  }}
                  disabled={!newUrlInput.trim() || newTaskWorkspaceUrls.includes(newUrlInput.trim())}
                  className={theme === 'retro' ? "px-3 bg-black dark:bg-blue-500 text-white border-2 dark:border border-black dark:border-blue-500 rounded-lg dark:rounded-md font-black dark:font-semibold hover:bg-gray-800 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] dark:shadow-none" : "px-3"}
                >
                  Add
                </Button>
              </div>

              {/* URL List */}
              {newTaskWorkspaceUrls.length > 0 && (
                <div className="space-y-2">
                  <div className={theme === 'retro' ? "text-xs text-gray-700 dark:text-gray-400 font-bold dark:font-semibold" : "text-xs text-gray-600"}>
                    URLs to open ({newTaskWorkspaceUrls.length}):
                  </div>
                  <div className="space-y-2">
                    {newTaskWorkspaceUrls.map((url, index) => (
                      <div key={index} className={theme === 'retro' ? "flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border-2 dark:border border-black dark:border-gray-700 rounded-lg dark:rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-none" : "flex items-center gap-2 p-2 bg-gray-50 rounded border"}>
                        <span className={theme === 'retro' ? "text-sm font-bold dark:font-normal" : "text-xs"}>🔗</span>
                        <span className={theme === 'retro' ? "flex-1 text-sm text-gray-900 dark:text-gray-300 truncate font-bold dark:font-normal" : "flex-1 text-sm text-gray-700 truncate"} title={url}>
                          {url}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewTaskWorkspaceUrls(newTaskWorkspaceUrls.filter((_, i) => i !== index));
                          }}
                          className={theme === 'retro' ? "h-7 w-7 p-0 text-gray-900 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md font-black dark:font-bold text-lg" : "h-6 w-6 p-0 text-gray-400 hover:text-red-600"}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          </div>
        </div>
      </div>

      {/* Right Sliding Panel for Task Editing */}
      <div 
        ref={editPanelRef}
        className={`
          fixed top-0 right-0 h-full w-[480px] bg-card border-l border-border 
          transform transition-transform duration-300 ease-in-out z-40 flex flex-col
          ${isEditPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className={theme === 'retro' ? "bg-[#FFE164] border-b-2 border-black dark:border-gray-600 p-6 pb-4 flex-shrink-0" : "bg-card border-b border-border p-6 pb-0 flex-shrink-0"}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={theme === 'retro' ? "text-2xl font-black text-gray-900 flex items-center gap-2" : "text-xl font-semibold text-foreground"}>
              {theme === 'retro' && <Edit className="w-6 h-6" />}
              Edit Task
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancelEdit}
              className={theme === 'retro' ? "text-gray-900 hover:bg-black/10 rounded-md h-8 w-8" : "text-gray-500 hover:text-gray-700"}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          {theme === 'retro' && (
            <div className="text-xs text-gray-900 font-bold bg-[#FFE164] border-2 border-black dark:border-gray-700 rounded-lg px-3 py-1.5 inline-block shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
              Changes are automatically saved as you type
            </div>
          )}
          {!theme || theme === 'clean' ? (
            <div className="text-xs text-gray-500 mb-4">
              Changes are automatically saved as you type
            </div>
          ) : null}
        </div>

        {/* Task Edit Form */}
        <div className="flex-1 overflow-y-auto">
          <div className={theme === 'retro' ? "p-4 space-y-4" : "p-6 space-y-6"}>
          {/* Category Selection */}
          <div className={theme === 'retro' ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm" : "space-y-2"}>
            <div className="flex items-center justify-between">
              <label className={theme === 'retro' ? "text-sm font-semibold text-gray-700 dark:text-gray-300" : "text-sm font-semibold text-gray-900"}>Category</label>
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
              <Select value={editCategory || 'no-category'} onValueChange={(value) => {
                const newCategory = value === 'no-category' ? undefined : value;
                setEditCategory(newCategory);
                // Immediately save the category change with the new value
                if (editingTask) {
                  updateTask(editingTask.id, { categoryId: newCategory });
                }
              }}>
                <SelectTrigger className={theme === 'retro' ? "border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}>
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent 
                  align="start"
                  className={theme === 'retro' ? "border-2 border-black dark:border-white rounded-xl shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] bg-white dark:bg-gray-900 p-2" : ""}
                >
                  <SelectItem value="no-category" className={theme === 'retro' ? "rounded-lg hover:bg-accent/50 font-bold cursor-pointer mb-1" : ""}>
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>No Category</span>
                    </div>
                  </SelectItem>
                  {userData.categories.map((category) => {
                    const taskCount = getCategoryTaskCount(category.id);
                    return (
                      <div key={category.id} className="flex items-center gap-1 mb-1 group">
                        <SelectItem 
                          value={category.id}
                          className={theme === 'retro' ? "flex-1 rounded-lg hover:bg-accent/50 font-bold cursor-pointer" : "flex-1"}
                        >
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <div 
                              className={theme === 'retro' ? "w-2 h-2 rounded-sm flex-shrink-0 border border-black dark:border-white" : "w-2 h-2 rounded-full flex-shrink-0"}
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name}</span>
                            {taskCount > 0 && (
                              <span className={theme === 'retro' ? "ml-auto bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-md text-xs border border-black dark:border-white font-bold" : "ml-auto bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs"}>
                                {taskCount}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeletingCategory({ id: category.id, name: category.name, taskCount });
                          }}
                          className={
                            theme === 'retro'
                              ? "h-8 w-8 p-0 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700 rounded-md transition-colors"
                              : "h-8 w-8 p-0 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          }
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-md bg-gray-50">
                No categories available. Click "Reset" to restore default categories.
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className={theme === 'retro' ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3" : "space-y-2"}>
            <label className={theme === 'retro' ? "text-sm font-semibold text-gray-700 dark:text-gray-300" : "text-sm font-semibold text-gray-900"}>Title</label>
            <Input
              ref={titleInputRef}
              placeholder="Enter task title..."
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                scheduleAutoSave();
              }}
              onBlur={() => {
                // Cancel any pending auto-save to avoid conflicts and save immediately
                if (autoSaveTimeoutRef.current) {
                  clearTimeout(autoSaveTimeoutRef.current);
                  autoSaveTimeoutRef.current = null;
                }
                autoSaveTaskRef.current();
              }}
              className={theme === 'retro' ? "border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-base h-11" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-base"}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className={theme === 'retro' ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3" : "space-y-2"}>
            <label className={theme === 'retro' ? "text-sm font-semibold text-gray-700 dark:text-gray-300" : "text-sm font-semibold text-gray-900"}>Description</label>
            <div className={theme === 'retro' ? "border border-gray-300 dark:border-gray-600 rounded-md" : ""}>
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
          </div>

          {/* Due Date & Time */}
          <div className={theme === 'retro' ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3" : "space-y-3"}>
            <div className="flex items-center justify-between">
              <label className={theme === 'retro' ? "text-sm font-semibold text-gray-700 dark:text-gray-300" : "text-sm font-semibold text-gray-900"}>Due Date</label>
              {editDueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditDueDate(undefined);
                    scheduleAutoSave();
                  }}
                  className="text-gray-500 hover:text-red-600 h-auto p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {/* Quick Date Shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={editDueDate && format(editDueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const today = new Date();
                  today.setHours(9, 0, 0, 0);
                  setEditDueDate(today);
                  scheduleAutoSave();
                }}
                className={
                  theme === 'retro'
                    ? `h-9 text-xs font-semibold rounded-md ${
                        editDueDate && format(editDueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? 'bg-blue-600 dark:bg-blue-500 text-white border border-blue-600 dark:border-blue-500'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`
                    : "h-8 text-xs"
                }
              >
                Today
              </Button>
              
              <Button
                type="button"
                variant={editDueDate && format(editDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const tomorrow = addDays(new Date(), 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  setEditDueDate(tomorrow);
                  scheduleAutoSave();
                }}
                className={theme === 'retro' ? `h-9 text-xs font-semibold rounded-md ${editDueDate && format(editDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd') ? 'bg-blue-600 dark:bg-blue-500 text-white border border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}` : "h-8 text-xs"}
              >
                Tomorrow
              </Button>
              
              <Button
                type="button"
                variant={editDueDate && format(editDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 3), 'yyyy-MM-dd') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const threeDays = addDays(new Date(), 3);
                  threeDays.setHours(9, 0, 0, 0);
                  setEditDueDate(threeDays);
                  scheduleAutoSave();
                }}
                className={theme === 'retro' ? `h-9 text-xs font-semibold rounded-md ${editDueDate && format(editDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 3), 'yyyy-MM-dd') ? 'bg-blue-600 dark:bg-blue-500 text-white border border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}` : "h-8 text-xs"}
              >
                3 Days
              </Button>
              
              <Button
                type="button"
                variant={editDueDate && format(editDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 7), 'yyyy-MM-dd') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const nextWeek = addDays(new Date(), 7);
                  nextWeek.setHours(9, 0, 0, 0);
                  setEditDueDate(nextWeek);
                  scheduleAutoSave();
                }}
                className={theme === 'retro' ? `h-9 text-xs font-semibold rounded-md ${editDueDate && format(editDueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 7), 'yyyy-MM-dd') ? 'bg-blue-600 dark:bg-blue-500 text-white border border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}` : "h-8 text-xs"}
              >
                Next Week
              </Button>
            </div>
            
            {/* Custom Date/Time Option */}
            <div className="space-y-2">
              <DateTimePicker
                date={editDueDate}
                onDateChange={(date) => {
                  setEditDueDate(date);
                  scheduleAutoSave();
                }}
                placeholder="Or pick specific date & time"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                hideQuickSelect={true}
              />
            </div>
          </div>

          {/* Estimated Pomodoros */}
          <div className={theme === 'retro' ? "bg-[#ffd4f4] dark:bg-gray-800 border-2 dark:border border-black dark:border-gray-700 rounded-xl dark:rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-sm space-y-3" : "space-y-3 pt-2"}>
            <label className={theme === 'retro' ? "text-sm font-black dark:font-semibold text-gray-900 dark:text-gray-300 flex items-center gap-2" : "text-sm font-semibold text-gray-900"}>
              {theme === 'retro' && <Timer className="w-4 h-4" />}
              Estimated Pomodoros
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {theme === 'retro' ? (
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 rounded-lg flex items-center justify-center text-xl shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] dark:shadow-sm">
                    🍅
                  </div>
                ) : (
                  <span className="text-2xl">🍅</span>
                )}
                <div className="flex-1">
                  <Slider
                    value={[editEstimatedPomodoros]}
                    onValueChange={(value) => {
                      setEditEstimatedPomodoros(value[0]);
                      // Immediate save for slider changes
                      if (editingTask) {
                        const currentTitle = titleInputRef.current?.value || editTitle;
                        updateTask(editingTask.id, {
                          title: currentTitle,
                          description: editDescription,
                          dueDate: editDueDate,
                          categoryId: editCategory,
                          estimatedPomodoros: value[0],
                          workspaceUrls: editWorkspaceUrls,
                        });
                      }
                    }}
                    min={1}
                    max={15}
                    step={1}
                    className="w-full"
                  />
                </div>
                <span className={theme === 'retro' ? "min-w-[3rem] text-center font-black dark:font-bold text-2xl dark:text-xl text-gray-900 dark:text-blue-400 bg-white dark:bg-blue-900/30 border-2 dark:border-0 border-black rounded-lg px-3 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] dark:shadow-none" : "min-w-[3rem] text-center font-semibold text-blue-600"}>
                  {editEstimatedPomodoros}
                </span>
              </div>
              <div className={theme === 'retro' ? "text-xs text-gray-700 dark:text-gray-400 font-bold dark:font-normal flex items-center gap-2 bg-white dark:bg-gray-900 border-2 dark:border-0 border-black rounded-lg dark:rounded-md px-3 py-2" : "text-xs text-gray-500 flex items-center gap-1"}>
                <Clock className="w-3 h-3" />
                Approximately {editEstimatedPomodoros * 30} minutes of focused work
              </div>
            </div>
          </div>

          {/* Workspace URLs */}
          <div className={theme === 'retro' ? "bg-[#96f2d7] border-2 border-black dark:border-white rounded-xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] space-y-3" : "space-y-3 pt-2 border-t border-gray-100"}>
            <label className={theme === 'retro' ? "text-sm font-black text-gray-900 dark:text-gray-100 dark:text-white flex items-center gap-2" : "text-sm font-semibold text-gray-900 flex items-center gap-2"}>
              {theme === 'retro' ? (
                <>
                  <div className="w-5 h-5 bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded flex items-center justify-center">
                    🔗
                  </div>
                  Workspace URLs
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 border border-black dark:border-white rounded px-2 py-0.5">optional</span>
                </>
              ) : (
                <>
                  <span className="text-lg">🔗</span>
                  Workspace URLs
                  <span className="text-xs text-gray-500 font-normal">(optional)</span>
                </>
              )}
            </label>
            <div className="space-y-3">
              <div className={theme === 'retro' ? "text-xs text-gray-700 dark:text-gray-300 font-bold bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg px-3 py-2" : "text-xs text-gray-600"}>
                URLs that will automatically open when you start a Pomodoro for this task
              </div>
              
              {/* URL Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editUrlInput}
                  onChange={(e) => setEditUrlInput(e.target.value)}
                  placeholder="Enter URL (e.g., github.com/user/repo)"
                  className={theme === 'retro' ? "flex-1 px-3 py-2 text-sm border-2 border-black dark:border-white rounded-lg focus:outline-none focus:shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] bg-white dark:bg-gray-800 font-bold" : "flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editUrlInput.trim()) {
                      e.preventDefault();
                      if (!editWorkspaceUrls.includes(editUrlInput.trim())) {
                        const newUrls = [...editWorkspaceUrls, editUrlInput.trim()];
                        setEditWorkspaceUrls(newUrls);
                        setEditUrlInput('');
                        // Auto-save the URLs
                        if (editingTask) {
                          const currentTitle = titleInputRef.current?.value || editTitle;
                          updateTask(editingTask.id, {
                            title: currentTitle,
                            description: editDescription,
                            dueDate: editDueDate,
                            categoryId: editCategory,
                            estimatedPomodoros: editEstimatedPomodoros,
                            workspaceUrls: newUrls,
                          });
                        }
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (editUrlInput.trim() && !editWorkspaceUrls.includes(editUrlInput.trim())) {
                      const newUrls = [...editWorkspaceUrls, editUrlInput.trim()];
                      setEditWorkspaceUrls(newUrls);
                      setEditUrlInput('');
                      // Auto-save the URLs
                      if (editingTask) {
                        const currentTitle = titleInputRef.current?.value || editTitle;
                        updateTask(editingTask.id, {
                          title: currentTitle,
                          description: editDescription,
                          dueDate: editDueDate,
                          categoryId: editCategory,
                          estimatedPomodoros: editEstimatedPomodoros,
                          workspaceUrls: newUrls,
                        });
                      }
                    }
                  }}
                  disabled={!editUrlInput.trim() || editWorkspaceUrls.includes(editUrlInput.trim())}
                  className={theme === 'retro' ? "px-3 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white rounded-lg font-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]" : "px-3"}
                >
                  Add
                </Button>
              </div>

              {/* URL List */}
              {editWorkspaceUrls.length > 0 && (
                <div className="space-y-2">
                  <div className={theme === 'retro' ? "text-xs text-gray-700 dark:text-gray-300 font-bold" : "text-xs text-gray-600"}>
                    URLs to open ({editWorkspaceUrls.length}):
                  </div>
                  <div className="space-y-2">
                    {editWorkspaceUrls.map((url, index) => (
                      <div key={index} className={theme === 'retro' ? "flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]" : "flex items-center gap-2 p-2 bg-gray-50 rounded border"}>
                        <span className={theme === 'retro' ? "text-sm font-bold" : "text-xs"}>🔗</span>
                        <span className={theme === 'retro' ? "flex-1 text-sm text-gray-900 dark:text-white truncate font-bold" : "flex-1 text-sm text-gray-700 truncate"} title={url}>
                          {url}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newUrls = editWorkspaceUrls.filter((_, i) => i !== index);
                            setEditWorkspaceUrls(newUrls);
                            // Auto-save the URLs
                            if (editingTask) {
                              const currentTitle = titleInputRef.current?.value || editTitle;
                              updateTask(editingTask.id, {
                                title: currentTitle,
                                description: editDescription,
                                dueDate: editDueDate,
                                categoryId: editCategory,
                                estimatedPomodoros: editEstimatedPomodoros,
                                workspaceUrls: newUrls,
                              });
                            }
                          }}
                          className={theme === 'retro' ? "h-7 w-7 p-0 text-gray-900 dark:text-white hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-md font-black text-lg" : "h-6 w-6 p-0 text-gray-400 hover:text-red-600"}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          </div>
        </div>
      </div>

      {/* Right Sliding Panel for Task Viewing */}
      <div 
        ref={viewPanelRef}
        className={`
          fixed top-0 right-0 h-full w-[480px] bg-card border-l border-border 
          transform transition-transform duration-300 ease-in-out z-40
          ${isViewPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className={theme === 'retro' ? "bg-[#FFE164] border-b-2 border-black dark:border-gray-600 p-6 pb-4 flex-shrink-0" : "bg-card border-b border-border p-6 pb-0 flex-shrink-0"}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={theme === 'retro' ? "text-2xl font-black text-gray-900 flex items-center gap-2" : "text-xl font-semibold text-foreground"}>{theme === 'retro' && <span className="text-2xl">📋</span>}Task Details</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsViewPanelOpen(false);
                setViewingTask(null);
              }}
              className={theme === 'retro' ? "text-gray-900 hover:bg-black/10 rounded-md h-8 w-8" : "text-gray-500 hover:text-gray-700"}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          {theme === 'retro' && (
            <div className="text-xs text-gray-900 font-bold bg-[#FFE164] border-2 border-black dark:border-gray-700 rounded-lg px-3 py-1.5 inline-block shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] mb-4">
              View task details and perform actions
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => viewingTask && handleEditTask(viewingTask)}
              variant="outline"
              size="sm"
              className={theme === 'retro' ? "font-bold border-2 border-black dark:border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] hover:translate-x-[-1px] hover:translate-y-[-1px]" : "font-medium"}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => viewingTask && handleStartPomodoro(viewingTask)}
              disabled={pomodoroTimer.isRunning && pomodoroTimer.currentSession?.taskId === viewingTask?.id}
              className={
                theme === 'retro'
                  ? `font-bold border-2 rounded-md ${
                      pomodoroTimer.isRunning && pomodoroTimer.currentSession?.taskId === viewingTask?.id
                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-black dark:border-gray-300 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                    }`
                  : `font-medium ${
                      pomodoroTimer.isRunning && pomodoroTimer.currentSession?.taskId === viewingTask?.id
                        ? 'bg-green-50 text-green-700 border-green-200 cursor-not-allowed'
                        : ''
                    }`
              }
            >
              {pomodoroTimer.isRunning && pomodoroTimer.currentSession?.taskId === viewingTask?.id ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Pomodoro Running
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Pomodoro
                </>
              )}
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
              className={theme === 'retro' ? "font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-400 dark:hover:border-red-600 rounded-md shadow-[2px_2px_0_0_rgba(220,38,38,0.3)] dark:shadow-[2px_2px_0_0_rgba(220,38,38,0.5)]" : "font-medium text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"}
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
                    viewingTask.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {viewingTask.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 dark:prose-invert"
                    dangerouslySetInnerHTML={{ 
                      __html: viewingTask.description
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
                        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
                    }}
                  />
                </div>
              </div>
            )}

            {/* Details Section */}
            <div className="px-6 pb-6">
                              <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Task Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      viewingTask.completed 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
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
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</label>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(viewingTask.created).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Pomodoro Progress - Full Width */}
                <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Pomodoro Progress</label>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🍅</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {viewingTask.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0} / {viewingTask.estimatedPomodoros || 3}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 dark:bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, ((viewingTask.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0) / (viewingTask.estimatedPomodoros || 3)) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(((viewingTask.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0) / (viewingTask.estimatedPomodoros || 3)) * 100)}% complete
                    </span>
                  </div>
                </div>

                {/* Due Date - Full Width if Present */}
                {viewingTask.dueDate && (
                  <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Due Date</label>
                                         <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                       <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                       <span className="font-medium">
                         {formatSmartDate(new Date(viewingTask.dueDate))}
                       </span>
                     </div>
                  </div>
                )}

                {/* Workspace URLs - Full Width if Present */}
                {viewingTask.workspaceUrls && viewingTask.workspaceUrls.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Workspace URLs ({viewingTask.workspaceUrls.length})
                    </label>
                    <div className="space-y-1">
                      {viewingTask.workspaceUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                          <span className="text-blue-500 dark:text-blue-400">🌐</span>
                          <span 
                            className="flex-1 text-gray-700 dark:text-gray-300 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
                            title={url}
                            onClick={() => {
                              try {
                                const formattedUrl = url.startsWith('http://') || url.startsWith('https://') 
                                  ? url 
                                  : `https://${url}`;
                                window.open(formattedUrl, '_blank');
                              } catch (error) {
                                console.error('Error opening URL:', error);
                              }
                            }}
                          >
                            {url}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      <Dialog open={isAddCategoryModalOpen} onOpenChange={setIsAddCategoryModalOpen}>
        <DialogContent className={theme === 'retro' ? "sm:max-w-[500px] bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,0.3)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.2)]" : "sm:max-w-[500px]"}>
          <DialogHeader>
            <DialogTitle className={theme === 'retro' ? "text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2" : ""}>
              {theme === 'retro' && <Plus className="w-6 h-6" />}
              Create New Category
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Category Name */}
            <div className={theme === 'retro' ? "bg-[#fff3b0] dark:bg-[#ffd700]/20 border-2 border-black dark:border-white rounded-xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]" : "space-y-2"}>
              <label className={theme === 'retro' ? "text-sm font-black text-gray-900 dark:text-gray-100 dark:text-white" : "text-sm font-medium"}>Category Name</label>
              <Input
                placeholder="e.g., Work, Personal, Fitness"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={theme === 'retro' ? "border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-800 font-bold focus:shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] h-11" : ""}
                autoFocus
              />
            </div>

            {/* Icon Selection */}
            <div className={theme === 'retro' ? "bg-[#d4f1ff] dark:bg-[#00d4ff]/20 border-2 border-black dark:border-white rounded-xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] space-y-3" : "space-y-2"}>
              <label className={theme === 'retro' ? "text-sm font-black text-gray-900 dark:text-gray-100 dark:text-white" : "text-sm font-medium"}>Icon</label>
              <div className="grid grid-cols-8 gap-2">
                {categoryIcons.map((icon: string) => (
                  <button
                    key={icon}
                    onClick={() => setNewCategoryIcon(icon)}
                    className={
                      theme === 'retro'
                        ? `w-10 h-10 text-lg rounded-lg border-2 transition-all ${
                            newCategoryIcon === icon
                              ? 'border-black dark:border-white bg-black dark:bg-white shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-black dark:hover:border-white'
                          }`
                        : `w-9 h-9 text-base rounded border transition-colors ${
                            newCategoryIcon === icon
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`
                    }
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className={theme === 'retro' ? "bg-[#ffd4f4] dark:bg-[#ff69b4]/20 border-2 border-black dark:border-white rounded-xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] space-y-3" : "space-y-2"}>
              <label className={theme === 'retro' ? "text-sm font-black text-gray-900 dark:text-gray-100 dark:text-white" : "text-sm font-medium"}>Color</label>
              <div className="grid grid-cols-8 gap-2">
                {categoryColors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={
                      theme === 'retro'
                        ? `w-10 h-10 rounded-lg border-2 transition-all ${
                            newCategoryColor === color
                              ? 'border-black dark:border-white shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] scale-110'
                              : 'border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white hover:scale-105'
                          }`
                        : `w-9 h-9 rounded border-2 transition-transform hover:scale-110 ${
                            newCategoryColor === color
                              ? 'border-gray-800 shadow-sm'
                              : 'border-gray-200'
                          }`
                    }
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  if (newCategoryName.trim()) {
                    const color = newCategoryColor || categoryColors[userData.categories.length % categoryColors.length];
                    addCategory(newCategoryName.trim(), color, newCategoryIcon);
                    setNewCategoryName('');
                    setNewCategoryIcon('📝');
                    setNewCategoryColor('');
                    setIsAddCategoryModalOpen(false);
                  }
                }}
                disabled={!newCategoryName.trim()}
                className={
                  theme === 'retro'
                    ? "flex-1 bg-[#96f2d7] dark:bg-teal-600 hover:bg-[#96f2d7] dark:hover:bg-teal-600 text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.2)] dark:hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px] transition-all font-black h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                    : "flex-1"
                }
              >
                Create Category
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setNewCategoryName('');
                  setNewCategoryIcon('📝');
                  setNewCategoryColor('');
                  setIsAddCategoryModalOpen(false);
                }}
                className={
                  theme === 'retro'
                    ? "px-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-black dark:border-white rounded-xl font-bold h-11 hover:bg-gray-100 dark:hover:bg-gray-700"
                    : ""
                }
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <DialogContent className={theme === 'retro' ? "sm:max-w-[450px] bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,0.3)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.2)]" : "sm:max-w-[450px]"}>
          <DialogHeader>
            <DialogTitle className={theme === 'retro' ? "text-2xl font-black text-red-600 dark:text-red-400 flex items-center gap-2" : "text-xl font-semibold text-red-600 dark:text-red-400"}>
              {theme === 'retro' && <Trash2 className="w-6 h-6" />}
              Delete Category?
            </DialogTitle>
          </DialogHeader>
          
          {deletingCategory && (
            <div className="space-y-4 pt-4">
              <div className={theme === 'retro' ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4"}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{userData.categories.find(c => c.id === deletingCategory.id)?.icon || '📁'}</div>
                  <div>
                    <div className={theme === 'retro' ? "text-lg font-black text-gray-900 dark:text-gray-100" : "text-lg font-semibold text-gray-900 dark:text-gray-100"}>
                      {deletingCategory.name}
                    </div>
                    <div className={theme === 'retro' ? "text-sm text-gray-600 dark:text-gray-400 font-bold" : "text-sm text-gray-600 dark:text-gray-400"}>
                      Category
                    </div>
                  </div>
                </div>
                
                {deletingCategory.taskCount > 0 ? (
                  <div className={theme === 'retro' ? "space-y-2 pt-3 border-t-2 border-red-200 dark:border-red-800" : "space-y-2 pt-3 border-t border-red-200 dark:border-red-800"}>
                    <p className={theme === 'retro' ? "text-sm font-black text-red-800 dark:text-red-300" : "text-sm font-semibold text-red-800 dark:text-red-300"}>
                      ⚠️ Warning: This action cannot be undone
                    </p>
                    <p className={theme === 'retro' ? "text-sm text-gray-700 dark:text-gray-300 font-bold" : "text-sm text-gray-700 dark:text-gray-300"}>
                      Deleting this category will also delete:
                    </p>
                    <div className={theme === 'retro' ? "bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700 rounded-lg p-3" : "bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-3"}>
                      <div className={theme === 'retro' ? "text-2xl font-black text-red-600 dark:text-red-400" : "text-2xl font-bold text-red-600 dark:text-red-400"}>
                        {deletingCategory.taskCount}
                      </div>
                      <div className={theme === 'retro' ? "text-sm text-gray-600 dark:text-gray-400 font-bold" : "text-sm text-gray-600 dark:text-gray-400"}>
                        Task{deletingCategory.taskCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className={theme === 'retro' ? "text-sm text-gray-600 dark:text-gray-400 font-bold pt-2" : "text-sm text-gray-600 dark:text-gray-400 pt-2"}>
                    This category has no tasks and can be safely deleted.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingCategory(null)}
                  className={
                    theme === 'retro'
                      ? "flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-black dark:border-white rounded-xl font-bold h-11 hover:bg-gray-100 dark:hover:bg-gray-700"
                      : "flex-1"
                  }
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    deleteCategory(deletingCategory.id);
                    // If the currently editing task has this category, reset it
                    if (editCategory === deletingCategory.id) {
                      setEditCategory(undefined);
                      if (editingTask) {
                        updateTask(editingTask.id, { categoryId: undefined });
                      }
                    }
                    // If the currently creating task has this category, reset it
                    if (taskCategory === deletingCategory.id) {
                      setTaskCategory(undefined);
                    }
                    setDeletingCategory(null);
                  }}
                  className={
                    theme === 'retro'
                      ? "flex-1 bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 text-white border-2 border-red-600 dark:border-red-600 rounded-xl shadow-[4px_4px_0_0_rgba(220,38,38,0.3)] dark:shadow-[4px_4px_0_0_rgba(220,38,38,0.5)] hover:shadow-[5px_5px_0_0_rgba(220,38,38,0.4)] dark:hover:shadow-[5px_5px_0_0_rgba(220,38,38,0.6)] hover:translate-y-[-1px] transition-all font-black h-11"
                      : "flex-1 bg-red-600 hover:bg-red-700 text-white"
                  }
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Category
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onView: () => void;
  onEdit: () => void;
  onStartPomodoro: () => void;
  onDelete: () => void;
  dragHandle?: React.ReactNode;
  theme?: 'clean' | 'retro';
}

interface SortableTaskItemProps extends Omit<TaskItemProps, 'dragHandle'> {
  isDraggable: boolean;
  section?: string;
  theme?: 'clean' | 'retro';
}

const DroppableSection: React.FC<{ 
  children: React.ReactNode; 
  section: string; 
  className?: string;
  isDragging?: boolean;
}> = ({ children, section, className = "", isDragging = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${section}`,
    data: {
      section: section,
    }
  });

  return (
    <div ref={setNodeRef} className={`${className} group`} data-is-over={isOver} data-dragging={isDragging}>
      {children}
    </div>
  );
};

const DragOverlayTaskItem: React.FC<{ task: Task; theme?: 'clean' | 'retro' }> = ({ task, theme = 'clean' }) => {
  const { userData } = useTodo();
  const completedSessions = task.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
  
  return (
    <div className={
      theme === 'retro'
        ? "flex items-center gap-3 p-3 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-2 border-black dark:border-gray-500 cursor-grabbing transform shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]"
        : "flex items-center gap-3 py-2 px-3 bg-card shadow-lg rounded-lg border border-border cursor-grabbing transform"
    }>
      <div className="flex-shrink-0 p-1">
        <GripVertical className={theme === 'retro' ? "w-4 h-4 text-gray-600 dark:text-gray-400" : "w-4 h-4 text-gray-400"} />
      </div>
      <div className={
        theme === 'retro'
          ? "flex-shrink-0 w-5 h-5 rounded-md border-2 border-black dark:border-gray-300"
          : "flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300"
      }></div>
      
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm">
            {userData.categories.find(cat => cat.id === task.categoryId)?.icon || '📝'}
          </span>
          <div 
            className={theme === 'retro' ? "w-2 h-2 rounded-sm flex-shrink-0 border border-black dark:border-gray-400" : "w-1.5 h-1.5 rounded-full flex-shrink-0"}
            style={{ backgroundColor: userData.categories.find(cat => cat.id === task.categoryId)?.color || '#6B7280' }}
          />
        </div>
        <span className={theme === 'retro' ? "text-sm font-bold text-foreground dark:text-gray-100" : "text-sm font-medium text-foreground"}>
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {task.dueDate && (
          <Clock className={theme === 'retro' ? "w-3 h-3 text-gray-500 dark:text-gray-400" : "w-3 h-3 text-gray-400"} />
        )}
        {(completedSessions > 0 || task.estimatedPomodoros) && (
          <span className="text-xs text-muted-foreground">🍅{completedSessions}/{task.estimatedPomodoros || 3}</span>
        )}
      </div>
    </div>
  );
};

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  onToggleComplete,
  onView,
  onEdit,
  onStartPomodoro,
  onDelete,
  isDraggable,
  section,
  theme = 'clean',
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      section: section,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        onToggleComplete={onToggleComplete}
        onView={onView}
        onEdit={onEdit}
        onStartPomodoro={onStartPomodoro}
        onDelete={onDelete}
        theme={theme}
        dragHandle={isDraggable ? (
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded mr-2"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        ) : undefined}
      />
    </div>
  );
};



const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onView,
  onEdit,
  onStartPomodoro,
  onDelete,
  dragHandle,
  theme = 'clean',
}) => {
  const { userData, updateTask } = useTodo();
  const completedSessions = task.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
  
  // Get Pomodoro timer state from context
  const { pomodoroTimer } = useTodo();
  const isCurrentTaskPomodoro = pomodoroTimer?.currentSession?.taskId === task.id;

  // Simple smart date formatter
  const getSmartDateText = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const timeStr = new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).format(date);
    
    if (targetDate.getTime() === today.getTime()) {
      return `Today by ${timeStr}`;
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow by ${timeStr}`;
    } else if (targetDate.getTime() < today.getTime()) {
      const daysDiff = Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        return `Overdue for 1 day`;
      } else if (daysDiff < 7) {
        return `Overdue for ${daysDiff} days`;
      } else if (daysDiff < 14) {
        return `Overdue for 1 week`;
      } else if (daysDiff < 21) {
        return `Overdue for 2 weeks`;
      } else if (daysDiff < 28) {
        return `Overdue for 3 weeks`;
      } else if (daysDiff < 60) {
        const weeks = Math.floor(daysDiff / 7);
        return `Overdue for ${weeks} weeks`;
      } else {
        const months = Math.floor(daysDiff / 30);
        return months === 1 ? `Overdue for 1 month` : `Overdue for ${months} months`;
      }
    } else {
      const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return `${date.toLocaleDateString('en-US', { weekday: 'long' })} by ${timeStr}`;
      } else {
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} by ${timeStr}`;
      }
    }
  };

  // Check if task is overdue
  const isOverdue = React.useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const taskDate = new Date(task.dueDate);
    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    return taskDateOnly.getTime() < todayOnly.getTime();
  }, [task.dueDate, task.completed]);

  const handleMoveToToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    updateTask(task.id, { dueDate: today });
  };

  const handleMoveToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    updateTask(task.id, { dueDate: tomorrow });
  };

  const handleMoveToNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    updateTask(task.id, { dueDate: nextWeek });
  };

  const handleRemoveDueDate = () => {
    updateTask(task.id, { dueDate: undefined });
  };

  // Minimal todo item - just title and checkbox
  
  return (
    <div 
      className={
        theme === 'retro'
          ? `group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border-2 ${
              isOverdue
                ? 'bg-[#ffcccb] dark:bg-red-800/80 border-black dark:border-gray-500 hover:border-black dark:hover:border-gray-400 hover:translate-y-[-2px] shadow-[6px_6px_0_0_rgba(0,0,0,0.12)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.15)] dark:hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.8)]'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-gray-400 hover:translate-y-[-2px] shadow-[4px_4px_0_0_rgba(0,0,0,0.08)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.12)] dark:hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.7)]'
            }`
          : `group flex items-center gap-3 py-2 px-3 rounded-lg transition-colors cursor-pointer border ${
              isOverdue 
                ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 hover:border-orange-500/50' 
                : 'bg-card hover:bg-accent border-border hover:border-accent'
            }`
      }
      onClick={() => onView()}
    >
      {dragHandle}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className={
          theme === 'retro'
            ? `flex-shrink-0 w-5 h-5 rounded-md border-2 border-black dark:border-gray-300 flex items-center justify-center transition-all duration-200 shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.6)] ${
                task.completed 
                  ? 'bg-black dark:bg-gray-100' 
                  : 'bg-white dark:bg-gray-700'
              }`
            : `flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                task.completed 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-gray-300 hover:border-blue-400'
              }`
        }
      >
        {task.completed && (
          theme === 'retro' ? (
            <div className="w-2 h-2 rounded-sm bg-white dark:bg-gray-900"></div>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )
        )}
      </button>
      
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm">
            {userData.categories.find(cat => cat.id === task.categoryId)?.icon || '📝'}
          </span>
          <div 
            className={theme === 'retro' ? "w-2 h-2 rounded-sm flex-shrink-0 border border-black dark:border-gray-400" : "w-1.5 h-1.5 rounded-full flex-shrink-0"}
            style={{ backgroundColor: userData.categories.find(cat => cat.id === task.categoryId)?.color || '#6B7280' }}
          />
        </div>
        <span className={
          theme === 'retro'
            ? `text-sm font-bold cursor-pointer ${
                task.completed 
                  ? 'line-through text-muted-foreground' 
                  : 'text-foreground dark:text-gray-100'
              }`
            : `text-sm font-medium cursor-pointer ${
                task.completed 
                  ? 'line-through text-muted-foreground' 
                  : isOverdue 
                    ? 'text-orange-600' 
                    : 'text-foreground'
              }`
        }>
          {task.title}
        </span>
      </div>

      {/* Small indicators and menu */}
      <div className="flex items-center gap-1">
        {/* Always visible indicators */}
        <div className="flex items-center gap-1">
          {isOverdue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400 cursor-help">
                  <Clock className="w-3 h-3 fill-current" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getSmartDateText(new Date(task.dueDate!))}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {task.dueDate && !isOverdue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{getSmartDateText(new Date(task.dueDate))}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {(completedSessions > 0 || task.estimatedPomodoros) && (
            <span className="text-xs text-muted-foreground font-medium">
              🍅 {completedSessions}/{task.estimatedPomodoros || 3}
            </span>
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
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {/* Main actions */}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
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
                if (!isCurrentTaskPomodoro) {
                  onStartPomodoro();
                }
              }}
              disabled={isCurrentTaskPomodoro}
              className={`flex items-center gap-2 ${
                isCurrentTaskPomodoro ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCurrentTaskPomodoro ? (
                <>
                  <Clock className="w-4 h-4" />
                  Pomodoro Running
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Pomodoro
                </>
              )}
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
            
            <div className="border-t my-1"></div>
            
            {/* Move to... options */}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMoveToToday();
              }}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <CalendarDays className="w-4 h-4" />
              Move to Today
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMoveToTomorrow();
              }}
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <Calendar className="w-4 h-4" />
              Move to Tomorrow
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMoveToNextWeek();
              }}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
            >
              <CalendarDays className="w-4 h-4" />
              Move to Next Week
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveDueDate();
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
              Remove Due Date
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TasksPage; 