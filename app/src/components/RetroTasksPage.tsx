import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RetroTodoCard from '@/components/RetroTodoCard';
import { useTodo } from '@/contexts/TodoContext';

interface RetroTasksPageProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

const RetroTasksPage: React.FC<RetroTasksPageProps> = ({ currentView = 'next7days' }) => {
  const { userData, addTask, updateTask, deleteTask, toggleTaskComplete } = useTodo();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle, selectedCategory);
      setNewTaskTitle('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  // Filter tasks based on current view
  const filteredTasks = userData.tasks.filter(task => {
    if (currentView === 'completed') return task.completed;
    if (currentView === 'today') {
      const today = new Date();
      return task.dueDate && new Date(task.dueDate).toDateString() === today.toDateString();
    }
    return !task.completed;
  });

  // Sort tasks by order
  const sortedTasks = [...filteredTasks].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[#faf7f1] relative">
      {/* Grid pattern background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 z-0" style={{
        backgroundImage: `
          linear-gradient(to right, #ddd 1px, transparent 1px),
          linear-gradient(to bottom, #ddd 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#ffe164] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-4">
            <Sparkles className="h-3 w-3" />
            Your Tasks
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Get Things{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#ff6b35]">Done</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-[#ff6b35] opacity-30 -rotate-1 -z-10"></span>
            </span>
          </h1>
          <p className="text-lg text-gray-700 font-medium">
            {sortedTasks.length === 0 
              ? '🎉 No tasks yet. Add your first one below!' 
              : `${sortedTasks.filter(t => !t.completed).length} active tasks`}
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`rounded-full border-2 border-black px-4 py-2 text-sm font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
              selectedCategory === undefined ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            }`}
          >
            All
          </button>
          {userData.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full border-2 border-black px-4 py-2 text-sm font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
                selectedCategory === category.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Add Task Input */}
        <div className="mb-8 rounded-[32px] border-2 border-black bg-white p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <div className="flex gap-3">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What needs to be done?"
              className="flex-1 border-2 border-black rounded-full px-4 py-3 text-base font-semibold focus:outline-none focus:ring-0 focus:border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            />
            <Button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="rounded-full border-2 border-black bg-[#96f2d7] text-gray-900 px-6 py-3 font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#7de0bf] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="h-5 w-5 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-16 rounded-[32px] border-2 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks yet!</h3>
              <p className="text-gray-600">Add your first task above to get started.</p>
            </div>
          ) : (
            sortedTasks
              .filter(task => !selectedCategory || task.categoryId === selectedCategory)
              .map((task) => {
                const category = userData.categories.find(c => c.id === task.categoryId);
                return (
                  <RetroTodoCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    completed={task.completed}
                    dueDate={task.dueDate}
                    categoryColor={category?.color || '#ffe164'}
                    categoryIcon={category?.icon}
                    onToggle={toggleTaskComplete}
                    onDelete={deleteTask}
                  />
                );
              })
          )}
        </div>

        {/* Stats Footer */}
        {sortedTasks.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-[24px] border-2 border-black bg-[#fff3b0] p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
              <div className="text-2xl font-black text-gray-900">{sortedTasks.filter(t => !t.completed).length}</div>
              <div className="text-xs font-bold text-gray-700 uppercase">Active</div>
            </div>
            <div className="rounded-[24px] border-2 border-black bg-[#96f2d7] p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
              <div className="text-2xl font-black text-gray-900">{sortedTasks.filter(t => t.completed).length}</div>
              <div className="text-xs font-bold text-gray-700 uppercase">Done</div>
            </div>
            <div className="rounded-[24px] border-2 border-black bg-[#ffd4f4] p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
              <div className="text-2xl font-black text-gray-900">{sortedTasks.length}</div>
              <div className="text-xs font-bold text-gray-700 uppercase">Total</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetroTasksPage;

