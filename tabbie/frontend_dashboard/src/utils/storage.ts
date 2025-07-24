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
  totalPausedTime: number; // total time paused in seconds
}

// Load pomodoro state from localStorage
export const loadPomodoroState = (): PomodoroState | null => {
  try {
    const storedState = localStorage.getItem(POMODORO_STATE_KEY);
    if (storedState) {
      const parsed = JSON.parse(storedState, reviveDate) as PomodoroState;
      
      // Ensure totalPausedTime is always a number
      const safeTotalPausedTime = typeof parsed.totalPausedTime === 'number' ? parsed.totalPausedTime : 0;
      
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
            totalPausedTime: safeTotalPausedTime,
          };
        }
        
        return {
          ...parsed,
          timeLeft: actualTimeLeft,
          totalPausedTime: safeTotalPausedTime,
        };
      }
      
      // If session was paused, restore the paused time
      if (!parsed.isRunning && parsed.pausedAt && parsed.currentSession) {
        return {
          ...parsed,
          totalPausedTime: safeTotalPausedTime,
        };
      }
      
      return {
        ...parsed,
        totalPausedTime: safeTotalPausedTime,
      };
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

      // Validate and migrate categories
      let categories = parsed.categories || DEFAULT_CATEGORIES;
      
      // Ensure categories have all required fields
      categories = categories.map(category => ({
        id: category.id || generateId(),
        name: category.name || 'Unnamed Category',
        color: category.color || '#6B7280',
        icon: category.icon || '📁',
        created: category.created || new Date(),
      }));

      // Remove duplicate categories by ID
      const uniqueCategories = categories.filter((category, index, self) => 
        index === self.findIndex(c => c.id === category.id)
      );

      // Ensure at least one category exists
      if (uniqueCategories.length === 0) {
        categories = DEFAULT_CATEGORIES;
      }

      // Migrate tasks with invalid category IDs to default category
      const validCategoryIds = new Set(uniqueCategories.map(c => c.id));
      const migratedTasks = tasks.map(task => {
        if (task.categoryId && !validCategoryIds.has(task.categoryId)) {
          console.warn(`Task "${task.title}" had invalid category ID "${task.categoryId}", migrating to default category`);
          return { ...task, categoryId: uniqueCategories[0].id };
        }
        return task;
      });

      // Validate and migrate XP data
      let totalXP = parsed.totalXP || 0;
      
      // Ensure XP is a valid number and not negative
      if (typeof totalXP !== 'number' || totalXP < 0 || !Number.isFinite(totalXP)) {
        console.warn('Invalid XP value found, resetting to 0');
        totalXP = 0;
      }
      
      // For new users or if XP seems too high, start fresh at 0
      if (totalXP > 100) {
        console.warn(`XP value ${totalXP} seems too high for a new user, resetting to 0`);
        totalXP = 0;
      }
      
      // Cap XP at a reasonable maximum to prevent abuse
      const MAX_XP = 1000000; // 1 million XP cap
      if (totalXP > MAX_XP) {
        console.warn(`XP value ${totalXP} exceeds maximum, capping at ${MAX_XP}`);
        totalXP = MAX_XP;
      }

      return {
        categories: uniqueCategories,
        tasks: migratedTasks,
        completedTasks: parsed.completedTasks || [],
        pomodoroSessions: parsed.pomodoroSessions || [],
        totalXP,
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
  
  // Ensure category has all required fields
  const validatedCategory: Category = {
    id: category.id || generateId(),
    name: category.name || 'Unnamed Category',
    color: category.color || '#6B7280',
    icon: category.icon || '📁',
    created: category.created || new Date(),
  };
  
  if (existingIndex >= 0) {
    userData.categories[existingIndex] = validatedCategory;
  } else {
    userData.categories.push(validatedCategory);
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

// Safely update XP with validation
export const updateXP = (xpToAdd: number): void => {
  try {
    const userData = loadUserData();
    const currentXP = userData.totalXP || 0;
    
    // Validate input
    if (typeof xpToAdd !== 'number' || !Number.isFinite(xpToAdd) || xpToAdd < 0) {
      console.warn('Invalid XP value to add:', xpToAdd);
      return;
    }
    
    // Calculate new XP
    const newXP = currentXP + xpToAdd;
    
    // Cap at maximum
    const MAX_XP = 1000000;
    const finalXP = Math.min(newXP, MAX_XP);
    
    // Update and save
    userData.totalXP = finalXP;
    saveUserData(userData);
    
    console.log(`XP updated: ${currentXP} + ${xpToAdd} = ${finalXP}`);
  } catch (error) {
    console.error('Error updating XP:', error);
  }
};

// Recalculate XP from all completed pomodoro sessions
export const recalculateXP = (): number => {
  try {
    const userData = loadUserData();
    let totalXP = 0;
    
    console.log(`Recalculating XP from ${userData.pomodoroSessions.length} total sessions`);
    
    // Calculate XP from all completed pomodoro sessions
    userData.pomodoroSessions.forEach((session, index) => {
      if (session.completed && session.ended) {
        const sessionDuration = Math.floor((session.ended.getTime() - session.started.getTime()) / 1000 / 60); // minutes
        
        if (session.type === 'work') {
          // Work sessions: 1 minute = 1 XP, capped at 30 minutes overtime
          const baseDuration = session.duration;
          const actualDuration = sessionDuration;
          const overtime = Math.max(0, actualDuration - baseDuration);
          const cappedOvertime = Math.min(overtime, 30); // Cap at 30 minutes overtime
          const xpEarned = Math.min(actualDuration, baseDuration + cappedOvertime);
          totalXP += xpEarned;
          
          console.log(`Session ${index + 1}: Work session - ${actualDuration}min (${baseDuration}min base + ${overtime}min overtime, capped at ${cappedOvertime}) = ${xpEarned} XP`);
        } else {
          // Break sessions: Inverse scaling - shorter breaks give more XP
          const breakDuration = session.duration;
          const actualDuration = sessionDuration;
          const efficiency = Math.min(1, actualDuration / breakDuration);
          const xpEarned = Math.floor((1 - efficiency) * 5); // Max 5 XP for perfect break efficiency
          totalXP += xpEarned;
          
          console.log(`Session ${index + 1}: Break session - ${actualDuration}min/${breakDuration}min = ${efficiency.toFixed(2)} efficiency = ${xpEarned} XP`);
        }
      } else {
        console.log(`Session ${index + 1}: Skipped (not completed or no end time)`);
      }
    });
    
    // Update and save
    userData.totalXP = totalXP;
    saveUserData(userData);
    
    console.log(`XP recalculated: ${totalXP} from ${userData.pomodoroSessions.length} sessions`);
    return totalXP;
  } catch (error) {
    console.error('Error recalculating XP:', error);
    return 0;
  }
};

// Reset XP to 0 and clear all pomodoro sessions
export const resetXP = (): void => {
  try {
    const userData = loadUserData();
    userData.totalXP = 0;
    userData.pomodoroSessions = [];
    saveUserData(userData);
    console.log('XP reset to 0 and pomodoro sessions cleared');
  } catch (error) {
    console.error('Error resetting XP:', error);
  }
};

// Start fresh with 0 XP (for new users or complete reset)
export const startFreshXP = (): void => {
  try {
    const userData = loadUserData();
    userData.totalXP = 0;
    userData.pomodoroSessions = [];
    // Also clear any tasks that might have pomodoro sessions
    userData.tasks = userData.tasks.map(task => ({
      ...task,
      pomodoroSessions: []
    }));
    userData.completedTasks = userData.completedTasks.map(task => ({
      ...task,
      pomodoroSessions: []
    }));
    saveUserData(userData);
    console.log('Started fresh with 0 XP - all pomodoro data cleared');
  } catch (error) {
    console.error('Error starting fresh XP:', error);
  }
}; 