import React from 'react';

interface NotificationsPageProps {
  theme?: 'clean' | 'retro';
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ theme = 'clean' }) => {
  return (
    <div className="p-8 text-center">
      <div className={
        theme === 'retro'
          ? "bg-[#d4f1ff]/30 dark:bg-[#00d4ff]/10 border-2 border-black dark:border-white rounded-2xl p-8 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] inline-block"
          : ""
      }>
        <h2 className={theme === 'retro' ? "text-2xl font-black mb-4 text-foreground" : "text-2xl font-bold mb-4"}>🔔 Notifications & Integrations</h2>
        <p className={theme === 'retro' ? "text-muted-foreground font-medium" : "text-muted-foreground"}>Connect Google Calendar, Slack, and other services to get notified on Tabbie. Coming soon</p>
      </div>
    </div>
  );
};

export default NotificationsPage;