import React from 'react';
import { CheckCircle2, Circle, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RetroTodoCardProps {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  categoryColor?: string;
  categoryIcon?: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const RetroTodoCard: React.FC<RetroTodoCardProps> = ({
  id,
  title,
  completed,
  dueDate,
  categoryColor = '#ffe164',
  categoryIcon = '📝',
  onToggle,
  onDelete,
}) => {
  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const isOverdue = dueDate && new Date(dueDate).getTime() < new Date().getTime();
  
  // Get dark mode color based on category color - using !important to override inline styles
  const getDarkModeColor = () => {
    if (completed) return 'dark:!bg-teal-800';
    if (isOverdue) return 'dark:!bg-red-800/90';
    
    // Map light colors to appropriate dark mode colors with !important
    const colorMap: { [key: string]: string } = {
      '#ffe164': 'dark:!bg-yellow-700',     // yellow
      '#96f2d7': 'dark:!bg-teal-700',       // teal
      '#ffd4f4': 'dark:!bg-pink-700',       // pink
      '#d4f1ff': 'dark:!bg-blue-700',       // blue
      '#fff3b0': 'dark:!bg-yellow-600',     // light yellow
      '#3B82F6': 'dark:!bg-blue-700',       // blue
      '#10B981': 'dark:!bg-emerald-700',    // green
      '#F59E0B': 'dark:!bg-amber-700',      // amber
      '#EF4444': 'dark:!bg-red-700',        // red
      '#8B5CF6': 'dark:!bg-violet-700',     // violet
      '#06B6D4': 'dark:!bg-cyan-700',       // cyan
      '#EC4899': 'dark:!bg-pink-700',       // pink
      '#84CC16': 'dark:!bg-lime-700',       // lime
      '#F97316': 'dark:!bg-orange-700',     // orange
      '#14B8A6': 'dark:!bg-teal-700',       // teal
      '#6366F1': 'dark:!bg-indigo-700',     // indigo
      '#A855F7': 'dark:!bg-purple-700',     // purple
      '#EAB308': 'dark:!bg-yellow-700',     // yellow
      '#22C55E': 'dark:!bg-green-700',      // green
      '#F43F5E': 'dark:!bg-rose-700',       // rose
    };
    
    return colorMap[categoryColor] || 'dark:!bg-gray-700';
  };

  return (
    <div
      className={`group rounded-[24px] border-2 border-black dark:border-gray-500 p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)] transition-all hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${getDarkModeColor()}`}
      style={{ backgroundColor: completed ? '#96f2d7' : isOverdue ? '#ffcccb' : categoryColor }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(id)}
          className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110 active:scale-95"
        >
          {completed ? (
            <div className="w-6 h-6 rounded-full border-2 border-black dark:border-gray-300 bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-white dark:text-gray-900" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-black dark:border-gray-300 bg-white dark:bg-gray-700"></div>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-bold text-gray-900 dark:text-gray-100 ${
              completed ? 'line-through opacity-60' : ''
            }`}
          >
            {title}
          </h3>
          
          {dueDate && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="inline-flex items-center gap-1 rounded-full border-2 border-black dark:border-gray-500 bg-white dark:bg-gray-700 px-2 py-0.5 text-xs font-bold text-gray-900 dark:text-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.6)]">
                <Clock className="h-3 w-3" />
                {formatDueDate(dueDate)}
              </div>
            </div>
          )}
        </div>

        {/* Delete button - shows on hover */}
        <button
          onClick={() => onDelete(id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full border-2 border-black dark:border-gray-500 bg-[#ffcccb] dark:bg-red-700 flex items-center justify-center hover:bg-[#ff9999] dark:hover:bg-red-600 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.6)]">
            <Trash2 className="h-4 w-4 text-gray-900 dark:text-gray-100" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default RetroTodoCard;

