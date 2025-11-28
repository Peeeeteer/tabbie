import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTodo } from './TodoContext';

const TABBIE_HOSTNAME = "tabbie.local";
const RECONNECT_INTERVAL = 5000; // Try to reconnect every 5 seconds when disconnected
const STATUS_UPDATE_INTERVAL = 5000; // Update status every 5 seconds
const CONNECTION_TIMEOUT = 3000; // 3 second timeout for faster feedback

interface TabbieStatus {
  status: string;
  animation: string;
  task: string;
  uptime: number;
  connectedDevices: number;
  ip: string;
}

type TabbieActivityState = 'idle' | 'pomodoro' | 'break' | 'complete' | 'focus' | 'paused';

interface TabbieContextType {
  isConnected: boolean;
  isConnecting: boolean;
  tabbieStatus: TabbieStatus | null;
  connectionError: string;
  customIP: string;
  activityState: TabbieActivityState;

  // Methods
  checkConnection: () => Promise<void>;
  setCustomIP: (ip: string) => void;
  sendAnimation: (animation: string, task?: string) => Promise<boolean>;
  triggerTaskCompletion: (taskTitle: string) => void;
  triggerDebug: () => Promise<void>;
  disconnect: () => void;
}

const TabbieContext = createContext<TabbieContextType | undefined>(undefined);

export const useTabbieSync = () => {
  const context = useContext(TabbieContext);
  if (context === undefined) {
    throw new Error('useTabbieSync must be used within a TabbieProvider');
  }
  return context;
};

export const TabbieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, pomodoroTimer, currentTaskId } = useTodo();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tabbieStatus, setTabbieStatus] = useState<TabbieStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const [customIP, setCustomIP] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('tabbie_ip');
    return saved || TABBIE_HOSTNAME;
  });
  const [activityState, setActivityState] = useState<TabbieActivityState>('idle');
  const [isPlayingCompletionAnimation, setIsPlayingCompletionAnimation] = useState(false);
  const [lastSyncedAnimation, setLastSyncedAnimation] = useState<string | null>(null);

  // Save IP to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tabbie_ip', customIP);
  }, [customIP]);

  // Try to connect to a specific address
  const tryConnect = useCallback(async (address: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://${address}/api/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(CONNECTION_TIMEOUT),
      });

      if (response.ok) {
        const status = await response.json();
        setTabbieStatus(status);
        setIsConnected(true);
        setConnectionError('');
        
        // Save the working IP for next time (extract from status if available)
        if (status.ip && status.ip !== address) {
          localStorage.setItem('tabbie_last_working_ip', status.ip);
        } else if (address !== TABBIE_HOSTNAME) {
          localStorage.setItem('tabbie_last_working_ip', address);
        }
        
        console.log('✅ Connected to Tabbie at', address, ':', status);
        return true;
      }
    } catch (error) {
      console.log(`⏳ Could not reach ${address}`);
    }
    return false;
  }, []);

  const checkConnection = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError('');

    // Build list of addresses to try (smart fallback)
    const addressesToTry: string[] = [];
    
    // 1. First try the user-specified address (if not default)
    if (customIP && customIP !== TABBIE_HOSTNAME) {
      addressesToTry.push(customIP);
    }
    
    // 2. Try tabbie.local (mDNS)
    addressesToTry.push(TABBIE_HOSTNAME);
    
    // 3. Try last known working IP (if different from above)
    const lastWorkingIP = localStorage.getItem('tabbie_last_working_ip');
    if (lastWorkingIP && !addressesToTry.includes(lastWorkingIP)) {
      addressesToTry.push(lastWorkingIP);
    }

    console.log('🔍 Trying to connect to Tabbie at:', addressesToTry);

    // Try each address
    for (const address of addressesToTry) {
      if (await tryConnect(address)) {
        // Update customIP to the working address
        if (address !== customIP) {
          setCustomIP(address);
        }
        setIsConnecting(false);
        return;
      }
    }

    // All addresses failed
    setIsConnected(false);
    setTabbieStatus(null);
    setConnectionError('🔍 Cannot find Tabbie. Make sure it\'s powered on and connected to the same WiFi network. Press "Show Debug Info" on Tabbie to see its IP address.');
    setIsConnecting(false);
  }, [customIP, tryConnect, setCustomIP]);

  const updateStatus = useCallback(async () => {
    if (!isConnected) return;

    try {
      const response = await fetch(`http://${customIP}/api/status`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const status = await response.json();
        setTabbieStatus(status);
      }
    } catch (error) {
      // Connection lost - only log, don't update UI state here
      // The periodic check will handle reconnection
      console.log('⚠️ Status update failed:', error);
    }
  }, [isConnected, customIP]);

  const sendAnimation = useCallback(async (animation: string, task?: string): Promise<boolean> => {
    // Attempt to send even if we think we're disconnected - this acts as a connection check too

    try {
      console.log('🎨 Sending animation to Tabbie:', animation, task);
      const response = await fetch(`http://${customIP}/api/animation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animation: animation,
          task: task || ''
        }),
        signal: AbortSignal.timeout(CONNECTION_TIMEOUT),
      });

      if (response.ok) {
        console.log('✅ Animation sent successfully:', animation);
        setLastSyncedAnimation(animation);
        // If we succeeded, we are definitely connected
        if (!isConnected) {
          setIsConnected(true);
          setConnectionError('');
        }
        // Update status to reflect the change
        setTimeout(updateStatus, 500);
        return true;
      } else {
        console.log('❌ Failed to send animation:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to send animation:', error);
      // Only mark as disconnected if it was previously connected
      if (isConnected) {
        setIsConnected(false);
      }
      return false;
    }
  }, [isConnected, customIP, updateStatus]);

  const triggerDebug = useCallback(async () => {
    if (!isConnected) {
      console.log('⚠️ Not connected to Tabbie, cannot trigger debug mode');
      return;
    }

    try {
      console.log('🔧 Triggering debug mode on Tabbie...');
      const response = await fetch(`http://${customIP}/api/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(CONNECTION_TIMEOUT),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Debug mode activated:', data);
      } else {
        console.log('❌ Failed to trigger debug mode:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to trigger debug mode:', error);
    }
  }, [isConnected, customIP]);

  const triggerTaskCompletion = useCallback((taskTitle: string) => {
    if (!isConnected) {
      console.log('⚠️ Not connected to Tabbie, skipping task completion animation');
      return;
    }

    console.log('🎉 Task completed - triggering love animation:', taskTitle);
    setIsPlayingCompletionAnimation(true);
    setActivityState('complete');
    sendAnimation('love', taskTitle);

    // Return to idle after 9 seconds (LOVE animation is ~8 seconds at 8fps)
    setTimeout(() => {
      console.log('💤 Returning to idle state after task completion');
      setIsPlayingCompletionAnimation(false);
      setActivityState('idle');
      sendAnimation('idle');
    }, 9000);
  }, [isConnected, sendAnimation]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setTabbieStatus(null);
    setConnectionError('');
  }, []);

  // Auto-connect on component mount (with delay so user can enter IP first)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkConnection();
    }, 2000); // 2 second delay before first auto-connect attempt
    
    return () => clearTimeout(timer);
  }, [checkConnection]);

  // Periodic reconnection attempts when disconnected (every 5 seconds)
  useEffect(() => {
    if (isConnected) return; // Don't retry when already connected

    const interval = setInterval(() => {
      if (!isConnecting) {
        console.log('🔄 Auto-retrying connection to Tabbie...');
        checkConnection();
      }
    }, RECONNECT_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected, isConnecting, checkConnection]);

  // Periodic status updates when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      updateStatus();
    }, STATUS_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected, updateStatus]);

  // Reset sync state when connection is lost so animations get resent on reconnect
  useEffect(() => {
    if (!isConnected) {
      setLastSyncedAnimation(null);
    }
  }, [isConnected]);

  // Main synchronization logic - monitor pomodoro state and sync with Tabbie
  useEffect(() => {
    // We removed the isConnected check here to allow optimistic updates
    // sendAnimation will handle the connection logic internally

    // Don't override the animation if we're playing the completion animation
    if (isPlayingCompletionAnimation) return;

    const currentTask = currentTaskId
      ? userData.tasks.find(t => t.id === currentTaskId)
      : null;

    // Helper to check if we need to resync (animation not yet sent or device state mismatch)
    // This now checks both local sync state and device state
    const needsSync = (targetAnim: string) => {
      // If we haven't successfully synced this animation yet, we need to sync
      if (lastSyncedAnimation !== targetAnim) return true;
      // If connected and device reports different animation, resync
      if (isConnected && tabbieStatus && tabbieStatus.animation !== targetAnim) return true;
      return false;
    };

    // Determine the current activity state and send appropriate animation
    if (pomodoroTimer.isRunning) {
      // Active session running
      if (pomodoroTimer.sessionType === 'work') {
        // Focus session active
        setActivityState('focus');
        if (needsSync('focus')) {
          sendAnimation('focus', currentTask?.title || 'Focus Session');
          console.log('🍅 Pomodoro running - sending focus animation');
        }
      } else if (pomodoroTimer.sessionType === 'shortBreak') {
        // Break session active
        setActivityState('break');
        if (needsSync('break')) {
          sendAnimation('break', 'Break Time');
          console.log('☕ Break running - sending break animation');
        }
      }
    } else if (pomodoroTimer.justCompleted) {
      // Session just completed
      setActivityState('complete');
      if (needsSync('complete')) {
        const completionMessage = pomodoroTimer.sessionType === 'work'
          ? currentTask?.title || 'Task Complete!'
          : 'Break Complete!';
        sendAnimation('complete', completionMessage);
        console.log('✅ Session completed - sending complete animation');
      }
    } else if (pomodoroTimer.currentSession && !pomodoroTimer.isRunning) {
      // Paused session
      setActivityState('paused');
      if (needsSync('paused')) {
        sendAnimation('paused', 'Paused');
        console.log('⏸️ Session paused - sending paused animation');
      }
    } else {
      // No active session - idle
      setActivityState('idle');
      if (needsSync('idle')) {
        sendAnimation('idle');
        console.log('💤 Idle state - sending idle animation');
      }
    }
  }, [
    isConnected,
    tabbieStatus, // Add tabbieStatus dependency to trigger resync checks
    isPlayingCompletionAnimation,
    pomodoroTimer.isRunning,
    pomodoroTimer.justCompleted,
    pomodoroTimer.sessionType,
    pomodoroTimer.currentSession,
    currentTaskId,
    userData.tasks,
    lastSyncedAnimation,
    sendAnimation
  ]);

  const value: TabbieContextType = {
    isConnected,
    isConnecting,
    tabbieStatus,
    connectionError,
    customIP,
    activityState,
    checkConnection,
    setCustomIP,
    sendAnimation,
    triggerTaskCompletion,
    triggerDebug,
    disconnect,
  };

  return <TabbieContext.Provider value={value}>{children}</TabbieContext.Provider>;
};

