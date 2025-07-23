import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserData, Category, Task, PomodoroSession, CompletedTask } from '@/types/todo';
import { DEFAULT_CATEGORIES } from '@/types/todo';
import { loadUserData, saveUserData, generateId, loadPomodoroState, savePomodoroState, clearPomodoroState, updateXP, type PomodoroState } from '@/utils/storage';

interface TodoContextType {
  userData: UserData;
  selectedCategoryId: string | null;
  currentTask: Task | null;
  pomodoroTimer: {
    isRunning: boolean;
    timeLeft: number; // in seconds
    currentSession: PomodoroSession | null;
    sessionType: 'work' | 'shortBreak' | 'longBreak';
    justCompleted: boolean; // New field to show completion state
  };
  
  // Category methods
  addCategory: (name: string, color: string, icon: string) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (categoryId: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  resetCategoriesToDefault: () => void;
  
  // Task methods
  addTask: (title: string, categoryId?: string, description?: string, dueDate?: Date, estimatedPomodoros?: number) => string;
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
  completeWorkSession: () => void; // New method to manually complete work sessions
  startNextSession: () => void; // New method for manual next session start
  skipBreak: () => void; // New method to skip break and start next work session
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
  
  // Initialize pomodoro timer with persisted state
  const [pomodoroTimer, setPomodoroTimer] = useState(() => {
    const savedState = loadPomodoroState();
    if (savedState) {
      return {
        isRunning: savedState.isRunning,
        timeLeft: savedState.timeLeft,
        currentSession: savedState.currentSession,
        sessionType: savedState.sessionType,
        justCompleted: savedState.justCompleted,
      };
    }
    return {
      isRunning: false,
      timeLeft: 0,
      currentSession: null as PomodoroSession | null,
      sessionType: 'work' as 'work' | 'shortBreak' | 'longBreak',
      justCompleted: false,
    };
  });

  // Restore current task from saved pomodoro state after userData is loaded
  useEffect(() => {
    const savedState = loadPomodoroState();
    if (savedState?.currentTaskId && !currentTask) {
      const task = userData.tasks.find(t => t.id === savedState.currentTaskId);
      if (task) {
        setCurrentTask(task);
      }
    }
  }, [userData, currentTask]);

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
      currentTaskId: currentTask?.id || null,
      startedAt: pomodoroTimer.isRunning && pomodoroTimer.currentSession 
        ? pomodoroTimer.currentSession.started.getTime() 
        : null,
      pausedAt: !pomodoroTimer.isRunning && pomodoroTimer.currentSession 
        ? Date.now() 
        : null,
    };
    
    // Only save if there's an active session or if we're clearing the state
    if (pomodoroTimer.currentSession || pomodoroTimer.justCompleted) {
      savePomodoroState(pomodoroState);
    } else {
      clearPomodoroState();
    }
  }, [pomodoroTimer, currentTask]);

  // Update browser tab title during pomodoro sessions
  useEffect(() => {
    if (pomodoroTimer.currentSession && currentTask) {
      const minutes = Math.floor(pomodoroTimer.timeLeft / 60);
      const seconds = pomodoroTimer.timeLeft % 60;
      const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      const emoji = pomodoroTimer.sessionType === 'work' ? '🍅' : '☕';
      const sessionName = pomodoroTimer.sessionType === 'work' ? 'Focus' : 'Break';
      
      document.title = `${emoji} ${timeStr} - ${sessionName} | ${currentTask.title} | Tabbie`;
    } else {
      document.title = 'Tabbie Dashboard';
    }

    // Cleanup on unmount
    return () => {
      document.title = 'Tabbie Dashboard';
    };
  }, [pomodoroTimer.timeLeft, pomodoroTimer.sessionType, currentTask, pomodoroTimer.currentSession]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      console.log('🔊 Attempting to play notification sound...');
      
      // Create audio context to ensure sound plays even when tab is not focused
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load and decode the audio file
      fetch('/sound.mp3')
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
          console.log('🔊 Sound played successfully!');
        })
        .catch(error => {
          console.log('🔊 Could not load audio file:', error);
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
    let lastUpdate = Date.now();
    
    if (pomodoroTimer.isRunning && pomodoroTimer.currentSession) {
      interval = setInterval(() => {
        const now = Date.now();
        
        // Calculate actual elapsed time based on session start for drift correction
        const sessionElapsed = Math.floor((now - pomodoroTimer.currentSession!.started.getTime()) / 1000);
        const totalDuration = pomodoroTimer.currentSession!.duration * 60;
        const actualTimeLeft = Math.max(0, totalDuration - sessionElapsed);
        
        setPomodoroTimer(prev => {
          // Check for overtime and play sound notification
          if (actualTimeLeft === 0 && prev.sessionType === 'work') {
            // Work session completed - play sound and show notification
            playNotificationSound();
            showNotification(
              '🍅 Pomodoro Complete!', 
              `Great job! You completed a focus session${currentTask ? ` on "${currentTask.title}"` : ''}. Time for a break!`
            );
          } else if (actualTimeLeft === 0 && prev.sessionType === 'shortBreak') {
            // Break completed - play sound and show notification
            playNotificationSound();
            showNotification(
              '☕ Break Complete!', 
              'Break time is over. Ready to get back to work?'
            );
          } else if (actualTimeLeft < 0 && prev.sessionType === 'work' && prev.timeLeft >= 0) {
            // Just went overtime - play sound notification
            playNotificationSound();
            showNotification(
              '⏰ Session Overdue!', 
              `Your pomodoro session has been running longer than planned. Consider taking a break!`
            );
          }
          
          return {
            ...prev,
            timeLeft: actualTimeLeft,
          };
        });
        
        lastUpdate = now;
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [pomodoroTimer.isRunning, pomodoroTimer.currentSession, currentTask]);

  // Handle session recovery on page load
  useEffect(() => {
    const savedState = loadPomodoroState();
    if (savedState && savedState.currentSession) {
      // Recalculate time left based on actual elapsed time
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - savedState.currentSession.started.getTime()) / 1000);
      const totalDuration = savedState.currentSession.duration * 60;
      const actualTimeLeft = totalDuration - elapsedSeconds;
      
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
      const maxAllowedTime = totalDuration * 2;
      if (actualTimeLeft < -maxAllowedTime) {
        // Session has been running for too long, auto-stop it
        showNotification(
          '⏰ Session Auto-Stopped', 
          'Your pomodoro session was running for too long and has been automatically stopped.'
        );
        clearPomodoroState();
        setPomodoroTimer({
          isRunning: false,
          timeLeft: 0,
          currentSession: null,
          sessionType: 'work',
          justCompleted: false,
        });
        setCurrentTask(null);
      } else {
        // Restore session with correct time
        setPomodoroTimer({
          isRunning: savedState.isRunning,
          timeLeft: actualTimeLeft,
          currentSession: savedState.currentSession,
          sessionType: savedState.sessionType,
          justCompleted: false,
        });
      }
    }
  }, []);

  // Handle page visibility changes to pause/resume timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (pomodoroTimer.isRunning && pomodoroTimer.currentSession) {
        if (document.hidden) {
          // Page is hidden, but timer should continue running
          // Don't pause the timer, just let it continue
        } else {
          // Page is visible again, recalculate time for accuracy
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - pomodoroTimer.currentSession.started.getTime()) / 1000);
          const totalDuration = pomodoroTimer.currentSession.duration * 60;
          const actualTimeLeft = Math.max(0, totalDuration - elapsedSeconds);
          
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
      if (pomodoroTimer.currentSession && pomodoroTimer.isRunning) {
        // Recalculate time left based on actual elapsed time
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - pomodoroTimer.currentSession.started.getTime()) / 1000);
        const totalDuration = pomodoroTimer.currentSession.duration * 60;
        const actualTimeLeft = Math.max(0, totalDuration - elapsedSeconds);
        
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
        const pomodoroState: PomodoroState = {
          isRunning: pomodoroTimer.isRunning,
          timeLeft: pomodoroTimer.timeLeft,
          currentSession: pomodoroTimer.currentSession,
          sessionType: pomodoroTimer.sessionType,
          justCompleted: pomodoroTimer.justCompleted,
          currentTaskId: currentTask?.id || null,
          startedAt: pomodoroTimer.currentSession.started.getTime(),
          pausedAt: !pomodoroTimer.isRunning ? Date.now() : null,
        };
        savePomodoroState(pomodoroState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pomodoroTimer, currentTask]);

  // Category methods
  const addCategory = (name: string, color: string, icon: string) => {
    const newCategory: Category = {
      id: generateId(),
      name,
      color,
      icon,
      created: new Date(),
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
  const addTask = (title: string, categoryId?: string, description?: string, dueDate?: Date, estimatedPomodoros?: number): string => {
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
      justCompleted: false,
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
      justCompleted: false,
    });
    setCurrentTask(null);
    // Clear persisted state
    clearPomodoroState();
  };

  const startNextSession = () => {
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

      setPomodoroTimer({
        isRunning: true,
        timeLeft: userData.settings.shortBreakDuration * 60,
        currentSession: breakSession,
        sessionType: 'shortBreak',
        justCompleted: false,
      });
      
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

      setPomodoroTimer({
        isRunning: true,
        timeLeft: userData.settings.workDuration * 60,
        currentSession: workSession,
        sessionType: 'work',
        justCompleted: false,
      });
      
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
      });
    } else {
      // Task is completed or user chose to stop
      setPomodoroTimer({
        isRunning: false,
        timeLeft: 0,
        currentSession: null,
        sessionType: 'work',
        justCompleted: false,
      });
      setCurrentTask(null);
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
      
      // Calculate XP based on session duration
      const sessionDuration = Math.floor((completedSession.ended.getTime() - completedSession.started.getTime()) / 1000 / 60); // minutes
      let xpEarned = 0;
      
      if (completedSession.type === 'work') {
        // Work sessions: 1 minute = 1 XP, capped at 30 minutes overtime
        const baseDuration = completedSession.duration;
        const actualDuration = sessionDuration;
        const overtime = Math.max(0, actualDuration - baseDuration);
        const cappedOvertime = Math.min(overtime, 30); // Cap at 30 minutes overtime
        xpEarned = Math.min(actualDuration, baseDuration + cappedOvertime);
      } else {
        // Break sessions: Inverse scaling - shorter breaks give more XP
        const breakDuration = completedSession.duration;
        const actualDuration = sessionDuration;
        const efficiency = Math.min(1, actualDuration / breakDuration);
        xpEarned = Math.floor((1 - efficiency) * 5); // Max 5 XP for perfect break efficiency
      }
      
      setUserData(prev => ({
        ...prev,
        pomodoroSessions: [...prev.pomodoroSessions, completedSession],
        totalXP: (prev.totalXP || 0) + xpEarned,
      }));
      
      // Also update XP using safe function for persistence
      if (xpEarned > 0) {
        updateXP(xpEarned);
      }

      // Update task with completed session
      if (currentTask) {
        updateTask(currentTask.id, {
          pomodoroSessions: [...currentTask.pomodoroSessions, completedSession],
        });
      }
      
      // Show XP notification with overtime info
      if (xpEarned > 0) {
        const overtime = Math.max(0, sessionDuration - completedSession.duration);
        const overtimeMessage = overtime > 0 ? ` (${overtime} min overtime)` : '';
        showNotification(
          '⭐ XP Earned!', 
          `You earned ${xpEarned} XP for your ${completedSession.type === 'work' ? 'focus session' : 'break'}${overtimeMessage}`
        );
      }

      // Check if this was the last session
      const completedWorkSessions = (currentTask?.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0) + 
                                   (pomodoroTimer.sessionType === 'work' ? 1 : 0);
      const isLastSession = completedWorkSessions >= (currentTask?.estimatedPomodoros || 3);
      
      if (isLastSession) {
        // Task completed!
        playNotificationSound();
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
        }));
      }
    }
  };

  const completeWorkSession = () => {
    if (pomodoroTimer.sessionType === 'work' && pomodoroTimer.currentSession) {
      completePomodoro();
    }
  };

  const skipBreak = () => {
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
        playNotificationSound();
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
        });
      }
    }
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
    reorderTasks,
    
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    completePomodoro,
    completeWorkSession,
    startNextSession,
    skipBreak,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}; 