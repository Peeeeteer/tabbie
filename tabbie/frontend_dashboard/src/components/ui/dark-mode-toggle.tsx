import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';

interface DarkModeToggleProps {
  className?: string;
  variant?: 'button' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

export function DarkModeToggle({ 
  className, 
  variant = 'switch', 
  size = 'md',
  showIcon = true,
  showLabel = false
}: DarkModeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  if (variant === 'switch') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showIcon && (
          <div className="flex items-center gap-1">
            <Sun className="h-3 w-3 text-foreground" />
            <ToggleSwitch
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
              size={size}
            />
            <Moon className="h-3 w-3 text-foreground" />
          </div>
        )}
        {!showIcon && (
          <ToggleSwitch
            checked={isDarkMode}
            onCheckedChange={toggleDarkMode}
            size={size}
          />
        )}
        {showLabel && (
          <span className="text-sm font-medium">
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        )}
      </div>
    );
  }

  // Fallback to button variant for backward compatibility
  return (
    <button
      onClick={toggleDarkMode}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        "hover:bg-accent hover:text-accent-foreground h-9 px-3",
        className
      )}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
} 