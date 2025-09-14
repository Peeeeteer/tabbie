import React from 'react';
import { useTodo } from '@/contexts/TodoContext';

interface ActivityStatsProviderProps {
  children: (activityStats: { totalPomodoros: number }) => React.ReactNode;
}

export const ActivityStatsProvider: React.FC<ActivityStatsProviderProps> = ({ children }) => {
  const { userData } = useTodo();

  // Calculate activity stats from userData (same as dashboard)
  const totalPomodoros = userData.pomodoroSessions?.filter(session => 
    session.completed && session.type === 'work'
  ).length || 0;

  const activityStats = { totalPomodoros };

  return <>{children(activityStats)}</>;
}; 