export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created: Date;
}

export interface TimeBlock {
  id: string;
  categoryId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ... 6=Saturday
  startTime: number; // Minutes from midnight (0-1439)
  endTime: number;   // Minutes from midnight
  taskId?: string;      // Link to a specific task
  label?: string;       // Custom label for busy blocks (e.g., "Gym")
  isBusy?: boolean;     // If true, this block is fixed/busy
  date?: string;        // ISO string 'YYYY-MM-DD' for specific date (if not recurring)
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  created: Date;
  updated: Date;
  pomodoroSessions: PomodoroSession[];
  estimatedPomodoros?: number;
  order: number;
  workspaceUrls?: string[]; // URLs to open when starting Pomodoro for this task

  // Scheduling
  scheduledDate?: string; // ISO string 'YYYY-MM-DD' for the day this task is scheduled
  scheduledTime?: number; // Start time in minutes from midnight
  duration?: number; // Duration in minutes
}

export interface CompletedTask {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  created: Date;
  completed: Date;
  pomodoroSessions: PomodoroSession[];
  estimatedPomodoros?: number;
  totalPomodoros: number; // actual completed pomodoros
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  started: Date;
  ended?: Date;
  duration: number; // in minutes, typically 25
  completed: boolean; // true if full session completed
  type: 'work' | 'shortBreak' | 'longBreak';
  pauses?: { start: Date; end: Date }[]; // Track pause intervals
}

export interface Notes {
  global: string; // All notes content
  categories: { [categoryId: string]: string }; // Notes per category
}

export interface UserData {
  categories: Category[];
  tasks: Task[];
  completedTasks: CompletedTask[];
  pomodoroSessions: PomodoroSession[];
  timeBlocks: TimeBlock[]; // Weekly schedule templates
  notes?: Notes; // User notes
  settings: {
    workDuration: number; // minutes
    shortBreakDuration: number; // minutes
    longBreakDuration: number; // minutes
    sessionsUntilLongBreak: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    theme?: 'clean' | 'retro'; // UI theme preference
    themeMode?: 'light' | 'dark' | 'auto'; // Color mode: manual light, manual dark, or time-based auto
    pomodoroSound?: boolean; // Play sound when pomodoro ends
  };
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'work',
    name: 'Work',
    color: '#3B82F6',
    icon: '💼',
    created: new Date(),
  },
  {
    id: 'coding',
    name: 'Coding',
    color: '#10B981',
    icon: '💻',
    created: new Date(),
  },
  {
    id: 'hobby',
    name: 'Hobby',
    color: '#F59E0B',
    icon: '🎨',
    created: new Date(),
  },
  {
    id: 'personal',
    name: 'Personal',
    color: '#EF4444',
    icon: '🏠',
    created: new Date(),
  },
];

export const DEFAULT_SETTINGS = {
  workDuration: 30,
  shortBreakDuration: 5,
  longBreakDuration: 10,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  theme: 'clean' as 'clean' | 'retro',
  themeMode: 'auto' as 'light' | 'dark' | 'auto',
  pomodoroSound: true,
};
