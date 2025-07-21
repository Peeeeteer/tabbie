import type { UserData, Category, Task, PomodoroSession, CompletedTask } from '@/types/todo';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '@/types/todo';

const STORAGE_KEY = 'tabbie_user_data';
const POMODORO_STATE_KEY = 'tabbie_pomodoro_state';

// Helper function to revive Date objects from JSON
const reviveDate = (_key: string, value: unknown) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
};

// Pomodoro state interface for persistence
export interface PomodoroState {
  isRunning: boolean;
  timeLeft: number; // in seconds
  currentSession: PomodoroSession | null;
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  justCompleted: boolean;
  currentTaskId: string | null;
  startedAt: number | null; // timestamp when session started
  pausedAt: number | null; // timestamp when session was paused
}

// Load pomodoro state from localStorage
export const loadPomodoroState = (): PomodoroState | null => {
  try {
    const storedState = localStorage.getItem(POMODORO_STATE_KEY);
    if (storedState) {
      const parsed = JSON.parse(storedState, reviveDate) as PomodoroState;
      
      // If there's a running session, calculate the actual time left
      if (parsed.isRunning && parsed.startedAt && parsed.currentSession) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - parsed.startedAt) / 1000);
        const totalDuration = parsed.currentSession.duration * 60; // convert to seconds
        const actualTimeLeft = Math.max(0, totalDuration - elapsedSeconds);
        
        // If session has actually completed, mark it as not running
        if (actualTimeLeft === 0) {
          return {
            ...parsed,
            isRunning: false,
            timeLeft: 0,
            justCompleted: true,
          };
        }
        
        return {
          ...parsed,
          timeLeft: actualTimeLeft,
        };
      }
      
      // If session was paused, restore the paused time
      if (!parsed.isRunning && parsed.pausedAt && parsed.currentSession) {
        return parsed;
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error loading pomodoro state:', error);
  }
  
  return null;
};

// Save pomodoro state to localStorage
export const savePomodoroState = (state: PomodoroState): void => {
  try {
    localStorage.setItem(POMODORO_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving pomodoro state:', error);
  }
};

// Clear pomodoro state from localStorage
export const clearPomodoroState = (): void => {
  try {
    localStorage.removeItem(POMODORO_STATE_KEY);
  } catch (error) {
    console.error('Error clearing pomodoro state:', error);
  }
};

// Debug function to check persistence state
export const debugPomodoroState = (): void => {
  const savedState = loadPomodoroState();
  const userData = loadUserData();
  
  console.log('=== Pomodoro State Debug ===');
  console.log('Saved pomodoro state:', savedState);
  console.log('User data tasks:', userData.tasks.length);
  console.log('User data pomodoro sessions:', userData.pomodoroSessions.length);
  console.log('===========================');
};

// Load user data from local storage
export const loadUserData = (): UserData => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData, reviveDate) as UserData;
      
      // Ensure all required fields exist with defaults
      const tasks = (parsed.tasks || []).map((task, index) => ({
        ...task,
        // Add order field if it doesn't exist (migration)
        order: task.order !== undefined ? task.order : index,
      }));

      return {
        categories: parsed.categories || DEFAULT_CATEGORIES,
        tasks,
        completedTasks: parsed.completedTasks || [],
        pomodoroSessions: parsed.pomodoroSessions || [],
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  
  // Return default data if nothing stored or error occurred
  return {
    categories: DEFAULT_CATEGORIES,
    tasks: [],
    completedTasks: [],
    pomodoroSessions: [],
    settings: DEFAULT_SETTINGS,
  };
};

// Save user data to local storage
export const saveUserData = (userData: UserData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

// Helper functions for managing specific data
export const saveCategory = (category: Category): void => {
  const userData = loadUserData();
  const existingIndex = userData.categories.findIndex(c => c.id === category.id);
  
  if (existingIndex >= 0) {
    userData.categories[existingIndex] = category;
  } else {
    userData.categories.push(category);
  }
  
  saveUserData(userData);
};

export const deleteCategory = (categoryId: string): void => {
  const userData = loadUserData();
  userData.categories = userData.categories.filter(c => c.id !== categoryId);
  // Also delete tasks in this category
  userData.tasks = userData.tasks.filter(t => t.categoryId !== categoryId);
  saveUserData(userData);
};

export const saveTask = (task: Task): void => {
  const userData = loadUserData();
  const existingIndex = userData.tasks.findIndex(t => t.id === task.id);
  
  if (existingIndex >= 0) {
    userData.tasks[existingIndex] = { ...task, updated: new Date() };
  } else {
    userData.tasks.push(task);
  }
  
  saveUserData(userData);
};

export const deleteTask = (taskId: string): void => {
  const userData = loadUserData();
  userData.tasks = userData.tasks.filter(t => t.id !== taskId);
  userData.pomodoroSessions = userData.pomodoroSessions.filter(p => p.taskId !== taskId);
  saveUserData(userData);
};

export const savePomodoroSession = (session: PomodoroSession): void => {
  const userData = loadUserData();
  const existingIndex = userData.pomodoroSessions.findIndex(p => p.id === session.id);
  
  if (existingIndex >= 0) {
    userData.pomodoroSessions[existingIndex] = session;
  } else {
    userData.pomodoroSessions.push(session);
  }
  
  saveUserData(userData);
};

export const updateSettings = (settings: Partial<UserData['settings']>): void => {
  const userData = loadUserData();
  userData.settings = { ...userData.settings, ...settings };
  saveUserData(userData);
};

export const saveCompletedTask = (completedTask: CompletedTask): void => {
  const userData = loadUserData();
  const existingIndex = userData.completedTasks.findIndex(t => t.id === completedTask.id);
  
  if (existingIndex >= 0) {
    userData.completedTasks[existingIndex] = completedTask;
  } else {
    userData.completedTasks.push(completedTask);
  }
  
  saveUserData(userData);
};

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}; 