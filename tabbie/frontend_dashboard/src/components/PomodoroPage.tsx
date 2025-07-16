import React, { useState } from 'react';
import { Play, Pause, Square, Clock, ChevronLeft, CheckSquare, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useTodo } from '@/contexts/TodoContext';

const PomodoroPage: React.FC = () => {
  const {
    userData,
    currentTask,
    pomodoroTimer,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    startPomodoro,
    updateTask,
  } = useTodo();

  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [selectedTaskForPomodoro, setSelectedTaskForPomodoro] = useState<string>('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState<number[]>([3]);

  // Get available tasks (not completed)
  const availableTasks = userData.tasks.filter(task => !task.completed);

  // Calculate progress values
  const totalDuration = pomodoroTimer.sessionType === 'work' 
    ? userData.settings.workDuration * 60 
    : userData.settings.shortBreakDuration * 60;
  
  const progress = pomodoroTimer.timeLeft > 0 
    ? ((totalDuration - pomodoroTimer.timeLeft) / totalDuration) * 100
    : 100;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartPomodoroWithTask = () => {
    if (selectedTaskForPomodoro) {
      const task = userData.tasks.find(t => t.id === selectedTaskForPomodoro);
      if (task) {
        // Update task with new estimated pomodoros if changed
        if (estimatedPomodoros[0] !== task.estimatedPomodoros) {
          updateTask(task.id, { estimatedPomodoros: estimatedPomodoros[0] });
        }
        
        // Start the pomodoro session
        startPomodoro({
          ...task,
          estimatedPomodoros: estimatedPomodoros[0]
        });
        setShowTaskSelection(false);
      }
    }
  };

  // Calculate session info
  const completedSessions = currentTask?.pomodoroSessions?.filter(s => s.completed).length || 0;
  const estimatedSessions = currentTask?.estimatedPomodoros || 3;
  const currentSessionNumber = completedSessions + 1;

  // Generate progress bars data
  const generateProgressBars = () => {
    if (!currentTask) return [];
    
    const bars = [];
    const totalSessions = estimatedSessions;
    
    for (let i = 0; i < totalSessions; i++) {
      // Work session
      bars.push({
        type: 'work',
        isCompleted: i < completedSessions,
        isCurrent: i === completedSessions && pomodoroTimer.sessionType === 'work',
        index: i
      });
      
      // Break session (except after the last work session)
      if (i < totalSessions - 1) {
        bars.push({
          type: 'break',
          isCompleted: i < completedSessions,
          isCurrent: i === completedSessions - 1 && pomodoroTimer.sessionType !== 'work',
          index: i
        });
      }
    }
    
    return bars;
  };

  const progressBars = generateProgressBars();

  // Circular progress component
  const CircularProgress = ({ progress, size = 280 }: { progress: number; size?: number }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(229 231 235)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={pomodoroTimer.sessionType === 'work' ? "rgb(239 68 68)" : "rgb(34 197 94)"}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-mono font-bold text-gray-900 mb-2">
            {formatTime(pomodoroTimer.timeLeft)}
          </div>
          <div className={`text-lg font-medium ${
            pomodoroTimer.sessionType === 'work' ? 'text-red-600' : 'text-green-600'
          }`}>
            {pomodoroTimer.sessionType === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
          </div>
        </div>
      </div>
    );
  };

  if (!currentTask || !pomodoroTimer.currentSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header matching dashboard style */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
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
                        const completedPomodoros = task.pomodoroSessions?.filter(s => s.completed).length || 0;
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
                              setEstimatedPomodoros([task.estimatedPomodoros || 3]);
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
                                  <p className="text-xs text-gray-600 mt-1">{task.description}</p>
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

                    {selectedTaskForPomodoro && (
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Pomodoros: {estimatedPomodoros[0]}
                        </label>
                        <Slider
                          value={estimatedPomodoros}
                          onValueChange={setEstimatedPomodoros}
                          max={15}
                          min={1}
                          step={1}
                          className="mb-2"
                        />
                        <p className="text-xs text-gray-500">
                          Approximately {estimatedPomodoros[0] * userData.settings.workDuration} minutes of focused work
                        </p>
                      </div>
                    )}

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
            <div className="text-sm text-gray-600">
              Session {currentSessionNumber} of {estimatedSessions}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentTask.title}</h2>
                {currentTask.description && (
                  <p className="text-gray-600">{currentTask.description}</p>
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
                            ? 'bg-red-500'
                            : 'bg-green-500'
                          : bar.isCurrent
                          ? bar.type === 'work'
                            ? 'bg-red-300 animate-pulse'
                            : 'bg-green-300 animate-pulse'
                          : 'bg-gray-200'
                      }`}
                      title={
                        bar.type === 'work'
                          ? `Pomodoro ${bar.index + 1} ${
                              bar.isCompleted
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

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {pomodoroTimer.isRunning ? (
                  <Button 
                    onClick={pausePomodoro}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button 
                    onClick={resumePomodoro}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Resume
                  </Button>
                )}
                
                <Button 
                  onClick={stopPomodoro}
                  variant="outline"
                  size="lg"
                  className="px-8 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
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
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium">
                    {pomodoroTimer.sessionType === 'work' ? '🍅 Work' : '☕ Break'}
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
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Task Progress */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-semibold mb-3">Task Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{completedSessions} / {estimatedSessions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((completedSessions / estimatedSessions) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {Math.max(0, estimatedSessions - completedSessions)} sessions remaining
                </div>
              </div>
            </div>

            {/* Focus Tips */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-semibold mb-3">💡 Focus Tips</h3>
              <div className="space-y-2 text-xs text-gray-600">
                {pomodoroTimer.sessionType === 'work' ? (
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