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

  return (
    <div
      className={`group rounded-[24px] border-2 border-black p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
        completed ? 'bg-[#96f2d7]' : 'bg-white'
      }`}
      style={{ backgroundColor: completed ? '#96f2d7' : categoryColor }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(id)}
          className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110 active:scale-95"
        >
          {completed ? (
            <div className="w-6 h-6 rounded-full border-2 border-black bg-gray-900 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-black bg-white"></div>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-bold text-gray-900 ${
              completed ? 'line-through opacity-60' : ''
            }`}
          >
            {title}
          </h3>
          
          {dueDate && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-2 py-0.5 text-xs font-bold text-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
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
          <div className="w-8 h-8 rounded-full border-2 border-black bg-[#ffcccb] flex items-center justify-center hover:bg-[#ff9999] transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <Trash2 className="h-4 w-4 text-gray-900" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default RetroTodoCard;

