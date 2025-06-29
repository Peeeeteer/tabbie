import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserData, Category, Task, PomodoroSession } from '@/types/todo';
import { DEFAULT_CATEGORIES } from '@/types/todo';
import { loadUserData, saveUserData, generateId } from '@/utils/storage';

interface TodoContextType {
  userData: UserData;
  selectedCategoryId: string | null;
  currentTask: Task | null;
  pomodoroTimer: {
    isRunning: boolean;
    timeLeft: number; // in seconds
    currentSession: PomodoroSession | null;
    sessionType: 'work' | 'shortBreak' | 'longBreak';
  };
  
  // Category methods
  addCategory: (name: string, color: string, icon: string) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (categoryId: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  resetCategoriesToDefault: () => void;
  
  // Task methods
  addTask: (title: string, categoryId?: string, description?: string, dueDate?: Date) => string;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  
  // Pomodoro methods
  startPomodoro: (task: Task) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  stopPomodoro: () => void;
  completePomodoro: () => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(loadUserData);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [pomodoroTimer, setPomodoroTimer] = useState({
    isRunning: false,
    timeLeft: 0,
    currentSession: null as PomodoroSession | null,
    sessionType: 'work' as 'work' | 'shortBreak' | 'longBreak',
  });

  // Save to localStorage whenever userData changes
  useEffect(() => {
    saveUserData(userData);
  }, [userData]);

  // Pomodoro timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pomodoroTimer.isRunning && pomodoroTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else if (pomodoroTimer.isRunning && pomodoroTimer.timeLeft === 0) {
      // Timer finished
      completePomodoro();
    }

    return () => clearInterval(interval);
  }, [pomodoroTimer.isRunning, pomodoroTimer.timeLeft]);

  // Category methods
  const addCategory = (name: string, color: string, icon: string) => {
    const newCategory: Category = {
      id: generateId(),
      name,
      color,
      icon,
      created: new Date(),
    };
    setUserData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
  };

  const updateCategory = (categoryId: string, updates: Partial<Category>) => {
    setUserData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ),
    }));
  };

  const deleteCategory = (categoryId: string) => {
    setUserData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== categoryId),
      tasks: prev.tasks.filter(task => task.categoryId !== categoryId),
    }));
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    }
  };

  const setSelectedCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const resetCategoriesToDefault = () => {
    setUserData(prev => ({
      ...prev,
      categories: [...DEFAULT_CATEGORIES],
    }));
  };

  // Task methods
  const addTask = (title: string, categoryId?: string, description?: string, dueDate?: Date): string => {
    const taskId = generateId();
    const newTask: Task = {
      id: taskId,
      title,
      description,
      categoryId,
      completed: false,
      priority: 'medium',
      created: new Date(),
      updated: new Date(),
      dueDate,
      pomodoroSessions: [],
    };
    setUserData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
    return taskId;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setUserData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates, updated: new Date() } : task
      ),
    }));
  };

  const deleteTask = (taskId: string) => {
    setUserData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
      pomodoroSessions: prev.pomodoroSessions.filter(session => session.taskId !== taskId),
    }));
    if (currentTask?.id === taskId) {
      setCurrentTask(null);
      stopPomodoro();
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    updateTask(taskId, { 
      completed: !userData.tasks.find(t => t.id === taskId)?.completed 
    });
  };

  // Pomodoro methods
  const startPomodoro = (task: Task) => {
    const session: PomodoroSession = {
      id: generateId(),
      taskId: task.id,
      started: new Date(),
      duration: userData.settings.workDuration,
      completed: false,
      type: 'work',
    };

    setCurrentTask(task);
    setPomodoroTimer({
      isRunning: true,
      timeLeft: userData.settings.workDuration * 60, // convert to seconds
      currentSession: session,
      sessionType: 'work',
    });
  };

  const pausePomodoro = () => {
    setPomodoroTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resumePomodoro = () => {
    setPomodoroTimer(prev => ({ ...prev, isRunning: true }));
  };

  const stopPomodoro = () => {
    if (pomodoroTimer.currentSession) {
      // Save incomplete session
      const session = {
        ...pomodoroTimer.currentSession,
        ended: new Date(),
        completed: false,
      };
      setUserData(prev => ({
        ...prev,
        pomodoroSessions: [...prev.pomodoroSessions, session],
      }));
    }

    setPomodoroTimer({
      isRunning: false,
      timeLeft: 0,
      currentSession: null,
      sessionType: 'work',
    });
    setCurrentTask(null);
  };

  const completePomodoro = () => {
    if (pomodoroTimer.currentSession) {
      // Save completed session
      const completedSession = {
        ...pomodoroTimer.currentSession,
        ended: new Date(),
        completed: true,
      };
      
      setUserData(prev => ({
        ...prev,
        pomodoroSessions: [...prev.pomodoroSessions, completedSession],
      }));

      // Update task with completed session
      if (currentTask) {
        updateTask(currentTask.id, {
          pomodoroSessions: [...currentTask.pomodoroSessions, completedSession],
        });
      }
    }

    setPomodoroTimer({
      isRunning: false,
      timeLeft: 0,
      currentSession: null,
      sessionType: 'work',
    });
    
    // Keep current task for potential next session
    // setCurrentTask(null); // Don't clear, user might want to start another session
  };

  const value: TodoContextType = {
    userData,
    selectedCategoryId,
    currentTask,
    pomodoroTimer,
    
    addCategory,
    updateCategory,
    deleteCategory,
    setSelectedCategory,
    resetCategoriesToDefault,
    
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    completePomodoro,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}; 