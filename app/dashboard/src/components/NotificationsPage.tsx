import React from 'react';
import { Activity, Calendar, Smartphone, Globe, Settings, Plus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotificationsPage: React.FC = () => {
  const integrations = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      description: 'Get notified about meetings, events, and deadlines',
      status: 'available',
      features: ['Event reminders', 'Meeting notifications', 'Deadline alerts'],
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: <Calendar className="w-6 h-6 text-blue-500" />,
      description: 'Sync with Outlook calendar and email notifications',
      status: 'available',
      features: ['Calendar sync', 'Email alerts', 'Teams meetings'],
    },
    {
      id: 'apple-calendar',
      name: 'Apple Calendar',
      icon: <Calendar className="w-6 h-6 text-gray-600" />,
      description: 'Connect with iCloud calendar for seamless integration',
      status: 'coming-soon',
      features: ['iCloud sync', 'Event reminders', 'iOS notifications'],
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: <Smartphone className="w-6 h-6 text-green-600" />,
      description: 'Receive important Slack messages and mentions on Tabbie',
      status: 'coming-soon',
      features: ['Direct messages', 'Channel mentions', 'Status updates'],
    },
  ];

  const notificationTypes = [
    {
      title: 'Calendar Events',
      description: 'Meeting reminders and event notifications',
      enabled: true,
    },
    {
      title: 'Task Deadlines',
      description: 'Alerts when tasks are due soon',
      enabled: true,
    },
    {
      title: 'Wellness Reminders',
      description: 'Health and wellness notifications',
      enabled: true,
    },
    {
      title: 'System Updates',
      description: 'Tabbie software and feature updates',
      enabled: false,
    },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <Activity className="w-8 h-8 text-purple-500 inline-block mr-3" />
          Notifications & Integrations
        </h1>
        <p className="text-gray-600">
          Connect your favorite apps and services to get notified on Tabbie. 
          Stay updated with calendar events, tasks, and important messages without constant screen checking.
        </p>
      </div>

      {/* Calendar Integrations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar Integrations</h2>
        <div className="grid gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {integration.name}
                      </h3>
                      {integration.status === 'coming-soon' && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {integration.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {integration.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant={integration.status === 'available' ? "default" : "outline"}
                    size="sm"
                    disabled={integration.status === 'coming-soon'}
                    className="min-w-[100px]"
                  >
                    {integration.status === 'available' ? (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Connect
                      </>
                    ) : (
                      'Coming Soon'
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Types</h2>
        <div className="space-y-3">
          {notificationTypes.map((type, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white"
            >
              <div>
                <h3 className="font-medium text-gray-900">{type.title}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {type.enabled && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <Button
                  variant={type.enabled ? "default" : "outline"}
                  size="sm"
                  className="min-w-[80px]"
                >
                  {type.enabled ? 'Enabled' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Features */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
        <div className="flex items-start gap-4">
          <Globe className="w-8 h-8 text-purple-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Enhanced Calendar Integration
            </h3>
            <p className="text-purple-700 text-sm mb-4">
              Connect Google Calendar, Outlook, and other calendar services to get seamlessly notified 
              on Tabbie about your upcoming meetings, deadlines, and important events. 
              Say goodbye to missing important appointments!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Real-time calendar sync
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Smart meeting reminders
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Custom notification timing
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Multi-platform support
              </div>
            </div>
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
              Get Started with Calendar Integration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 