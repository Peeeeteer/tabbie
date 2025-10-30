import React, { useState } from 'react';
import { Play, Pause, Square, ChevronLeft, CheckSquare, Coffee, SkipForward, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTodo } from '@/contexts/TodoContext';
import { useTabbieSync } from '@/contexts/TabbieContext';

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
    toggleTaskComplete,
    startNextSession,
    completeWorkSession,
    skipBreak,
  } = useTodo();
  
  const { triggerTaskCompletion } = useTabbieSync();

  // Get current task from userData using currentTaskId
  const currentTask = currentTaskId ? userData.tasks.find(t => t.id === currentTaskId) : null;

  // Play task complete sound
  const playTaskCompleteSound = () => {
    // Check if sounds are enabled in settings
    if (userData.settings.pomodoroSound === false) {
      console.log('🔇 Sounds are disabled in settings');
      return;
    }
    
    try {
      console.log('🔊 Playing task complete sound...');
      const audio = new Audio('/task_complete.wa.mp3');
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.log('🔊 Task complete sound failed:', error);
      });
    } catch (error) {
      console.log('🔊 Task complete sound error:', error);
    }
  };

  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [selectedTaskForPomodoro, setSelectedTaskForPomodoro] = useState<string>('');
  const [showingCompletionAnimation, setShowingCompletionAnimation] = useState(false);

  // Get available tasks (not completed) and sort by due date
  const availableTasks = userData.tasks
    .filter(task => !task.completed)
    .sort((a, b) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Helper function to check if a date is overdue
      const isOverdue = (date?: Date) => {
        if (!date) return false;
        const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return taskDate.getTime() < today.getTime();
      };
      
      // Helper function to check if a date is today
      const isToday = (date?: Date) => {
        if (!date) return false;
        const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return taskDate.getTime() === today.getTime();
      };
      
      // Sort priority: overdue > due today > has due date > no due date
      const aOverdue = isOverdue(a.dueDate);
      const bOverdue = isOverdue(b.dueDate);
      const aToday = isToday(a.dueDate);
      const bToday = isToday(b.dueDate);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // If both have due dates, sort by date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      
      // Otherwise maintain original order
      return 0;
    });

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
      <div className={isRetro ? "relative border-4 border-black dark:border-gray-600 rounded-full shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(0,0,0,0.6)]" : "relative"}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isRetro ? "rgb(229 231 235)" : "rgb(229 231 235)"}
            strokeWidth={isRetro ? "12" : "8"}
            fill="none"
            className="dark:stroke-gray-700"
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
      <div className={
        theme === 'retro'
          ? "min-h-screen bg-white dark:bg-gray-950"
          : "min-h-screen bg-gray-50 dark:bg-gray-950"
      }>
        {/* Header matching dashboard style */}
        <div className={
          theme === 'retro'
            ? "bg-[#ffe164] dark:bg-gray-900 shadow-sm border-b-2 border-black dark:border-gray-700"
            : "bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800"
        }>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍅</span>
                <h1 className={
                  theme === 'retro'
                    ? "text-2xl font-black text-gray-900 dark:text-gray-100"
                    : "text-2xl font-bold text-gray-900 dark:text-gray-100"
                }>Pomodoro Timer</h1>
                <span className="text-2xl">🍅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className={
            theme === 'retro'
              ? "bg-white dark:bg-gray-800 rounded-[24px] border-2 border-black dark:border-gray-600 shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] p-8 text-center"
              : "bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 p-8 text-center"
          }>
            <div className="text-6xl mb-4">🍅</div>
            <h2 className={
              theme === 'retro'
                ? "text-2xl font-black text-gray-900 dark:text-gray-100 mb-2"
                : "text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            }>No Active Pomodoro</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Start a pomodoro session from your task list or choose a task to focus on!</p>
            
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Click to select or double-click to start immediately
                      </p>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableTasks.map((task) => {
                        const category = userData.categories.find(c => c.id === task.categoryId);
                        const completedPomodoros = task.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;
                        const totalEstimated = task.estimatedPomodoros || 3;
                        
                        // Check due date status
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const isOverdue = task.dueDate && new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate()).getTime() < today.getTime();
                        const isToday = task.dueDate && new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate()).getTime() === today.getTime();
                        
                        return (
                          <div
                            key={task.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTaskForPomodoro === task.id
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-400'
                                : isOverdue
                                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-500 hover:border-red-400 dark:hover:border-red-400'
                                : isToday
                                ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500 hover:border-orange-400 dark:hover:border-orange-400'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => {
                              setSelectedTaskForPomodoro(task.id);
                            }}
                            onDoubleClick={() => {
                              // Double-click to immediately start the session
                              setSelectedTaskForPomodoro(task.id);
                              startPomodoro(task);
                              setShowTaskSelection(false);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {category && (
                                    <span className="text-sm">{category.icon}</span>
                                  )}
                                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{task.title}</span>
                                  {isOverdue && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white dark:bg-red-500 dark:text-white rounded-full">
                                      OVERDUE
                                    </span>
                                  )}
                                  {isToday && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-600 text-white dark:bg-orange-500 dark:text-white rounded-full">
                                      TODAY
                                    </span>
                                  )}
                                </div>
                                {task.description && (
                                  <div 
                                    className="text-xs text-gray-600 dark:text-gray-400 mt-1 prose prose-xs max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ 
                                      __html: task.description
                                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
                                        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
                                    }}
                                  />
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    🍅 {completedPomodoros}/{totalEstimated}
                                  </span>
                                  {completedPomodoros > 0 && (
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div 
                                        className="bg-red-500 dark:bg-red-400 h-1.5 rounded-full transition-all duration-300"
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
    <div className={
      theme === 'retro'
        ? "min-h-screen bg-white dark:bg-gray-950"
        : "min-h-screen bg-gray-50 dark:bg-gray-950"
    }>
      {/* Header matching dashboard style */}
      <div className={
        theme === 'retro'
          ? "bg-[#ffe164] dark:bg-gray-900 shadow-sm border-b-2 border-black dark:border-gray-700"
          : "bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800"
      }>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍅</span>
              <h1 className={
                theme === 'retro'
                  ? "text-2xl font-black text-gray-900 dark:text-gray-100"
                  : "text-2xl font-bold text-gray-900 dark:text-gray-100"
              }>Pomodoro Timer</h1>
              <span className="text-2xl">🍅</span>
            </div>
            <div className={
              theme === 'retro'
                ? "text-sm font-bold text-gray-700 dark:text-gray-300"
                : "text-sm text-gray-600 dark:text-gray-400"
            }>
              Work Session {currentSessionNumber} of {estimatedSessions}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Timer */}
          <div className="lg:col-span-2">
            <div className={
              theme === 'retro'
                ? "bg-white dark:bg-gray-800 rounded-[24px] border-2 border-black dark:border-gray-600 shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] p-8"
                : "bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 p-8"
            }>
              
              {/* Task Info */}
              <div className="text-center mb-8">
                <h2 className={
                  theme === 'retro'
                    ? "text-2xl font-black text-gray-900 dark:text-gray-100 mb-2"
                    : "text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
                }>
                  {currentTask?.title || 'No Task Selected'}
                </h2>
                {currentTask?.description && (
                  <div 
                    className="text-gray-600 dark:text-gray-400 prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ 
                      __html: currentTask.description
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
                        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
                    }}
                  />
                )}
                {!currentTask && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Please select a task to start a pomodoro session</p>
                )}
              </div>

              {/* Circular Timer */}
              <div className="flex justify-center mb-8">
                <CircularProgress progress={progress} />
              </div>

              {/* Progress Bars - Horizontal Timeline */}
              <div className="mb-8">
                <h3 className={
                  theme === 'retro'
                    ? "text-sm font-black text-gray-900 dark:text-gray-100 mb-4"
                    : "text-sm font-medium text-gray-700 dark:text-gray-400 mb-4"
                }>Session Progress</h3>
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
                <div className={
                  theme === 'retro'
                    ? "flex justify-between text-xs text-gray-700 dark:text-gray-300 font-bold"
                    : "flex justify-between text-xs text-gray-500 dark:text-gray-400"
                }>
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
                                // Show completion animation overlay
                                setShowingCompletionAnimation(true);
                                // Trigger completion animation on Tabbie
                                triggerTaskCompletion(currentTask.title);
                                // Mark the task as completed
                                updateTask(currentTask.id, { completed: true });
                                // Stop the pomodoro session
                                stopPomodoro();
                                // Wait 5 seconds for animation to play, then navigate
                                setTimeout(() => {
                                  window.history.back();
                                }, 5000);
                              }
                            }}
                            disabled={showingCompletionAnimation}
                            className={
                              theme === 'retro'
                                ? "bg-[#96f2d7] dark:bg-teal-600 hover:bg-[#96f2d7] dark:hover:bg-teal-600 text-gray-900 dark:text-gray-100 px-8 rounded-full border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold disabled:opacity-50"
                                : "bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-50"
                            }
                          >
                            <CheckSquare className="w-5 h-5 mr-2" />
                            {showingCompletionAnimation ? 'Completing...' : 'Finish Task'}
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
                            disabled={showingCompletionAnimation}
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
                                // Play task complete sound
                                playTaskCompleteSound();
                                // Show completion animation overlay
                                setShowingCompletionAnimation(true);
                                // Trigger completion animation on Tabbie
                                triggerTaskCompletion(currentTask.title);
                                // Mark the task as completed (moves to completedTasks array)
                                toggleTaskComplete(currentTask.id);
                                // Stop the pomodoro session
                                stopPomodoro();
                                // Wait 5 seconds for animation to play, then navigate
                                setTimeout(() => {
                                  window.history.back();
                                }, 5000);
                              }
                            }}
                            disabled={showingCompletionAnimation}
                            className={
                              theme === 'retro'
                                ? "bg-[#96f2d7] dark:bg-teal-600 hover:bg-[#96f2d7] dark:hover:bg-teal-600 text-gray-900 dark:text-gray-100 px-8 rounded-full border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold disabled:opacity-50"
                                : "bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-50"
                            }
                          >
                            <CheckSquare className="w-5 h-5 mr-2" />
                            {showingCompletionAnimation ? 'Completing...' : 'Finish Task'}
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
                                ? "bg-[#ffe164] dark:bg-yellow-600 hover:bg-[#ffe164] dark:hover:bg-yellow-600 text-gray-900 dark:text-gray-100 px-8 rounded-full border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
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
                                ? "bg-[#96f2d7] dark:bg-teal-600 text-gray-900 dark:text-gray-100 px-8 rounded-full border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
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
                              ? "px-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-full border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                              : "px-8 border-red-200 text-red-600 hover:bg-red-50"
                          }
                        >
                          <Square className="w-5 h-5 mr-2" />
                          Stop
                        </Button>
                        <Button 
                          onClick={() => {
                            if (currentTask) {
                              // Show completion animation overlay
                              setShowingCompletionAnimation(true);
                              // Trigger completion animation on Tabbie
                              triggerTaskCompletion(currentTask.title);
                              // Mark the task as completed
                              updateTask(currentTask.id, { completed: true });
                              // Stop the pomodoro session
                              stopPomodoro();
                              // Wait 5 seconds for animation to play, then navigate
                              setTimeout(() => {
                                if (onPageChange) {
                                  onPageChange('tasks');
                                }
                              }, 5000);
                            }
                          }}
                          size="lg"
                          disabled={showingCompletionAnimation}
                          className={
                            theme === 'retro'
                              ? "px-8 bg-[#96f2d7] dark:bg-teal-600 hover:bg-[#96f2d7] dark:hover:bg-teal-600 text-gray-900 dark:text-gray-100 rounded-full border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold disabled:opacity-50"
                              : "px-8 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          }
                        >
                          <CheckSquare className="w-5 h-5 mr-2" />
                          {showingCompletionAnimation ? 'Completing...' : 'Finish Task'}
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
            {/* Session Overview - Compact Retro Style */}
            <div className={
              theme === 'retro'
                ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-[16px] border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] p-4"
                : "bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 p-4"
            }>
              {/* Header with Session Type */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{pomodoroTimer.sessionType === 'work' ? '🍅' : '☕'}</span>
                  <div>
                    <h3 className={
                      theme === 'retro'
                        ? "text-sm font-black text-gray-900 dark:text-gray-100"
                        : "text-sm font-semibold text-gray-900 dark:text-gray-100"
                    }>
                      {pomodoroTimer.sessionType === 'work' ? 'Work Session' : 'Break Time'}
                    </h3>
                    <p className={
                      theme === 'retro'
                        ? "text-xs text-gray-600 dark:text-gray-400 font-bold dark:font-normal"
                        : "text-xs text-gray-600 dark:text-gray-400"
                    }>
                      {currentSessionNumber} of {estimatedSessions}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                  isAutoPausedForOvertime ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                  pomodoroTimer.isRunning ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                  'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {isAutoPausedForOvertime ? 'Paused' : pomodoroTimer.isRunning ? 'Running' : 'Paused'}
                </div>
              </div>

              {/* Category & Task Info */}
              {currentTask && (
                <div className={
                  theme === 'retro'
                    ? "mb-3 p-2 bg-white dark:bg-gray-900 border border-black dark:border-gray-600 rounded-lg"
                    : "mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                }>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {userData.categories.find(cat => cat.id === currentTask.categoryId)?.icon || '📝'}
                    </span>
                    <span className={
                      theme === 'retro'
                        ? "text-xs font-bold dark:font-semibold text-gray-900 dark:text-gray-100"
                        : "text-xs font-medium text-gray-900 dark:text-gray-100"
                    }>
                      {userData.categories.find(cat => cat.id === currentTask.categoryId)?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              )}

              {/* Progress Stats */}
              <div className={
                theme === 'retro'
                  ? "grid grid-cols-2 gap-2"
                  : "grid grid-cols-2 gap-3"
              }>
                <div className={
                  theme === 'retro'
                    ? "bg-white dark:bg-gray-900 border border-black dark:border-gray-600 rounded-lg p-2 text-center"
                    : "bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center"
                }>
                  <div className={
                    theme === 'retro'
                      ? "text-lg font-black text-gray-900 dark:text-gray-100"
                      : "text-lg font-bold text-gray-900 dark:text-gray-100"
                  }>
                    {completedWorkSessions}/{estimatedSessions}
                  </div>
                  <div className={
                    theme === 'retro'
                      ? "text-[10px] text-gray-600 dark:text-gray-400 font-bold dark:font-normal"
                      : "text-[10px] text-gray-600 dark:text-gray-400"
                  }>
                    Completed
                  </div>
                </div>
                <div className={
                  theme === 'retro'
                    ? "bg-white dark:bg-gray-900 border border-black dark:border-gray-600 rounded-lg p-2 text-center"
                    : "bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center"
                }>
                  <div className={
                    theme === 'retro'
                      ? "text-lg font-black text-gray-900 dark:text-gray-100"
                      : "text-lg font-bold text-gray-900 dark:text-gray-100"
                  }>
                    {isWorkOverdue || isBreakOverdue ? '—' : `${progress.toFixed(0)}%`}
                  </div>
                  <div className={
                    theme === 'retro'
                      ? "text-[10px] text-gray-600 dark:text-gray-400 font-bold dark:font-normal"
                      : "text-[10px] text-gray-600 dark:text-gray-400"
                  }>
                    Progress
                  </div>
                </div>
              </div>
            </div>

            {/* Workspace URLs */}
            {currentTask?.workspaceUrls && currentTask.workspaceUrls.length > 0 && (
              <div className={
                theme === 'retro'
                  ? "bg-white dark:bg-gray-800 rounded-[16px] border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] p-4"
                  : "bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 p-4"
              }>
                <h3 className={
                  theme === 'retro'
                    ? "text-sm font-black text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2"
                    : "text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2"
                }>
                  <span className="text-base">🔗</span>
                  Workspace URLs ({currentTask.workspaceUrls.length})
                </h3>
                <div className="space-y-1">
                  {currentTask.workspaceUrls.map((url, index) => (
                    <div key={index} className={
                      theme === 'retro'
                        ? "flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 border border-black dark:border-gray-600 rounded-lg text-xs"
                        : "flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                    }>
                      <span className="text-blue-500 dark:text-blue-400">🌐</span>
                      <span 
                        className={
                          theme === 'retro'
                            ? "flex-1 text-gray-900 dark:text-gray-100 font-bold dark:font-normal truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                            : "flex-1 text-gray-700 dark:text-gray-300 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        }
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
                <div className={
                  theme === 'retro'
                    ? "pt-2 border-t-2 border-black dark:border-gray-600 mt-3"
                    : "pt-2 border-t border-gray-200 dark:border-gray-700 mt-3"
                }>
                  <div className={
                    theme === 'retro'
                      ? "text-xs text-gray-700 dark:text-gray-300 font-bold dark:font-normal"
                      : "text-xs text-gray-500 dark:text-gray-400"
                  }>
                    💡 Manually close workspace tabs when you're done focusing
                  </div>
                </div>
              </div>
            )}

            {/* Focus Tips */}
            <div className={
              theme === 'retro'
                ? "bg-white dark:bg-gray-800 rounded-[16px] border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] p-4"
                : "bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 p-4"
            }>
              <h3 className={
                theme === 'retro'
                  ? "text-sm font-black text-gray-900 dark:text-gray-100 mb-3"
                  : "text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3"
              }>💡 Focus Tips</h3>
              <div className={
                theme === 'retro'
                  ? "space-y-2 text-xs text-gray-700 dark:text-gray-300 font-bold dark:font-normal"
                  : "space-y-2 text-xs text-gray-600 dark:text-gray-400"
              }>
                {isWorkOverdue ? (
                  <>
                    <p className="text-orange-600 dark:text-orange-400 font-medium">⏰ Work session is overdue!</p>
                    <p>• You've worked longer than planned</p>
                    <p>• Consider taking a break to stay fresh</p>
                    <p>• Click "Take Break" when ready</p>
                    <p>• Or continue if you're in the flow</p>
                  </>
                ) : isBreakOverdue ? (
                  <>
                    <p className="text-red-600 dark:text-red-400 font-medium">⏰ Break is overdue!</p>
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