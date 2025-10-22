import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  size = 'md',
}: ToggleSwitchProps) {
  const sizeConfig = {
    sm: {
      track: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5',
    },
    md: {
      track: 'w-12 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-6',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  };

  const config = sizeConfig[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        checked 
          ? 'bg-green-500 dark:bg-green-600' 
          : 'bg-gray-300 dark:bg-gray-600',
        config.track,
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-lg transition-transform duration-200',
          config.thumb,
          'translate-x-0.5',
          checked && config.translate
        )}
      />
    </button>
  );
} 