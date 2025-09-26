import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, Calendar, X, CalendarDays, RotateCcw, MoreVertical, Edit, Play, Trash2, Eye, GripVertical, ChevronDown, ChevronUp, SkipForward } from 'lucide-react';
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
import type { Task } from '@/types/todo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
}

const TasksPage: React.FC<TasksPageProps> = ({ currentView, onViewChange, onPageChange }) => {
  const {
    userData,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    startPomodoro,
    resetCategoriesToDefault,
    reorderTasks,
    pomodoroTimer,
  } = useTodo();

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
  const [completedTasksPage, setCompletedTasksPage] = useState(1);

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

  const getLocalDateString = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(date);
  };

  const today = getLocalDate(new Date());
  const tomorrow = getLocalDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
  const next7Days = getLocalDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));

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

  const getAllTasks = () => {
    return userData.tasks.filter(task => !task.completed).sort((a, b) => a.order - b.order);
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
  const getAllTaskCount = () => getAllTasks().length;
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

  const getTasksWithoutCategory = () => {
    return userData.tasks.filter(task => !task.completed && !task.categoryId);
  };

  const getTasksWithoutCategoryCount = () => {
    return getTasksWithoutCategory().length;
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
                  <h3 className="font-semibold text-lg text-gray-800">Today</h3>
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
                      onToggleComplete={() => toggleTaskComplete(task.id)}
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onStartPomodoro={() => handleStartPomodoro(task)}
                      onDelete={() => deleteTask(task.id)}
                      isDraggable={true}
                      section="today"
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
                  <h3 className="font-semibold text-lg text-gray-800">Tomorrow</h3>
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
                      onToggleComplete={() => toggleTaskComplete(task.id)}
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onStartPomodoro={() => handleStartPomodoro(task)}
                      onDelete={() => deleteTask(task.id)}
                      isDraggable={true}
                      section="tomorrow"
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
                  <h3 className="font-semibold text-lg text-gray-800">Next 7 Days</h3>
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
                      onToggleComplete={() => toggleTaskComplete(task.id)}
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onStartPomodoro={() => handleStartPomodoro(task)}
                      onDelete={() => deleteTask(task.id)}
                      isDraggable={true}
                      section="next7days"
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
                  <h3 className="font-semibold text-lg text-gray-800">Unscheduled</h3>
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
                      onToggleComplete={() => toggleTaskComplete(task.id)}
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onStartPomodoro={() => handleStartPomodoro(task)}
                      onDelete={() => deleteTask(task.id)}
                      isDraggable={true}
                      section="unscheduled"
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
            <DragOverlayTaskItem task={activeDragTask} />
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
              <DragOverlayTaskItem task={activeDragTask} />
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
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Filter by completion date:</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCompletedTasksDateFilterChange('7days')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      completedTasksDateFilter === '7days'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-card text-muted-foreground border border-border hover:bg-accent'
                    }`}
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => handleCompletedTasksDateFilterChange('30days')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      completedTasksDateFilter === '30days'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-card text-muted-foreground border border-border hover:bg-accent'
                    }`}
                  >
                    Last 30 days
                  </button>
                  <button
                    onClick={() => handleCompletedTasksDateFilterChange('all')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      completedTasksDateFilter === 'all'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-card text-muted-foreground border border-border hover:bg-accent'
                    }`}
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
            <div ref={navigationRef} className="flex items-center justify-between border-b" style={{ marginLeft: '-24px', paddingLeft: '24px', marginRight: '-24px', paddingRight: '24px' }}>
              <div className="flex items-center space-x-6">

                <button
                  onClick={() => onViewChange?.('next7days')}
                  className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    currentView === 'next7days'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Overview
                    {(getTodayTaskCount() + getTomorrowTaskCount() + getNext7DaysTaskCount() + getUnscheduledTaskCount()) > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {getTodayTaskCount() + getTomorrowTaskCount() + getNext7DaysTaskCount() + getUnscheduledTaskCount()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onViewChange?.('today')}
                  className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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
                  className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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
                  onClick={() => onViewChange?.('completed')}
                  className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    currentView === 'completed'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Completed
                    {getCompletedTaskCount() > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs cursor-help">
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
                <div className="pb-3 flex items-center gap-3">
                  <Select 
                    value={userData.categories.some(cat => cat.id === currentView) ? currentView : ''} 
                    onValueChange={(value) => onViewChange?.(value as any)}
                  >
                    <SelectTrigger className="w-32 h-8 border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {userData.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name}</span>
                            {getCategoryTaskCount(category.id) > 0 && (
                              <span className="ml-auto bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                                {getCategoryTaskCount(category.id)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
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
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {renderContent()}
        </div>
      </div>

      {/* Right Sliding Panel for Task Creation */}
      <div 
        ref={createPanelRef}
        className={`
          fixed top-0 right-0 h-full w-[576px] bg-card border-l border-border 
          transform transition-transform duration-300 ease-in-out z-50 flex flex-col
          ${isCreatePanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className="bg-card border-b border-border p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-2 h-10">
            <h2 className="text-xl font-semibold text-foreground">Create New Task</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsCreatePanelOpen(false);
                resetCreateTaskForm();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            ✨ Changes are automatically saved as you type
          </div>
        </div>

        {/* Task Creation Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
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
              <Select value={taskCategory || 'no-category'} onValueChange={(value) => setTaskCategory(value === 'no-category' ? undefined : value)}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900">Due Date</label>
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
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
          <div className="space-y-3 pt-2">
            <label className="text-sm font-semibold text-gray-900">Estimated Pomodoros</label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🍅</span>
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
                <span className="min-w-[3rem] text-center font-semibold text-blue-600">
                  {newTaskEstimatedPomodoros}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Approximately {newTaskEstimatedPomodoros * 30} minutes of focused work
              </div>
            </div>
          </div>

          {/* Workspace URLs */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-lg">🔗</span>
              Workspace URLs
              <span className="text-xs text-gray-500 font-normal">(optional)</span>
            </label>
            <div className="space-y-3">
              <div className="text-xs text-gray-600">
                Add URLs that will automatically open when you start a Pomodoro for this task
              </div>
              
              {/* URL Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  placeholder="Enter URL (e.g., github.com/user/repo)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-3"
                >
                  Add
                </Button>
              </div>

              {/* URL List */}
              {newTaskWorkspaceUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    URLs to open ({newTaskWorkspaceUrls.length}):
                  </div>
                  <div className="space-y-1">
                    {newTaskWorkspaceUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                        <span className="text-xs">🔗</span>
                        <span className="flex-1 text-sm text-gray-700 truncate" title={url}>
                          {url}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewTaskWorkspaceUrls(newTaskWorkspaceUrls.filter((_, i) => i !== index));
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
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
          fixed top-0 right-0 h-full w-[576px] bg-card border-l border-border 
          transform transition-transform duration-300 ease-in-out z-50 flex flex-col
          ${isEditPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className="bg-card border-b border-border p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-2 h-10">
            <h2 className="text-xl font-semibold text-foreground">Edit Task</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            ✨ Changes are automatically saved as you type
          </div>
        </div>

        {/* Task Edit Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
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
              <Select value={editCategory || 'no-category'} onValueChange={(value) => {
                const newCategory = value === 'no-category' ? undefined : value;
                setEditCategory(newCategory);
                // Immediately save the category change with the new value
                if (editingTask) {
                  updateTask(editingTask.id, { categoryId: newCategory });
                }
              }}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Title</label>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900">Due Date</label>
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
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
          <div className="space-y-3 pt-2">
            <label className="text-sm font-semibold text-gray-900">Estimated Pomodoros</label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🍅</span>
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
                <span className="min-w-[3rem] text-center font-semibold text-blue-600">
                  {editEstimatedPomodoros}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Approximately {editEstimatedPomodoros * 30} minutes of focused work
              </div>
            </div>
          </div>

          {/* Workspace URLs */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-lg">🔗</span>
              Workspace URLs
              <span className="text-xs text-gray-500 font-normal">(optional)</span>
            </label>
            <div className="space-y-3">
              <div className="text-xs text-gray-600">
                URLs that will automatically open when you start a Pomodoro for this task
              </div>
              
              {/* URL Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editUrlInput}
                  onChange={(e) => setEditUrlInput(e.target.value)}
                  placeholder="Enter URL (e.g., github.com/user/repo)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-3"
                >
                  Add
                </Button>
              </div>

              {/* URL List */}
              {editWorkspaceUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    URLs to open ({editWorkspaceUrls.length}):
                  </div>
                  <div className="space-y-1">
                    {editWorkspaceUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                        <span className="text-xs">🔗</span>
                        <span className="flex-1 text-sm text-gray-700 truncate" title={url}>
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
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
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
          fixed top-0 right-0 h-full w-[576px] bg-card border-l border-border 
          transform transition-transform duration-300 ease-in-out z-50
          ${isViewPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel Header */}
        <div className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Task Details</h2>
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
              onClick={() => viewingTask && handleStartPomodoro(viewingTask)}
              disabled={pomodoroTimer.isRunning && pomodoroTimer.currentSession?.taskId === viewingTask?.id}
              className={`font-medium ${
                pomodoroTimer.isRunning && pomodoroTimer.currentSession?.taskId === viewingTask?.id
                  ? 'bg-green-50 text-green-700 border-green-200 cursor-not-allowed'
                  : ''
              }`}
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

                {/* Pomodoro Progress - Full Width */}
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <label className="text-xs font-medium text-gray-500">Pomodoro Progress</label>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🍅</span>
                      <span className="font-medium text-gray-700">
                        {viewingTask.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0} / {viewingTask.estimatedPomodoros || 3}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, ((viewingTask.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0) / (viewingTask.estimatedPomodoros || 3)) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(((viewingTask.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0) / (viewingTask.estimatedPomodoros || 3)) * 100)}% complete
                    </span>
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

                {/* Workspace URLs - Full Width if Present */}
                {viewingTask.workspaceUrls && viewingTask.workspaceUrls.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    <label className="text-xs font-medium text-gray-500">
                      Workspace URLs ({viewingTask.workspaceUrls.length})
                    </label>
                    <div className="space-y-1">
                      {viewingTask.workspaceUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                          <span className="text-blue-500">🌐</span>
                          <span 
                            className="flex-1 text-gray-700 truncate cursor-pointer hover:text-blue-600" 
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
}

interface SortableTaskItemProps extends Omit<TaskItemProps, 'dragHandle'> {
  isDraggable: boolean;
  section?: string;
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

const DragOverlayTaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { userData } = useTodo();
  const completedSessions = task.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
  
  return (
            <div className="flex items-center gap-3 py-2 px-3 bg-card shadow-lg rounded-lg border border-border cursor-grabbing transform">
      <div className="flex-shrink-0 p-1">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300"></div>
      
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm">
            {userData.categories.find(cat => cat.id === task.categoryId)?.icon || '📝'}
          </span>
          <div 
            className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
            style={{ backgroundColor: userData.categories.find(cat => cat.id === task.categoryId)?.color || '#6B7280' }}
          />
        </div>
        <span className="text-sm font-medium text-foreground">
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {task.dueDate && (
          <Clock className="w-3 h-3 text-gray-400" />
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
      className={`group flex items-center gap-3 py-2 px-3 rounded-lg transition-colors cursor-pointer border ${
        isOverdue 
          ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 hover:border-orange-500/50' 
          : 'bg-card hover:bg-accent border-border hover:border-accent'
      }`}
      onClick={() => onView()}
    >
      {dragHandle}
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
        <div className="flex items-center gap-1">
          <span className="text-sm">
            {userData.categories.find(cat => cat.id === task.categoryId)?.icon || '📝'}
          </span>
          <div 
            className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
            style={{ backgroundColor: userData.categories.find(cat => cat.id === task.categoryId)?.color || '#6B7280' }}
          />
        </div>
        <span className={`
          text-sm font-medium cursor-pointer
          ${task.completed 
            ? 'line-through text-muted-foreground' 
            : isOverdue 
              ? 'text-orange-600' 
              : 'text-foreground'
          }
        `}>
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
                <div className="flex items-center gap-1 text-orange-500 cursor-help">
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
                <Clock className="w-3 h-3 text-gray-400 cursor-help" />
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