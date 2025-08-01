import React, { useState } from 'react';
import { Plus, Play, Pause, Square, CheckSquare, Clock, Filter, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useTodo } from '@/contexts/TodoContext';
import type { Task } from '@/types/todo';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TodoPageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings') => void;
}

const TodoPage: React.FC<TodoPageProps> = ({ onPageChange }) => {
  const {
    userData,
    selectedCategoryId,
    currentTask,
    pomodoroTimer,
    setSelectedCategory,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    reorderTasks,
  } = useTodo();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get filtered tasks based on selected category
  const filteredTasks = userData.tasks.filter(task => {
    if (selectedCategoryId && task.categoryId !== selectedCategoryId) return false;
    if (!showCompleted && task.completed) return false;
    return true;
  }).sort((a, b) => a.order - b.order);

  const selectedCategory = userData.categories.find(cat => cat.id === selectedCategoryId);
  const isAllTab = !selectedCategoryId;

  const handleAddTask = () => {
    if (newTaskTitle.trim() && selectedCategoryId) {
      addTask(newTaskTitle.trim(), selectedCategoryId, '', undefined, 3);
      setNewTaskTitle('');
    }
  };

  const handleStartPomodoro = (task: Task) => {
    // Start the pomodoro directly
    startPomodoro(task);
    
    // Navigate to pomodoro page
    if (onPageChange) {
      onPageChange('pomodoro');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filteredTasks.findIndex(task => task.id === active.id);
    const newIndex = filteredTasks.findIndex(task => task.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      const taskIds = reorderedTasks.map(task => task.id);
      reorderTasks(taskIds);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high': return 'text-red-600 border-red-200';
      case 'medium': return 'text-yellow-600 border-yellow-200';
      case 'low': return 'text-green-600 border-green-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {selectedCategory ? (
              <>
                <span className="mr-2">{selectedCategory.icon}</span>
                {selectedCategory.name}
              </>
            ) : (
              '📋 All Tasks'
            )}
          </h1>
          {selectedCategoryId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              View All
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <Filter className="w-4 h-4 mr-1" />
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </Button>
        </div>
      </div>

      {/* Pomodoro Timer */}
      {(currentTask || pomodoroTimer.currentSession) && (
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  {currentTask?.title || 'Pomodoro Session'}
                </div>
                <div className="text-sm text-blue-700">
                  {pomodoroTimer.sessionType === 'work' ? '🍅 Work Session' : '☕ Break Time'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-2xl font-mono font-bold text-blue-800">
                {formatTime(pomodoroTimer.timeLeft)}
              </div>
              
              <div className="flex gap-2">
                {pomodoroTimer.isRunning ? (
                  <Button size="sm" onClick={pausePomodoro}>
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : pomodoroTimer.timeLeft > 0 ? (
                  <Button size="sm" onClick={resumePomodoro}>
                    <Play className="w-4 h-4" />
                  </Button>
                ) : null}
                
                <Button size="sm" variant="outline" onClick={stopPomodoro}>
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Input */}
      {selectedCategoryId && (
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-medium mb-2">
              {showCompleted ? 'No Completed Tasks' : 'No Tasks Yet'}
            </h3>
            <p>
              {showCompleted 
                ? `You haven't completed any tasks ${isAllTab ? 'yet' : 'in this category yet'}.`
                : `${isAllTab ? 'Add your first task by selecting a category!' : 'Add your first task above to get started!'}`
              }
            </p>
          </div>
        ) : isAllTab ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="p-4 space-y-2">
                {filteredTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={() => toggleTaskComplete(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onStartPomodoro={() => handleStartPomodoro(task)}
                    isCurrentTask={currentTask?.id === task.id}
                    canStartPomodoro={!pomodoroTimer.isRunning}
                    isDraggable={true}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="p-4 space-y-2">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={() => toggleTaskComplete(task.id)}
                onDelete={() => deleteTask(task.id)}
                onStartPomodoro={() => handleStartPomodoro(task)}
                isCurrentTask={currentTask?.id === task.id}
                canStartPomodoro={!pomodoroTimer.isRunning}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onDelete: () => void;
  onStartPomodoro: () => void;
  isCurrentTask: boolean;
  canStartPomodoro: boolean;
  dragHandle?: React.ReactNode;
}

interface SortableTaskItemProps extends TaskItemProps {
  isDraggable: boolean;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onStartPomodoro,
  isCurrentTask,
  canStartPomodoro,
  isDraggable,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        onStartPomodoro={onStartPomodoro}
        isCurrentTask={isCurrentTask}
        canStartPomodoro={canStartPomodoro}
        dragHandle={isDraggable ? (
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        ) : undefined}
      />
    </div>
  );
};

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onStartPomodoro,
  isCurrentTask,
  canStartPomodoro,
  dragHandle,
}) => {
  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
    }
  };

          const completedSessions = task.pomodoroSessions?.filter(s => s.completed && s.type === 'work').length || 0;

  return (
    <div className={`
      p-4 border rounded-lg transition-all duration-200 hover:shadow-md
      ${task.completed ? 'bg-gray-50 opacity-75' : 'bg-white'}
      ${isCurrentTask ? 'ring-2 ring-blue-500 shadow-md' : ''}
      ${getPriorityColor(task.priority)}
    `}>
      <div className="flex items-start gap-3">
        {dragHandle}
        <button
          onClick={onToggleComplete}
          className={`
            flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center
            ${task.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-green-400'
            }
          `}
        >
          {task.completed && <CheckSquare className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className={`
            font-medium 
            ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}
          `}>
            {task.title}
          </div>
          
          {task.description && (
            <div 
              className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: task.description
                  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                  .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
                  .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
              }}
            />
          )}
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Priority: {task.priority}</span>
            {(completedSessions > 0 || task.estimatedPomodoros) && (
              <span>🍅 {completedSessions}/{task.estimatedPomodoros || 3} pomodoros</span>
            )}
            <span>Created: {task.created.toLocaleDateString()}</span>
          </div>
        </div>

        {!task.completed && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onStartPomodoro}
              disabled={!canStartPomodoro}
              className="text-xs px-2 py-1"
            >
              <Play className="w-3 h-3 mr-1" />
              Pomodoro
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Pomodoro Selection Dialog */}
      {/* This dialog is no longer needed as pomodoro starts directly */}
    </div>
  );
};

export default TodoPage; 