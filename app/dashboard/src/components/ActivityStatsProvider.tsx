import React from 'react';
import { useTodo } from '@/contexts/TodoContext';

interface ActivityStatsProviderProps {
  children: (activityStats: { totalXP: number; totalPomodoros: number }) => React.ReactNode;
}

export const ActivityStatsProvider: React.FC<ActivityStatsProviderProps> = ({ children }) => {
  const { userData } = useTodo();

  // Calculate activity stats from userData (same as dashboard)
  const totalXP = userData.totalXP || 0;
  const totalPomodoros = userData.pomodoroSessions?.filter(session => 
    session.completed && session.type === 'work'
  ).length || 0;

  const activityStats = { totalXP, totalPomodoros };

  return <>{children(activityStats)}</>;
}; 