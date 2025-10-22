import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTodo } from './TodoContext';

const TABBIE_HOSTNAME = "tabbie.local";
const CHECK_CONNECTION_INTERVAL = 30000; // Check connection every 30 seconds
const STATUS_UPDATE_INTERVAL = 5000; // Update status every 5 seconds

interface TabbieStatus {
  status: string;
  animation: string;
  task: string;
  uptime: number;
  connectedDevices: number;
  ip: string;
}

type TabbieActivityState = 'idle' | 'pomodoro' | 'break' | 'complete';

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
  sendAnimation: (animation: string, task?: string) => Promise<void>;
  triggerTaskCompletion: (taskTitle: string) => void;
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

  // Save IP to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tabbie_ip', customIP);
  }, [customIP]);

  const checkConnection = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      const response = await fetch(`http://${customIP}/api/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        const status = await response.json();
        setTabbieStatus(status);
        setIsConnected(true);
        setConnectionError('');
        console.log('✅ Connected to Tabbie:', status);
      } else {
        throw new Error('Failed to connect to Tabbie');
      }
    } catch (error) {
      setIsConnected(false);
      setTabbieStatus(null);
      
      // Provide more specific error messages
      if (customIP.includes('192.168.4.1') || customIP.includes('tabbie-setup')) {
        setConnectionError('🔧 Tabbie is in setup mode. Complete WiFi configuration first, then reconnect to your home network and try again.');
      } else if (customIP === 'tabbie.local' || customIP.includes('.local')) {
        setConnectionError('🔍 Cannot reach tabbie.local. Check that: 1) Tabbie is powered on, 2) Both devices are on the same WiFi network, 3) Tabbie\'s OLED shows a connected status.');
      } else {
        setConnectionError('❌ Connection failed. Verify Tabbie is powered on, connected to WiFi (check OLED display), and on the same network as this computer.');
      }
      console.log('❌ Failed to connect to Tabbie:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [customIP]);

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

  const sendAnimation = useCallback(async (animation: string, task?: string) => {
    if (!isConnected) {
      console.log('⚠️ Not connected to Tabbie, skipping animation:', animation);
      return;
    }
    
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
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        console.log('✅ Animation sent successfully:', animation);
        // Update status to reflect the change
        setTimeout(updateStatus, 500);
      } else {
        console.log('❌ Failed to send animation:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to send animation:', error);
    }
  }, [isConnected, customIP, updateStatus]);

  const triggerTaskCompletion = useCallback((taskTitle: string) => {
    if (!isConnected) {
      console.log('⚠️ Not connected to Tabbie, skipping task completion animation');
      return;
    }
    
    console.log('🎉 Task completed - triggering completion animation:', taskTitle);
    setIsPlayingCompletionAnimation(true);
    setActivityState('complete');
    sendAnimation('complete', taskTitle);
    
    // Return to idle after 5 seconds
    setTimeout(() => {
      console.log('💤 Returning to idle state after task completion');
      setIsPlayingCompletionAnimation(false);
      setActivityState('idle');
      sendAnimation('idle');
    }, 5000);
  }, [isConnected, sendAnimation]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setTabbieStatus(null);
    setConnectionError('');
  }, []);

  // Auto-connect on component mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Periodic connection check
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        // Try to reconnect if not connected
        checkConnection();
      }
    }, CHECK_CONNECTION_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isConnected, checkConnection]);

  // Periodic status updates when connected
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      updateStatus();
    }, STATUS_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isConnected, updateStatus]);

  // Main synchronization logic - monitor pomodoro state and sync with Tabbie
  useEffect(() => {
    if (!isConnected) return;
    
    // Don't override the animation if we're playing the completion animation
    if (isPlayingCompletionAnimation) return;

    const currentTask = currentTaskId 
      ? userData.tasks.find(t => t.id === currentTaskId) 
      : null;

    // Determine the current activity state and send appropriate animation
    if (pomodoroTimer.isRunning) {
      // Active session running
      if (pomodoroTimer.sessionType === 'work') {
        // Focus session active
        if (activityState !== 'pomodoro') {
          setActivityState('pomodoro');
          sendAnimation('pomodoro', currentTask?.title || 'Focus Session');
          console.log('🍅 Pomodoro started - sent focus animation');
        }
      } else if (pomodoroTimer.sessionType === 'shortBreak') {
        // Break session active
        if (activityState !== 'break') {
          setActivityState('break');
          sendAnimation('idle', 'Break Time');
          console.log('☕ Break started - sent idle animation');
        }
      }
    } else if (pomodoroTimer.justCompleted) {
      // Session just completed
      if (activityState !== 'complete') {
        setActivityState('complete');
        const completionMessage = pomodoroTimer.sessionType === 'work' 
          ? currentTask?.title || 'Task Complete!'
          : 'Break Complete!';
        sendAnimation('complete', completionMessage);
        console.log('✅ Session completed - sent complete animation');
      }
    } else if (pomodoroTimer.currentSession && !pomodoroTimer.isRunning) {
      // Paused session
      if (activityState !== 'idle') {
        setActivityState('idle');
        sendAnimation('idle', 'Paused');
        console.log('⏸️ Session paused - sent idle animation');
      }
    } else {
      // No active session - idle
      if (activityState !== 'idle') {
        setActivityState('idle');
        sendAnimation('idle');
        console.log('💤 Idle state - sent idle animation');
      }
    }
  }, [
    isConnected,
    isPlayingCompletionAnimation,
    pomodoroTimer.isRunning,
    pomodoroTimer.justCompleted,
    pomodoroTimer.sessionType,
    pomodoroTimer.currentSession,
    currentTaskId,
    userData.tasks,
    activityState,
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
    disconnect,
  };

  return <TabbieContext.Provider value={value}>{children}</TabbieContext.Provider>;
};

