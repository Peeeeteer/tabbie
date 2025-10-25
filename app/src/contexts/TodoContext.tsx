import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserData, Category, Task, PomodoroSession, CompletedTask } from '@/types/todo';
import { DEFAULT_CATEGORIES } from '@/types/todo';
import { loadUserData, saveUserData, generateId, loadPomodoroState, savePomodoroState, clearPomodoroState, type PomodoroState } from '@/utils/storage';
import { computeTimeLeftSeconds, sanitizePausedSeconds } from '@/utils/pomodoroTime';

type OvertimeAutoPausedState = {
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  triggeredAt: Date;
  overtimeSeconds: number;
};

interface TodoContextType {
  userData: UserData;
  selectedCategoryId: string | null;
  currentTaskId: string | null;
  currentTask: Task | null;
  pomodoroTimer: {
    isRunning: boolean;
    timeLeft: number; // in seconds
    currentSession: PomodoroSession | null;
    sessionType: 'work' | 'shortBreak' | 'longBreak';
    justCompleted: boolean; // New field to show completion state
    pausedAt: Date | null; // Track when paused
    totalPausedTime: number; // Total time paused in seconds
    overtimeAutoPaused: OvertimeAutoPausedState | null;
  };
  
  // Category methods
  addCategory: (name: string, color: string, icon: string) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (categoryId: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  resetCategoriesToDefault: () => void;
  
  // Task methods
  addTask: (title: string, categoryId?: string, description?: string, dueDate?: Date, estimatedPomodoros?: number, workspaceUrls?: string[]) => string;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  
  // Pomodoro methods
  startPomodoro: (task: Task) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  stopPomodoro: () => void;
  completePomodoro: () => void;
  completeWorkSession: () => Promise<void>; // New method to manually complete work sessions
  startNextSession: () => Promise<void>; // New method for manual next session start
  skipBreak: () => void; // New method to skip break and start next work session
  debugSetTimerTo10Seconds: () => void; // Debug function to set timer to 10 seconds
  debugSetTimerTo14m45Overtime: () => void; // Debug function to jump to 14:45 overtime
  
  // Notes methods
  updateUserNotes: (type: 'global' | 'category', content: string, categoryId?: string) => void;
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
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  // Initialize pomodoro timer with persisted state
  const [pomodoroTimer, setPomodoroTimer] = useState(() => {
    const savedState = loadPomodoroState();
    if (savedState) {
      const safeTotalPausedTime = sanitizePausedSeconds(savedState.totalPausedTime);
      const restoredTimeLeft = savedState.isRunning && savedState.currentSession && savedState.startedAt
        ? computeTimeLeftSeconds({
            startedAt: savedState.startedAt,
            durationMinutes: savedState.currentSession.duration,
            totalPausedSeconds: safeTotalPausedTime,
            isRunning: savedState.isRunning,
            pausedAt: savedState.pausedAt ?? null,
          })
        : savedState.timeLeft;

      return {
        isRunning: savedState.isRunning,
        timeLeft: restoredTimeLeft,
        currentSession: savedState.currentSession,
        sessionType: savedState.sessionType,
        justCompleted: savedState.justCompleted,
        pausedAt: savedState.pausedAt ? new Date(savedState.pausedAt) : null,
        totalPausedTime: safeTotalPausedTime,
        overtimeAutoPaused: savedState.overtimeAutoPaused
          ? {
              sessionType: savedState.overtimeAutoPaused.sessionType,
              triggeredAt: new Date(savedState.overtimeAutoPaused.triggeredAt),
              overtimeSeconds: savedState.overtimeAutoPaused.overtimeSeconds,
            }
          : null,
      };
    }
    return {
      isRunning: false,
      timeLeft: 0,
      currentSession: null as PomodoroSession | null,
      sessionType: 'work' as 'work' | 'shortBreak' | 'longBreak',
      justCompleted: false,
      pausedAt: null as Date | null,
      totalPausedTime: 0,
      overtimeAutoPaused: null,
    };
  });

  // Helper function to get current task from userData
  const getCurrentTask = (): Task | null => {
    return currentTaskId ? userData.tasks.find(t => t.id === currentTaskId) || null : null;
  };

  // Restore current task ID from saved pomodoro state after userData is loaded
  useEffect(() => {
    const savedState = loadPomodoroState();
    if (savedState?.currentTaskId && !currentTaskId) {
      const task = userData.tasks.find(t => t.id === savedState.currentTaskId);
      if (task) {
        setCurrentTaskId(savedState.currentTaskId);
      }
    }
  }, [userData, currentTaskId]);

  // Debounced save to localStorage to prevent race conditions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveUserData(userData);
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [userData]);

  // Save pomodoro state whenever it changes
  useEffect(() => {
    const pomodoroState: PomodoroState = {
      isRunning: pomodoroTimer.isRunning,
      timeLeft: pomodoroTimer.timeLeft,
      currentSession: pomodoroTimer.currentSession,
      sessionType: pomodoroTimer.sessionType,
      justCompleted: pomodoroTimer.justCompleted,
      currentTaskId: currentTaskId,
      startedAt: pomodoroTimer.currentSession 
        ? pomodoroTimer.currentSession.started.getTime() 
        : null,
      pausedAt: pomodoroTimer.pausedAt ? pomodoroTimer.pausedAt.getTime() : null,
      totalPausedTime: sanitizePausedSeconds(pomodoroTimer.totalPausedTime),
      overtimeAutoPaused: pomodoroTimer.overtimeAutoPaused,
    };
    
    // Only save if there's an active session or if we're clearing the state
    if (pomodoroTimer.currentSession || pomodoroTimer.justCompleted) {
      savePomodoroState(pomodoroState);
    } else {
      clearPomodoroState();
    }
  }, [pomodoroTimer, currentTaskId]);

  // Update browser tab title during pomodoro sessions
  useEffect(() => {
    const currentTask = getCurrentTask();
    if (pomodoroTimer.currentSession && currentTask) {
      // Use the same time formatting logic as PomodoroPage for consistency
      const absSeconds = Math.abs(pomodoroTimer.timeLeft);
      const minutes = Math.floor(absSeconds / 60);
      const seconds = absSeconds % 60;
      const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      const formattedTime = pomodoroTimer.timeLeft < 0 ? `+${timeStr}` : timeStr;
      
      const emoji = pomodoroTimer.sessionType === 'work' ? '🍅' : '☕';
      const sessionName = pomodoroTimer.sessionType === 'work' ? 'Focus' : 'Break';
      
      document.title = `${emoji} ${formattedTime} - ${sessionName} | ${currentTask.title} | Tabbie`;
    } else {
      document.title = 'Tabbie Dashboard';
    }

    // Cleanup on unmount
    return () => {
      document.title = 'Tabbie Dashboard';
    };
  }, [pomodoroTimer.timeLeft, pomodoroTimer.sessionType, currentTaskId, pomodoroTimer.currentSession]);

  // Play notification sound - generic function for specific sound files
  const playNotificationSound = (soundFile: string = '/sound.mp3') => {
    // Check if sounds are enabled in settings
    if (userData.settings.pomodoroSound === false) {
      console.log('🔇 Sounds are disabled in settings');
      return;
    }

    try {
      console.log(`🔊 Attempting to play notification sound: ${soundFile}`);
      
      // Create audio context to ensure sound plays even when tab is not focused
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load and decode the audio file
      fetch(soundFile)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const source = audioContext.createBufferSource();
          const gainNode = audioContext.createGain();
          
          source.buffer = audioBuffer;
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
          
          source.start(audioContext.currentTime);
          console.log(`🔊 Sound played successfully: ${soundFile}`);
        })
        .catch(error => {
          console.log(`🔊 Could not load audio file ${soundFile}:`, error);
          // Fallback: try to play a simple beep
          console.log('🔊 Trying fallback beep sound...');
          try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            console.log('🔊 Fallback beep played');
          } catch (fallbackError) {
            console.log('🔊 Fallback beep also failed:', fallbackError);
          }
        });
    } catch (error) {
      console.log('🔊 Could not play notification sound:', error);
    }
  };

  // Specific sound functions for different events
  const playPomodoroCompleteSound = () => playNotificationSound('/pomodoro_complete.mp3');
  const playBreakCompleteSound = () => playNotificationSound('/break_complete.mp3');
  const playTaskCompleteSound = () => playNotificationSound('/task_complete.wa.mp3');
  const playOvertimeReminderSound = () => playNotificationSound('/overtime_reminder.mp3');
  const playBreakOvertimeReminderSound = () => playNotificationSound('/break_complete_reminder.mp3');

  // Show browser notification
  const showNotification = (title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'pomodoro-notification'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: icon || '/favicon.ico',
            tag: 'pomodoro-notification'
          });
        }
      });
    }
  };

  // Pomodoro timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let lastOvertimeNotification = 0; // Track last overtime notification time
    
    if (pomodoroTimer.isRunning && pomodoroTimer.currentSession) {
      interval = setInterval(() => {
        const now = Date.now();
        const safeTotalPausedTime = sanitizePausedSeconds(pomodoroTimer.totalPausedTime);
        const actualTimeLeft = computeTimeLeftSeconds({
          startedAt: pomodoroTimer.currentSession!.started,
          durationMinutes: pomodoroTimer.currentSession!.duration,
          totalPausedSeconds: safeTotalPausedTime,
          isRunning: true,
          now,
        });
        const safeActualTimeLeft = Number.isFinite(actualTimeLeft) ? actualTimeLeft : pomodoroTimer.timeLeft;
        
        setPomodoroTimer(prev => {
          const currentTask = getCurrentTask();
          
          if (safeActualTimeLeft <= 0 && prev.timeLeft > 0) {
            if (prev.sessionType === 'shortBreak') {
              playBreakCompleteSound();
              showNotification(
                '☕ Break Complete!', 
                'Break time is over. Ready to get back to work?'
              );
            } else if (prev.sessionType === 'work') {
              playPomodoroCompleteSound();
              showNotification(
                '🍅 Pomodoro Complete!', 
                `Great job! You completed a focus session${currentTask ? ` on "${currentTask.title}"` : ''}. You can continue working or take a break!`
              );
            }
          }
          
          const overtimeSeconds = Math.abs(safeActualTimeLeft);
          const hasExceededOvertimeThreshold = safeActualTimeLeft <= -900; // 15 minutes in seconds
          const isAlreadyAutoPaused = prev.overtimeAutoPaused !== null;
          const shouldAutoPause = hasExceededOvertimeThreshold && !isAlreadyAutoPaused;
          const shouldNotifyOvertime = safeActualTimeLeft < 0;
          const overtimeMinutes = Math.floor(overtimeSeconds / 60);
          const timeSinceLastNotification = now - lastOvertimeNotification;
          const isNotificationIntervalReached = overtimeMinutes > 0 && overtimeMinutes % 5 === 0 && timeSinceLastNotification > 4 * 60 * 1000;
          const isWorkSession = prev.sessionType === 'work';
          const isBreakSession = prev.sessionType === 'shortBreak';

          if (shouldAutoPause) {
            if (isWorkSession) {
              playOvertimeReminderSound();
            } else if (isBreakSession) {
              playBreakOvertimeReminderSound();
            }
            showNotification(
              isWorkSession ? '⏰ Focus Session Paused' : '⏰ Break Paused',
              `You have been ${isWorkSession ? 'working' : 'on break'} ${overtimeMinutes} minutes overtime. Are you still there?`
            );

            return {
              ...prev,
              isRunning: false,
              pausedAt: new Date(now),
              timeLeft: safeActualTimeLeft,
              overtimeAutoPaused: {
                sessionType: prev.sessionType,
                triggeredAt: new Date(now),
                overtimeSeconds,
              },
            };
          }

          if (shouldNotifyOvertime && isNotificationIntervalReached && !shouldAutoPause) {
            if (isWorkSession) {
              playOvertimeReminderSound();
              showNotification(
                '⏰ Still Working!', 
                `You've been working for ${overtimeMinutes} minutes overtime. Consider taking a break!`
              );
            } else if (isBreakSession) {
              playBreakOvertimeReminderSound();
              showNotification(
                '⏰ Break Overdue!', 
                `You've been on break for ${overtimeMinutes} minutes longer than planned. Ready to get back to work?`
              );
            }
            lastOvertimeNotification = now;
          }
          
          return {
            ...prev,
            timeLeft: safeActualTimeLeft,
            totalPausedTime: safeTotalPausedTime,
            overtimeAutoPaused: shouldNotifyOvertime ? prev.overtimeAutoPaused : null,
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [pomodoroTimer.isRunning, pomodoroTimer.currentSession, pomodoroTimer.totalPausedTime, currentTaskId]);

  // Handle session recovery on page load
  useEffect(() => {
    const savedState = loadPomodoroState();
    if (savedState && savedState.currentSession) {
      // Check if the associated task is completed - if so, don't restore the session
      const associatedTask = userData.tasks.find(task => task.id === savedState.currentSession!.taskId);
      if (associatedTask && associatedTask.completed) {
        // Task is completed, don't restore the session
        console.log('Not restoring pomodoro session - associated task is completed:', associatedTask.title);
        clearPomodoroState();
        setPomodoroTimer(createSafePomodoroState());
        setCurrentTaskId(null);
        return;
      }
      
      // Recalculate time left based on actual elapsed time, accounting for paused time
      const safeTotalPausedTime = sanitizePausedSeconds(savedState.totalPausedTime);
      const actualTimeLeft = computeTimeLeftSeconds({
        startedAt: savedState.currentSession.started,
        durationMinutes: savedState.currentSession.duration,
        totalPausedSeconds: safeTotalPausedTime,
        isRunning: savedState.isRunning,
        pausedAt: savedState.pausedAt ?? null,
      });
      
      // Check if session is overdue
      if (actualTimeLeft < 0) {
        if (savedState.sessionType === 'work') {
          showNotification(
            '⏰ Session Overdue!', 
            `Your pomodoro session has been running longer than planned. Consider taking a break!`
          );
        }
      }
      
      // Check if session has been running for too long (more than 2x the intended duration)
      const maxAllowedTime = savedState.currentSession.duration * 120; // twice duration in seconds
      if (actualTimeLeft < -maxAllowedTime) {
        // Session has been running for too long, auto-stop it
        showNotification(
          '⏰ Session Auto-Stopped', 
          'Your pomodoro session was running for too long and has been automatically stopped.'
        );
        clearPomodoroState();
        setPomodoroTimer(createSafePomodoroState());
        setCurrentTaskId(null);
      } else {
        // Restore session with correct time and safe pause tracking
        setPomodoroTimer(createSafePomodoroState({
          isRunning: savedState.isRunning,
          timeLeft: savedState.isRunning ? actualTimeLeft : savedState.timeLeft,
          currentSession: savedState.currentSession,
          sessionType: savedState.sessionType,
          justCompleted: false,
          pausedAt: savedState.pausedAt ? new Date(savedState.pausedAt) : null,
          totalPausedTime: safeTotalPausedTime,
        }));
        
        // Also restore the current task ID
        if (savedState.currentTaskId) {
          setCurrentTaskId(savedState.currentTaskId);
        }
      }
    }
  }, [userData.tasks]);

  // Handle page visibility changes to pause/resume timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (pomodoroTimer.currentSession) {
        if (document.hidden) {
          // Page is hidden, but timer should continue running
          // Don't pause the timer, just let it continue
        } else {
          // Page is visible again, recalculate time for accuracy
          const safeTotalPausedTime = sanitizePausedSeconds(pomodoroTimer.totalPausedTime);
          const actualTimeLeft = computeTimeLeftSeconds({
            startedAt: pomodoroTimer.currentSession.started,
            durationMinutes: pomodoroTimer.currentSession.duration,
            totalPausedSeconds: safeTotalPausedTime,
            isRunning: pomodoroTimer.isRunning,
            pausedAt: pomodoroTimer.pausedAt,
          });
          
          // Only update if there's a significant difference to prevent unnecessary re-renders
          if (Math.abs(actualTimeLeft - pomodoroTimer.timeLeft) > 1) {
            setPomodoroTimer(prev => ({
              ...prev,
              timeLeft: actualTimeLeft,
            }));
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pomodoroTimer.isRunning, pomodoroTimer.currentSession, pomodoroTimer.timeLeft]);

  // Handle window focus to sync timer state
  useEffect(() => {
    const handleFocus = () => {
      if (pomodoroTimer.currentSession) {
        const safeTotalPausedTime = sanitizePausedSeconds(pomodoroTimer.totalPausedTime);
        const actualTimeLeft = computeTimeLeftSeconds({
          startedAt: pomodoroTimer.currentSession.started,
          durationMinutes: pomodoroTimer.currentSession.duration,
          totalPausedSeconds: safeTotalPausedTime,
          isRunning: pomodoroTimer.isRunning,
          pausedAt: pomodoroTimer.pausedAt,
        });
        
        // Only update if there's a significant difference to prevent unnecessary re-renders
        if (Math.abs(actualTimeLeft - pomodoroTimer.timeLeft) > 1) {
          setPomodoroTimer(prev => ({
            ...prev,
            timeLeft: actualTimeLeft,
          }));
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pomodoroTimer.currentSession, pomodoroTimer.isRunning, pomodoroTimer.timeLeft]);

  // Handle page unload to save state
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pomodoroTimer.currentSession) {
        // Force save the current state
        const safeTotalPausedTime = sanitizePausedSeconds(pomodoroTimer.totalPausedTime);
          
        const pomodoroState: PomodoroState = {
          isRunning: pomodoroTimer.isRunning,
          timeLeft: pomodoroTimer.timeLeft,
          currentSession: pomodoroTimer.currentSession,
          sessionType: pomodoroTimer.sessionType,
          justCompleted: pomodoroTimer.justCompleted,
          currentTaskId: currentTaskId,
          startedAt: pomodoroTimer.currentSession.started.getTime(),
          // Preserve original pausedAt if already paused; don't overwrite with now,
          // so we capture the full paused duration across tab closes
          pausedAt: !pomodoroTimer.isRunning
            ? (pomodoroTimer.pausedAt ? pomodoroTimer.pausedAt.getTime() : Date.now())
            : null,
          totalPausedTime: safeTotalPausedTime,
        };
        savePomodoroState(pomodoroState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pomodoroTimer, currentTaskId]);

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
  const addTask = (title: string, categoryId?: string, description?: string, dueDate?: Date, estimatedPomodoros?: number, workspaceUrls?: string[]): string => {
    const taskId = generateId();
    const nextOrder = Math.max(...userData.tasks.map(t => t.order), 0) + 1;
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
      estimatedPomodoros: estimatedPomodoros || 3,
      order: nextOrder,
      workspaceUrls: workspaceUrls || [],
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
    if (currentTaskId === taskId) {
      setCurrentTaskId(null);
      stopPomodoro();
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    const task = userData.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      // Task is being completed - move to completedTasks
      const completedPomodoros = task.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
      
      const completedTask: CompletedTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        categoryId: task.categoryId,
        priority: task.priority,
        dueDate: task.dueDate,
        created: task.created,
        completed: new Date(),
        pomodoroSessions: task.pomodoroSessions || [],
        estimatedPomodoros: task.estimatedPomodoros,
        totalPomodoros: completedPomodoros,
      };

      setUserData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId),
        completedTasks: [...prev.completedTasks, completedTask],
      }));
    } else {
      // Task is being uncompleted - move back to tasks
      const completedTask = userData.completedTasks.find(t => t.id === taskId);
      if (completedTask) {
        const restoredTask: Task = {
          id: completedTask.id,
          title: completedTask.title,
          description: completedTask.description,
          categoryId: completedTask.categoryId,
          completed: false,
          priority: completedTask.priority,
          dueDate: completedTask.dueDate,
          created: completedTask.created,
          updated: new Date(),
          pomodoroSessions: completedTask.pomodoroSessions || [],
          estimatedPomodoros: completedTask.estimatedPomodoros,
          order: Math.max(...userData.tasks.map(t => t.order), 0) + 1,
        };

        setUserData(prev => ({
          ...prev,
          tasks: [...prev.tasks, restoredTask],
          completedTasks: prev.completedTasks.filter(t => t.id !== taskId),
        }));
      }
    }
  };

  const reorderTasks = (taskIds: string[]) => {
    setUserData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => {
        const newOrder = taskIds.indexOf(task.id);
        return newOrder >= 0 ? { ...task, order: newOrder, updated: new Date() } : task;
      }),
    }));
  };

  // Helper function to open workspace URLs
  const openWorkspaceUrls = (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    
    console.log(`🔗 Opening ${urls.length} workspace URLs for focused work session...`);
    
    urls.forEach((url, index) => {
      try {
        // Add protocol if missing
        const formattedUrl = url.startsWith('http://') || url.startsWith('https://') 
          ? url 
          : `https://${url}`;
        
        // Small delay between opening tabs to avoid being blocked by popup blockers
        setTimeout(() => {
          const newTab = window.open(formattedUrl, '_blank');
          if (!newTab) {
            console.warn(`⚠️ Failed to open URL (popup blocked?): ${formattedUrl}`);
          } else {
            console.log(`✅ Opened workspace tab: ${formattedUrl}`);
          }
        }, index * 100); // 100ms delay between each tab
      } catch (error) {
        console.error(`❌ Error opening URL: ${url}`, error);
      }
    });
  };

  // Pomodoro methods
  const startPomodoro = async (task: Task) => {
    const session: PomodoroSession = {
      id: generateId(),
      taskId: task.id,
      started: new Date(),
      duration: userData.settings.workDuration,
      completed: false,
      type: 'work',
    };

    setCurrentTaskId(task.id);
    setPomodoroTimer({
      isRunning: true,
      timeLeft: userData.settings.workDuration * 60, // convert to seconds
      currentSession: session,
      sessionType: 'work',
      justCompleted: false,
      pausedAt: null, // Reset pausedAt when starting a new session
      totalPausedTime: 0,
      overtimeAutoPaused: null,
    });

    // Open workspace URLs if they exist
    if (task.workspaceUrls && task.workspaceUrls.length > 0) {
      openWorkspaceUrls(task.workspaceUrls);
    }

  };

  const pausePomodoro = () => {
    setPomodoroTimer(prev => ({ 
      ...prev, 
      isRunning: false,
      pausedAt: new Date(), // Record when we paused
      timeLeft: computeTimeLeftSeconds({
        startedAt: prev.currentSession?.started ?? new Date(),
        durationMinutes: prev.currentSession?.duration ?? 0,
        totalPausedSeconds: sanitizePausedSeconds(prev.totalPausedTime),
        isRunning: false,
        pausedAt: new Date(),
      }),
    }));
  };

  // Helper function to safely reset pomodoro timer state
  const createSafePomodoroState = (overrides: any = {}) => {
    return {
      isRunning: false,
      timeLeft: 0,
      currentSession: null,
      sessionType: 'work' as 'work' | 'shortBreak' | 'longBreak',
      justCompleted: false,
      pausedAt: null,
      totalPausedTime: 0,
      ...overrides,
    };
  };

  const resumePomodoro = () => {
    setPomodoroTimer(prev => {
      if (prev.pausedAt && prev.currentSession) {
        // Calculate how long we were paused
        // Use precise seconds and ceil to avoid losing up to ~1s during resume
        const pauseDuration = Math.ceil((Date.now() - prev.pausedAt.getTime()) / 1000);
        
        // Ensure totalPausedTime is valid before adding to it
        const currentTotalPausedTime = sanitizePausedSeconds(prev.totalPausedTime);
        
        const newTotalPausedTime = currentTotalPausedTime + pauseDuration;
        
        // Only update totalPausedTime; do not shift the session start time
        // The ticking logic already subtracts totalPausedTime when computing elapsed time
        return {
          ...prev,
          isRunning: true,
          pausedAt: null,
          totalPausedTime: newTotalPausedTime,
          overtimeAutoPaused: null,
        };
      }
      return { 
        ...prev, 
        isRunning: true,
        totalPausedTime: sanitizePausedSeconds(prev.totalPausedTime),
        overtimeAutoPaused: null,
      };
    });
  };

  const stopPomodoro = async () => {
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

    setPomodoroTimer(createSafePomodoroState());
    setCurrentTaskId(null);
    // Clear persisted state
    clearPomodoroState();

  };

  const startNextSession = async () => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;

    const completedWorkSessions = currentTask.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
    const estimatedSessions = currentTask.estimatedPomodoros || 3;
    
    // Check if we should continue with more pomodoros (allow exceeding estimated count)
    const shouldContinue = completedWorkSessions < estimatedSessions || 
                          (pomodoroTimer.sessionType === 'work' && completedWorkSessions === estimatedSessions);
    
    if (pomodoroTimer.sessionType === 'work' && shouldContinue) {
      // Start break after work session
      const breakSession: PomodoroSession = {
        id: generateId(),
        taskId: currentTask.id,
        started: new Date(),
        duration: userData.settings.shortBreakDuration,
        completed: false,
        type: 'shortBreak',
      };

      setPomodoroTimer(createSafePomodoroState({
        isRunning: true,
        timeLeft: userData.settings.shortBreakDuration * 60,
        currentSession: breakSession,
        sessionType: 'shortBreak',
        justCompleted: false,
        overtimeAutoPaused: null,
      }));
      
      // Save state immediately for better recovery
      savePomodoroState({
        isRunning: true,
        timeLeft: userData.settings.shortBreakDuration * 60,
        currentSession: breakSession,
        sessionType: 'shortBreak',
        justCompleted: false,
        currentTaskId: currentTask.id,
        startedAt: Date.now(),
        pausedAt: null,
        totalPausedTime: 0,
      });

    } else if (pomodoroTimer.sessionType === 'shortBreak') {
      // Start next work session after break
      const workSession: PomodoroSession = {
        id: generateId(),
        taskId: currentTask.id,
        started: new Date(),
        duration: userData.settings.workDuration,
        completed: false,
        type: 'work',
      };

      setPomodoroTimer(createSafePomodoroState({
        isRunning: true,
        timeLeft: userData.settings.workDuration * 60,
        currentSession: workSession,
        sessionType: 'work',
        justCompleted: false,
        overtimeAutoPaused: null,
      }));
      
      // Save state immediately for better recovery
      savePomodoroState({
        isRunning: true,
        timeLeft: userData.settings.workDuration * 60,
        currentSession: workSession,
        sessionType: 'work',
        justCompleted: false,
        currentTaskId: currentTask.id,
        startedAt: Date.now(),
        pausedAt: null,
        totalPausedTime: 0,
      });

    } else {
      // Task is completed or user chose to stop
      setPomodoroTimer({
        isRunning: false,
        timeLeft: 0,
        currentSession: null,
        sessionType: 'work',
        justCompleted: false,
        pausedAt: null,
        totalPausedTime: 0,
        overtimeAutoPaused: null,
      });
      setCurrentTaskId(null);
      clearPomodoroState();
    }
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
      const currentTask = getCurrentTask();
      if (currentTask) {
        updateTask(currentTask.id, {
          pomodoroSessions: [...currentTask.pomodoroSessions, completedSession],
        });
      }
      

      // Check if this was the last session
      const completedWorkSessions = (currentTask?.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0) + 
                                   (pomodoroTimer.sessionType === 'work' ? 1 : 0);
      const isLastSession = completedWorkSessions >= (currentTask?.estimatedPomodoros || 3);
      
      if (isLastSession) {
        // Task completed!
        playTaskCompleteSound();
        showNotification(
          '🎉 Task Complete!', 
          `Congratulations! You completed all pomodoros for "${currentTask?.title}"`
        );
        
        setPomodoroTimer({
          isRunning: false,
          timeLeft: 0,
          currentSession: null,
          sessionType: 'work',
          justCompleted: true,
          pausedAt: null,
          totalPausedTime: 0,
        });
        // Don't clear currentTask yet, keep it for display
        // Clear persisted state after a delay to allow completion screen to show
        setTimeout(() => {
          clearPomodoroState();
        }, 5000);
      } else {
        // Set to completed state - NO AUTO-START, user must manually continue
        // Keep the sessionType as the completed session type for proper UI display
        setPomodoroTimer(prev => ({
          ...prev,
          isRunning: false,
          timeLeft: 0,
          justCompleted: true,
          pausedAt: null,
          totalPausedTime: 0,
        }));
      }
    }
  };

  const completeWorkSession = async () => {
    const currentTask = getCurrentTask();
    if (pomodoroTimer.sessionType === 'work' && pomodoroTimer.currentSession && currentTask) {
      // Complete the current work session
      completePomodoro();
      
      // Start the break session immediately
      const breakSession: PomodoroSession = {
        id: generateId(),
        taskId: currentTask.id,
        started: new Date(),
        duration: userData.settings.shortBreakDuration,
        completed: false,
        type: 'shortBreak',
      };

      setPomodoroTimer({
        isRunning: true,
        timeLeft: userData.settings.shortBreakDuration * 60,
        currentSession: breakSession,
        sessionType: 'shortBreak',
        justCompleted: false,
        pausedAt: null,
        totalPausedTime: 0,
        overtimeAutoPaused: null,
      });

    }
  };

  const skipBreak = () => {
    const currentTask = getCurrentTask();
    if (pomodoroTimer.sessionType === 'shortBreak' && currentTask) {
      // Mark current break session as completed
      if (pomodoroTimer.currentSession) {
        const completedSession = {
          ...pomodoroTimer.currentSession,
          ended: new Date(),
          completed: true,
        };
        
        setUserData(prev => ({
          ...prev,
          pomodoroSessions: [...prev.pomodoroSessions, completedSession],
        }));

        updateTask(currentTask.id, {
          pomodoroSessions: [...currentTask.pomodoroSessions, completedSession],
        });
      }

      // Start next work session immediately
      const completedWorkSessions = currentTask.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
      const isLastSession = completedWorkSessions >= (currentTask.estimatedPomodoros || 3);
      
      if (isLastSession) {
        // Task completed!
        playTaskCompleteSound();
        showNotification(
          '🎉 Task Complete!', 
          `Congratulations! You completed all pomodoros for "${currentTask.title}"`
        );
        
        setPomodoroTimer({
          isRunning: false,
          timeLeft: 0,
          currentSession: null,
          sessionType: 'work',
          justCompleted: true,
          pausedAt: null,
          totalPausedTime: 0,
        });
        setTimeout(() => {
          clearPomodoroState();
        }, 5000);
      } else {
        // Start next work session
        const workSession: PomodoroSession = {
          id: generateId(),
          taskId: currentTask.id,
          started: new Date(),
          duration: userData.settings.workDuration,
          completed: false,
          type: 'work',
        };

        setPomodoroTimer({
          isRunning: true,
          timeLeft: userData.settings.workDuration * 60,
          currentSession: workSession,
          sessionType: 'work',
          justCompleted: false,
          pausedAt: null,
          totalPausedTime: 0,
          overtimeAutoPaused: null,
        });
      }
    }
  };

  const debugSetTimerTo10Seconds = () => {
    if (pomodoroTimer.currentSession) {
      const now = new Date();
      const totalDurationSeconds = pomodoroTimer.currentSession.duration * 60;
      const newStartedAt = new Date(now.getTime() - (totalDurationSeconds - 10) * 1000);

      setPomodoroTimer(prev => ({
        ...prev,
        currentSession: {
          ...prev.currentSession!,
          started: newStartedAt,
        },
        timeLeft: 10,
        isRunning: true,
        pausedAt: null,
        overtimeAutoPaused: null,
      }));

      showNotification('🔧 Debug Mode', 'Timer set to 10 seconds for testing');
    }
  };

  const debugSetTimerTo14m45Overtime = () => {
    if (pomodoroTimer.currentSession) {
      const now = Date.now();
      const targetTimeLeft = -885; // -14 minutes 45 seconds
      const totalDurationSeconds = pomodoroTimer.currentSession.duration * 60;
      const elapsedSeconds = totalDurationSeconds - targetTimeLeft;
      const newStartedAt = new Date(now - elapsedSeconds * 1000);

      setPomodoroTimer(prev => ({
        ...prev,
        currentSession: prev.currentSession
          ? {
              ...prev.currentSession,
              started: newStartedAt,
            }
          : null,
        timeLeft: targetTimeLeft,
        isRunning: true,
        pausedAt: null,
        overtimeAutoPaused: null,
      }));

      showNotification('🔧 Debug Mode', 'Timer set to 14:45 overtime for testing');
    }
  };

  const updateUserNotes = (type: 'global' | 'category', content: string, categoryId?: string) => {
    setUserData(prev => {
      const currentNotes = prev.notes || { global: '', categories: {} };
      
      if (type === 'global') {
        return {
          ...prev,
          notes: {
            ...currentNotes,
            global: content
          }
        };
      } else if (type === 'category' && categoryId) {
        return {
          ...prev,
          notes: {
            ...currentNotes,
            categories: {
              ...currentNotes.categories,
              [categoryId]: content
            }
          }
        };
      }
      
      return prev;
    });
  };

  const value: TodoContextType = {
    userData,
    selectedCategoryId,
    currentTaskId,
    currentTask: getCurrentTask(),
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
    reorderTasks,
    
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    completePomodoro,
    completeWorkSession,
    startNextSession,
    skipBreak,
    debugSetTimerTo10Seconds,
  debugSetTimerTo14m45Overtime,
    
    updateUserNotes,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}; 