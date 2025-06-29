export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created: Date;
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
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  started: Date;
  ended?: Date;
  duration: number; // in minutes, typically 25
  completed: boolean; // true if full session completed
  type: 'work' | 'shortBreak' | 'longBreak';
}

export interface UserData {
  categories: Category[];
  tasks: Task[];
  pomodoroSessions: PomodoroSession[];
  settings: {
    workDuration: number; // minutes
    shortBreakDuration: number; // minutes
    longBreakDuration: number; // minutes
    sessionsUntilLongBreak: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
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
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
}; 