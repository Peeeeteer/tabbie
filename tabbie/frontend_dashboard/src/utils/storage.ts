import type { UserData, Category, Task, PomodoroSession } from '@/types/todo';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '@/types/todo';

const STORAGE_KEY = 'tabbie_user_data';

// Helper function to revive Date objects from JSON
const reviveDate = (_key: string, value: unknown) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
};

// Load user data from local storage
export const loadUserData = (): UserData => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData, reviveDate) as UserData;
      
      // Ensure all required fields exist with defaults
      return {
        categories: parsed.categories || DEFAULT_CATEGORIES,
        tasks: parsed.tasks || [],
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

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}; 