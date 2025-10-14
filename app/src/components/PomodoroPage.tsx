import React, { useState } from 'react';
import { Play, Pause, Square, Clock, ChevronLeft, CheckSquare, Coffee, Bug, SkipForward, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTodo } from '@/contexts/TodoContext';
import { debugPomodoroState } from '@/utils/storage';
import { testPomodoroPersistence, testPageRefreshScenario } from '@/utils/pomodoro-persistence-test';

interface PomodoroPageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings') => void;
  theme?: 'clean' | 'retro';
}

const PomodoroPage: React.FC<PomodoroPageProps> = ({ onPageChange, theme = 'clean' }) => {
  const {
    userData,
    currentTaskId,
    pomodoroTimer,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    startPomodoro,
    updateTask,
    startNextSession,
    completeWorkSession,
    skipBreak,
    debugSetTimerTo10Seconds,
    debugSetTimerTo14m45Overtime,
  } = useTodo();

  // Get current task from userData using currentTaskId
  const currentTask = currentTaskId ? userData.tasks.find(t => t.id === currentTaskId) : null;

  // Test sound function
  const testSound = () => {
    try {
      console.log('🔊 Testing sound...');
      const audio = new Audio('/sound.mp3');
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.log('🔊 Test sound failed:', error);
      });
    } catch (error) {
      console.log('🔊 Test sound error:', error);
    }
  };

  // Debug timer state function
  const debugTimerState = () => {
    console.log('🔍 Debug Timer State:');
    console.log('timeLeft:', pomodoroTimer.timeLeft);
    console.log('isRunning:', pomodoroTimer.isRunning);
    console.log('sessionType:', pomodoroTimer.sessionType);
    console.log('currentSession:', pomodoroTimer.currentSession);
    console.log('totalPausedTime:', pomodoroTimer.totalPausedTime);
    console.log('pausedAt:', pomodoroTimer.pausedAt);
    console.log('justCompleted:', pomodoroTimer.justCompleted);
    console.log('currentTask:', currentTask);
    
    if (pomodoroTimer.currentSession) {
      const now = Date.now();
      const sessionElapsed = Math.floor((now - pomodoroTimer.currentSession.started.getTime()) / 1000);
      const effectiveElapsed = sessionElapsed - pomodoroTimer.totalPausedTime;
      const totalDuration = pomodoroTimer.currentSession.duration * 60;
      const actualTimeLeft = totalDuration - effectiveElapsed;
      
      console.log('🔍 Timer Calculations:');
      console.log('sessionElapsed:', sessionElapsed);
      console.log('effectiveElapsed:', effectiveElapsed);
      console.log('totalDuration:', totalDuration);
      console.log('actualTimeLeft:', actualTimeLeft);
    }
  };

  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [selectedTaskForPomodoro, setSelectedTaskForPomodoro] = useState<string>('');

  // Get available tasks (not completed)
  const availableTasks = userData.tasks.filter(task => !task.completed);

  // Calculate session info
  const completedWorkSessions = currentTask?.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
  const estimatedSessions = currentTask?.estimatedPomodoros || 3;
  
  // Calculate current session number (work sessions only) - include current session if it's a work session
  const currentSessionNumber = completedWorkSessions + 
    (pomodoroTimer.sessionType === 'work' && !pomodoroTimer.justCompleted ? 1 : 0);

  // Check if task is completely done
  const isTaskComplete = completedWorkSessions >= estimatedSessions || 
    (pomodoroTimer.justCompleted && pomodoroTimer.sessionType === 'work' && 
     (completedWorkSessions + 1) >= estimatedSessions);

  // Generate progress bars data - work sessions and breaks
  const generateProgressBars = () => {
    if (!currentTask) return [];
    
    const bars = [];
    const totalWorkSessions = estimatedSessions;
    
    // Calculate completed work sessions including the current one if it's completed
    const effectiveCompletedWorkSessions = completedWorkSessions + 
      (pomodoroTimer.justCompleted && pomodoroTimer.sessionType === 'work' ? 1 : 0);
    
    for (let i = 0; i < totalWorkSessions; i++) {
      // Work session
      bars.push({
        type: 'work',
        isCompleted: i < effectiveCompletedWorkSessions,
        isCurrent: i === effectiveCompletedWorkSessions && pomodoroTimer.sessionType === 'work' && !pomodoroTimer.justCompleted,
        index: i
      });
      
      // Break session (except after the last work session)
      if (i < totalWorkSessions - 1) {
        bars.push({
          type: 'break',
          isCompleted: i < effectiveCompletedWorkSessions,
          isCurrent: i === effectiveCompletedWorkSessions - 1 && pomodoroTimer.sessionType === 'shortBreak' && !pomodoroTimer.justCompleted,
          index: i
        });
      }
    }
    
    // Add extra pomodoros if user has added more than estimated
    const extraPomodoros = Math.max(0, completedWorkSessions - estimatedSessions);
    for (let i = 0; i < extraPomodoros; i++) {
      bars.push({
        type: 'work',
        isCompleted: true,
        isCurrent: false,
        index: estimatedSessions + i,
        isExtra: true
      });
    }
    
    return bars;
  };

  const progressBars = generateProgressBars();


  // Calculate progress percentage for circular timer
  const calculateProgress = () => {
    if (!pomodoroTimer.currentSession) return 0;
    
    const totalDuration = pomodoroTimer.currentSession.duration * 60;
    const elapsed = totalDuration - pomodoroTimer.timeLeft;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    return progress;
  };

  const progress = calculateProgress();

  // Check if session is overdue (past scheduled time) - both work and break sessions can be overdue
  // Allow overdue state even when just completed, so user can see the appropriate buttons
  const isWorkOverdue = pomodoroTimer.sessionType === 'work' && pomodoroTimer.timeLeft < 0;
  const isBreakOverdue = pomodoroTimer.sessionType === 'shortBreak' && pomodoroTimer.timeLeft < 0;

  const isAutoPausedForOvertime = !!pomodoroTimer.overtimeAutoPaused && !pomodoroTimer.isRunning;
  const overtimeSeconds = pomodoroTimer.overtimeAutoPaused?.overtimeSeconds || 0;
  const overtimeMinutesDisplay = Math.floor(overtimeSeconds / 60);
  const overtimeSecondsDisplay = overtimeSeconds % 60;

  React.useEffect(() => {
    if (isAutoPausedForOvertime) {
      if (typeof window !== 'undefined' && typeof window.focus === 'function') {
        try {
          window.focus();
        } catch (error) {
          console.warn('Unable to focus window after overtime autopause:', error);
        }
      }
    }
  }, [isAutoPausedForOvertime]);

  const formatTime = (seconds: number): string => {
    // Handle NaN, undefined, or invalid values
    if (isNaN(seconds) || !isFinite(seconds) || seconds === null || seconds === undefined) {
      console.warn('Invalid time value detected:', seconds);
      console.warn('Pomodoro timer state:', {
        timeLeft: pomodoroTimer.timeLeft,
        isRunning: pomodoroTimer.isRunning,
        sessionType: pomodoroTimer.sessionType,
        currentSession: pomodoroTimer.currentSession,
        totalPausedTime: pomodoroTimer.totalPausedTime,
        pausedAt: pomodoroTimer.pausedAt,
      });
      return '00:00';
    }
    
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    return seconds < 0 ? `+${timeStr}` : timeStr;
  };

  const handleStartPomodoroWithTask = () => {
    if (selectedTaskForPomodoro) {
      const task = userData.tasks.find(t => t.id === selectedTaskForPomodoro);
      if (task) {
        // Start the pomodoro session with the task as-is, preserving existing data
        startPomodoro(task);
        setShowTaskSelection(false);
      }
    }
  };

  // Circular progress component
  const CircularProgress = ({ progress, size = 280 }: { progress: number; size?: number }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const isRetro = theme === 'retro';

    return (
      <div className={isRetro ? "relative border-4 border-black rounded-full shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.3)]" : "relative"}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isRetro ? "rgb(255 255 255 / 0.3)" : "rgb(229 231 235)"}
            strokeWidth={isRetro ? "12" : "8"}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={
              isWorkOverdue ? (isRetro ? "rgb(255 128 0)" : "rgb(249 115 22)") : // orange for overdue work
              isBreakOverdue ? (isRetro ? "rgb(255 80 80)" : "rgb(239 68 68)") : // red for overdue break
              pomodoroTimer.sessionType === 'work' ? (isRetro ? "rgb(255 80 80)" : "rgb(239 68 68)") : (isRetro ? "rgb(0 229 160)" : "rgb(34 197 94)")
            }
            strokeWidth={isRetro ? "12" : "8"}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={isRetro ? "text-6xl font-mono font-black text-gray-900 dark:text-white mb-2" : "text-6xl font-mono font-bold text-gray-900 mb-2"}>
            {formatTime(pomodoroTimer.timeLeft)}
          </div>
          <div className={`text-lg ${isRetro ? 'font-bold' : 'font-medium'} ${
            isWorkOverdue ? 'text-orange-600 dark:text-orange-400' : 
            isBreakOverdue ? 'text-red-600 dark:text-red-400' :
            pomodoroTimer.sessionType === 'work' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}>
            {isWorkOverdue ? '⏰ Take Break' : 
             isBreakOverdue ? '⏰ Break Overdue' :
             pomodoroTimer.sessionType === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
          </div>
        </div>
      </div>
    );
  };

  if (!currentTask || (!pomodoroTimer.currentSession && !pomodoroTimer.justCompleted)) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header matching dashboard style */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍅</span>
                  <h1 className="text-2xl font-bold text-gray-900">Pomodoro Timer</h1>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={debugPomodoroState}
                title="Debug persistence state"
              >
                <Bug className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-6xl mb-4">🍅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Pomodoro</h2>
            <p className="text-gray-600 mb-8">Start a pomodoro session from your task list or choose a task to focus on!</p>
            
            {availableTasks.length > 0 ? (
              <Popover open={showTaskSelection} onOpenChange={setShowTaskSelection}>
                <PopoverTrigger asChild>
                  <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white">
                    <Play className="w-5 h-5 mr-2" />
                    Track Pomodoro
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Choose a Task</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Select a task to start your pomodoro session
                      </p>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableTasks.map((task) => {
                        const category = userData.categories.find(c => c.id === task.categoryId);
                        const completedPomodoros = task.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
                        const totalEstimated = task.estimatedPomodoros || 3;
                        
                        return (
                          <div
                            key={task.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTaskForPomodoro === task.id
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setSelectedTaskForPomodoro(task.id);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {category && (
                                    <span className="text-sm">{category.icon}</span>
                                  )}
                                  <span className="font-medium text-sm">{task.title}</span>
                                </div>
                                {task.description && (
                                  <div 
                                    className="text-xs text-gray-600 mt-1 prose prose-xs max-w-none"
                                    dangerouslySetInnerHTML={{ 
                                      __html: task.description
                                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
                                        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
                                    }}
                                  />
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-500">
                                    🍅 {completedPomodoros}/{totalEstimated}
                                  </span>
                                  {completedPomodoros > 0 && (
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((completedPomodoros / totalEstimated) * 100, 100)}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowTaskSelection(false);
                          setSelectedTaskForPomodoro('');
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStartPomodoroWithTask}
                        disabled={!selectedTaskForPomodoro}
                        className="flex-1 bg-red-500 hover:bg-red-600"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-4">No tasks available. Create some tasks first!</p>
                <Button variant="outline" onClick={() => window.history.back()}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header matching dashboard style */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
                      <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍅</span>
                  <h1 className="text-2xl font-bold text-gray-900">Pomodoro Timer</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Work Session {currentSessionNumber} of {estimatedSessions}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={debugPomodoroState}
                    title="Debug persistence state"
                  >
                    <Bug className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={debugTimerState}
                    title="Debug timer state"
                    className="text-xs"
                  >
                    🔍
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={testPomodoroPersistence}
                    title="Test persistence"
                    className="text-xs"
                  >
                    Test
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={testPageRefreshScenario}
                    title="Test page refresh"
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={testSound}
                    title="Test sound"
                    className="text-xs"
                  >
                    🔊
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={debugSetTimerTo10Seconds}
                    title="Set timer to 10 seconds for testing"
                    className="text-xs"
                  >
                    ⏱️10s
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={debugSetTimerTo14m45Overtime}
                    title="Set timer to 14:45 overtime for testing"
                    className="text-xs"
                  >
                    ⏱️14:45
                  </Button>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Timer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              
              {/* Task Info */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentTask?.title || 'No Task Selected'}
                </h2>
                {currentTask?.description && (
                  <div 
                    className="text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: currentTask.description
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
                        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
                    }}
                  />
                )}
                {!currentTask && (
                  <p className="text-gray-500 text-sm">Please select a task to start a pomodoro session</p>
                )}
              </div>

              {/* Circular Timer */}
              <div className="flex justify-center mb-8">
                <CircularProgress progress={progress} />
              </div>

              {/* Progress Bars - Horizontal Timeline */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Session Progress</h3>
                <div className="flex items-center gap-1 mb-2">
                  {progressBars.map((bar, index) => (
                    <div
                      key={index}
                      className={`h-3 rounded-sm transition-all duration-300 ${
                        bar.type === 'work' ? 'flex-1' : 'w-4'
                      } ${
                        bar.isCompleted
                          ? bar.type === 'work'
                            ? bar.isExtra 
                              ? 'bg-blue-500' // Extra pomodoros in blue
                              : 'bg-red-500'
                            : 'bg-green-500'
                          : bar.isCurrent
                          ? bar.type === 'work'
                            ? 'bg-red-400 animate-pulse shadow-lg shadow-red-200'
                            : 'bg-green-400 animate-pulse shadow-lg shadow-green-200'
                          : 'bg-gray-200'
                      }`}
                      title={
                        bar.type === 'work'
                          ? `Pomodoro ${bar.index + 1} ${
                              bar.isExtra 
                                ? '(Extra)'
                                : bar.isCompleted
                                ? '(Completed)'
                                : bar.isCurrent
                                ? '(Current)'
                                : '(Upcoming)'
                            }`
                          : `Break ${bar.index + 1} ${
                              bar.isCompleted
                                ? '(Completed)'
                                : bar.isCurrent
                                ? '(Current)'
                                : '(Upcoming)'
                            }`
                      }
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>🍅 Pomodoro</span>
                  <span>☕ Break</span>
                </div>
              </div>

              {/* Overtime autopause prompt */}
              {isAutoPausedForOvertime && (
                <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-orange-100 p-2 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-700">
                        Session paused after {overtimeMinutesDisplay}:{overtimeSecondsDisplay.toString().padStart(2, '0')} overtime
                      </p>
                      <p className="mt-1 text-sm text-orange-700/90">
                        Are you still here? Choose how you want to continue.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={resumePomodoro}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Continue {pomodoroTimer.sessionType === 'work' ? 'Working' : 'Break'}
                    </Button>
                    {pomodoroTimer.sessionType === 'work' ? (
                      <Button
                        onClick={completeWorkSession}
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Coffee className="mr-2 h-4 w-4" />
                        Take Break
                      </Button>
                    ) : (
                      <Button
                        onClick={startNextSession}
                        variant="outline"
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Continue Working
                      </Button>
                    )}
                    <Button
                      onClick={stopPomodoro}
                      variant="ghost"
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop Session
                    </Button>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {isAutoPausedForOvertime ? null : isWorkOverdue ? (
                  // Show overdue work controls first - this takes priority over justCompleted
                  <>
                    <Button 
                      onClick={completeWorkSession}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    >
                      <Coffee className="w-5 h-5 mr-2" />
                      Take Break
                    </Button>
                    <Button 
                      onClick={stopPomodoro}
                      variant="outline"
                      size="lg"
                      className="px-8 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop
                    </Button>
                  </>
                ) : isBreakOverdue ? (
                  // Show overdue break controls
                  <>
                    <Button 
                      onClick={startNextSession}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white px-8"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Continue Working
                    </Button>
                    <Button 
                      onClick={stopPomodoro}
                      variant="outline"
                      size="lg"
                      className="px-8 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop
                    </Button>
                  </>
                ) : pomodoroTimer.justCompleted ? (
                  // Streamlined completion state - auto-start next session or show minimal controls
                  <>
                    {isTaskComplete ? (
                      <div className="text-center space-y-4">
                        <div className="text-lg font-medium text-green-600 mb-4">
                          🎉 Task Completed! All pomodoros finished.
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button 
                            onClick={() => {
                              if (currentTask) {
                                // Mark the task as completed
                                updateTask(currentTask.id, { completed: true });
                                // Stop the pomodoro session
                                stopPomodoro();
                                // Navigate back to tasks
                                window.history.back();
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-8"
                          >
                            <CheckSquare className="w-5 h-5 mr-2" />
                            Finish Task
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              if (currentTask) {
                                // Add more pomodoros to continue working
                                updateTask(currentTask.id, {
                                  estimatedPomodoros: estimatedSessions + 1
                                });
                                // Start a new pomodoro for the same task
                                startPomodoro(currentTask);
                              }
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Continue Working
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="text-lg font-medium text-gray-900 mb-2">
                          {pomodoroTimer.sessionType === 'work' ? '🎉 Great Work!' : '☕ Break Complete!'}
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button 
                            onClick={startNextSession}
                            className={`${
                              pomodoroTimer.sessionType === 'work' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-red-600 hover:bg-red-700'
                            } text-white px-8`}
                          >
                            {pomodoroTimer.sessionType === 'work' ? (
                              <>
                                <Coffee className="w-5 h-5 mr-2" />
                                Take Break
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                Continue Working
                              </>
                            )}
                          </Button>
                          
                          {pomodoroTimer.sessionType === 'work' && (
                            <Button 
                              onClick={skipBreak}
                              variant="outline"
                              className="px-8"
                            >
                              <SkipForward className="w-5 h-5 mr-2" />
                              Skip Break
                            </Button>
                          )}
                          
                          {/* Add More Pomodoros button when work session is completed */}
                          {pomodoroTimer.sessionType === 'work' && completedWorkSessions >= estimatedSessions && (
                            <Button 
                              onClick={() => {
                                if (currentTask) {
                                  updateTask(currentTask.id, {
                                    estimatedPomodoros: estimatedSessions + 1
                                  });
                                }
                              }}
                              variant="outline"
                              className="px-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Plus className="w-5 h-5 mr-2" />
                              Add Pomodoro & Continue
                            </Button>
                          )}
                          
                          <Button 
                            onClick={() => {
                              if (currentTask) {
                                // Mark the task as completed
                                updateTask(currentTask.id, { completed: true });
                                // Stop the pomodoro session
                                stopPomodoro();
                                // Navigate back to tasks
                                window.history.back();
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-8"
                          >
                            <CheckSquare className="w-5 h-5 mr-2" />
                            Finish Task
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {pomodoroTimer.sessionType === 'shortBreak' ? (
                      // Break session controls - only skip and stop
                      <>
                        <Button
                          onClick={skipBreak}
                          size="lg"
                          variant="outline"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <SkipForward className="w-5 h-5 mr-2" />
                          Skip Break
                        </Button>
                        <Button 
                          onClick={stopPomodoro}
                          variant="outline"
                          size="lg"
                          className="px-8 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Square className="w-5 h-5 mr-2" />
                          Stop
                        </Button>
                      </>
                    ) : (
                      // Work session controls - pause, resume, stop, finish
                      <>
                        {pomodoroTimer.isRunning ? (
                          <Button 
                            onClick={pausePomodoro}
                            size="lg"
                            className={
                              theme === 'retro'
                                ? "bg-[#ffe164] dark:bg-[#ffd700] text-gray-900 px-8 rounded-full border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                                : "bg-orange-600 hover:bg-orange-700 text-white px-8"
                            }
                          >
                            <Pause className="w-5 h-5 mr-2" />
                            Pause
                          </Button>
                        ) : (
                          <Button 
                            onClick={resumePomodoro}
                            size="lg"
                            className={
                              theme === 'retro'
                                ? "bg-[#96f2d7] dark:bg-[#00e5a0] text-gray-900 px-8 rounded-full border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                                : "bg-green-600 hover:bg-green-700 text-white px-8"
                            }
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Resume
                          </Button>
                        )}
                        <Button 
                          onClick={stopPomodoro}
                          variant="outline"
                          size="lg"
                          className={
                            theme === 'retro'
                              ? "px-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-full border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                              : "px-8 border-red-200 text-red-600 hover:bg-red-50"
                          }
                        >
                          <Square className="w-5 h-5 mr-2" />
                          Stop
                        </Button>
                        <Button 
                          onClick={() => {
                            if (currentTask) {
                              // Mark the task as completed
                              updateTask(currentTask.id, { completed: true });
                              // Stop the pomodoro session
                              stopPomodoro();
                              // Navigate to tasks tab
                              if (onPageChange) {
                                onPageChange('tasks');
                              }
                            }
                          }}
                          size="lg"
                          className="px-8 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckSquare className="w-5 h-5 mr-2" />
                          Finish Task
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-4">
            {/* Current Session Info */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-semibold mb-3">Current Session</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-right max-w-[150px] truncate flex items-center gap-1">
                    {currentTask ? (
                      <>
                        <span>{userData.categories.find(cat => cat.id === currentTask.categoryId)?.icon || '📝'}</span>
                        <span>{userData.categories.find(cat => cat.id === currentTask.categoryId)?.name || 'Unknown'}</span>
                      </>
                    ) : 'No Task'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">
                    {pomodoroTimer.sessionType === 'work' 
                      ? userData.settings.workDuration 
                      : userData.settings.shortBreakDuration} min
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${isAutoPausedForOvertime ? 'text-orange-600' : pomodoroTimer.isRunning ? 'text-green-600' : 'text-gray-700'}`}>
                    {isAutoPausedForOvertime
                      ? `Paused · ${overtimeMinutesDisplay}:${overtimeSecondsDisplay.toString().padStart(2, '0')} overtime`
                      : pomodoroTimer.isRunning
                      ? 'Running'
                      : 'Paused'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {isWorkOverdue || isBreakOverdue ? 'Overdue' : `${progress.toFixed(0)}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Task Progress */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-semibold mb-3">Task Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{completedWorkSessions} / {estimatedSessions}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {Math.max(0, estimatedSessions - completedWorkSessions)} sessions remaining
                </div>
                
              </div>
            </div>

            {/* Workspace URLs */}
            {currentTask?.workspaceUrls && currentTask.workspaceUrls.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="text-base">🔗</span>
                  Workspace URLs ({currentTask.workspaceUrls.length})
                </h3>
                <div className="space-y-1">
                  {currentTask.workspaceUrls.map((url, index) => (
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
                <div className="pt-2 border-t border-gray-200 mt-3">
                  <div className="text-xs text-gray-500">
                    💡 Manually close workspace tabs when you're done focusing
                  </div>
                </div>
              </div>
            )}

            {/* Focus Tips */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-semibold mb-3">💡 Focus Tips</h3>
              <div className="space-y-2 text-xs text-gray-600">
                {isWorkOverdue ? (
                  <>
                    <p className="text-orange-600 font-medium">⏰ Work session is overdue!</p>
                    <p>• You've worked longer than planned</p>
                    <p>• Consider taking a break to stay fresh</p>
                    <p>• Click "Take Break" when ready</p>
                    <p>• Or continue if you're in the flow</p>
                  </>
                ) : isBreakOverdue ? (
                  <>
                    <p className="text-red-600 font-medium">⏰ Break is overdue!</p>
                    <p>• You've been on break longer than planned</p>
                    <p>• Consider getting back to work</p>
                    <p>• Click "Continue Working" when ready</p>
                    <p>• Or take more time if needed</p>
                  </>
                ) : pomodoroTimer.sessionType === 'work' ? (
                  <>
                    <p>• Close unnecessary tabs and apps</p>
                    <p>• Turn off notifications</p>
                    <p>• Keep water nearby</p>
                    <p>• Focus on one task at a time</p>
                  </>
                ) : (
                  <>
                    <p>• Stand up and stretch</p>
                    <p>• Take deep breaths</p>
                    <p>• Look away from screens</p>
                    <p>• Hydrate yourself</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage; 