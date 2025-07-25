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
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const thumbTranslateClasses = {
    sm: 'translate-x-0.5',
    md: 'translate-x-0.5',
    lg: 'translate-x-1',
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted',
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform',
          thumbSizeClasses[size],
          checked 
            ? `translate-x-[calc(100%-${size === 'sm' ? '12px' : size === 'md' ? '20px' : '24px'})]` 
            : thumbTranslateClasses[size]
        )}
      />
    </button>
  );
} 