import React, { useState } from 'react';
import { Clock, Bell, Zap, Coffee, Eye, Footprints, Droplets, Plus, GripVertical, Trash2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WellnessEvent {
  id: number;
  title: string;
  icon: string;
  iconColor: string;
  frequency: number; // in minutes
  duration: number; // in seconds
  description: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  order: number;
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<WellnessEvent[]>([
    {
      id: 1,
      title: 'Drink water every 30 minutes',
      icon: 'droplets',
      iconColor: 'text-blue-500',
      frequency: 30,
      duration: 10,
      description: 'Stay hydrated throughout the day',
      enabled: true,
      priority: 'high',
      order: 1,
    },
    {
      id: 2,
      title: 'Stand up every 25 minutes',
      icon: 'footprints',
      iconColor: 'text-green-500',
      frequency: 25,
      duration: 15,
      description: 'Take a quick break to stretch and move',
      enabled: true,
      priority: 'high',
      order: 2,
    },
    {
      id: 3,
      title: 'Look away from screen (20-20-20 rule)',
      icon: 'eye',
      iconColor: 'text-purple-500',
      frequency: 20,
      duration: 20,
      description: 'Look at something 20 feet away for 20 seconds',
      enabled: false,
      priority: 'medium',
      order: 3,
    },
    {
      id: 4,
      title: 'Take a deep breath',
      icon: 'zap',
      iconColor: 'text-orange-500',
      frequency: 45,
      duration: 30,
      description: 'Practice mindful breathing for 30 seconds',
      enabled: false,
      priority: 'medium',
      order: 4,
    },
    {
      id: 5,
      title: 'Coffee break reminder',
      icon: 'coffee',
      iconColor: 'text-amber-600',
      frequency: 120,
      duration: 300,
      description: 'Time for a coffee or tea break',
      enabled: true,
      priority: 'low',
      order: 5,
    },
  ]);

  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<WellnessEvent>>({
    title: '',
    icon: 'bell',
    iconColor: 'text-blue-500',
    frequency: 30,
    duration: 15,
    description: '',
    enabled: true,
    priority: 'medium',
  });

  const iconOptions = [
    { value: 'droplets', label: 'Water Drop', icon: Droplets },
    { value: 'footprints', label: 'Footsteps', icon: Footprints },
    { value: 'eye', label: 'Eye', icon: Eye },
    { value: 'zap', label: 'Lightning', icon: Zap },
    { value: 'coffee', label: 'Coffee', icon: Coffee },
    { value: 'bell', label: 'Bell', icon: Bell },
    { value: 'clock', label: 'Clock', icon: Clock },
  ];

  const colorOptions = [
    { value: 'text-blue-500', label: 'Blue', color: 'bg-blue-500' },
    { value: 'text-green-500', label: 'Green', color: 'bg-green-500' },
    { value: 'text-purple-500', label: 'Purple', color: 'bg-purple-500' },
    { value: 'text-orange-500', label: 'Orange', color: 'bg-orange-500' },
    { value: 'text-red-500', label: 'Red', color: 'bg-red-500' },
    { value: 'text-amber-600', label: 'Amber', color: 'bg-amber-600' },
    { value: 'text-pink-500', label: 'Pink', color: 'bg-pink-500' },
  ];

  const getIconComponent = (iconName: string, className: string = 'w-5 h-5') => {
    const iconMap = {
      droplets: Droplets,
      footprints: Footprints,
      eye: Eye,
      zap: Zap,
      coffee: Coffee,
      bell: Bell,
      clock: Clock,
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Bell;
    return <IconComponent className={className} />;
  };

  const formatFrequency = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleEvent = (id: number) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, enabled: !event.enabled } : event
    ));
  };

  const deleteEvent = (id: number) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const moveEvent = (id: number, direction: 'up' | 'down') => {
    const currentIndex = events.findIndex(event => event.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= events.length) return;

    const newEvents = [...events];
    [newEvents[currentIndex], newEvents[newIndex]] = [newEvents[newIndex], newEvents[currentIndex]];
    
    // Update order values
    newEvents.forEach((event, index) => {
      event.order = index + 1;
    });
    
    setEvents(newEvents);
  };

  const createEvent = () => {
    if (!newEvent.title?.trim()) return;
    
    const event: WellnessEvent = {
      id: Date.now(),
      title: newEvent.title,
      icon: newEvent.icon || 'bell',
      iconColor: newEvent.iconColor || 'text-blue-500',
      frequency: newEvent.frequency || 30,
      duration: newEvent.duration || 15,
      description: newEvent.description || '',
      enabled: newEvent.enabled || true,
      priority: newEvent.priority || 'medium',
      order: events.length + 1,
    };

    setEvents([...events, event]);
    setNewEvent({
      title: '',
      icon: 'bell',
      iconColor: 'text-blue-500',
      frequency: 30,
      duration: 15,
      description: '',
      enabled: true,
      priority: 'medium',
    });
    setIsCreateEventOpen(false);
  };

  const sortedEvents = [...events].sort((a, b) => a.order - b.order);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            <Zap className="w-8 h-8 text-orange-500 inline-block mr-3" />
            Events & Wellness Reminders
          </h1>
          <p className="text-gray-600">
            Create and manage recurring wellness reminders. Drag to reorder priority, adjust timing and duration.
          </p>
        </div>
        
        <Sheet open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <SheetTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[600px] sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>Create New Wellness Event</SheetTitle>
              <SheetDescription>
                Set up a custom reminder to help maintain healthy habits throughout your day.
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Take a stretch break"
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the activity"
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select 
                    value={newEvent.icon} 
                    onValueChange={(value) => setNewEvent({ ...newEvent, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select 
                    value={newEvent.iconColor} 
                    onValueChange={(value) => setNewEvent({ ...newEvent, iconColor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frequency: Every {formatFrequency(newEvent.frequency || 30)}</Label>
                <Slider
                  value={[newEvent.frequency || 30]}
                  onValueChange={(value) => setNewEvent({ ...newEvent, frequency: value[0] })}
                  max={240}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 min</span>
                  <span>4 hours</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration: {formatDuration(newEvent.duration || 15)}</Label>
                <Slider
                  value={[newEvent.duration || 15]}
                  onValueChange={(value) => setNewEvent({ ...newEvent, duration: value[0] })}
                  max={600}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 sec</span>
                  <span>10 min</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newEvent.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => setNewEvent({ ...newEvent, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🔵 Low Priority</SelectItem>
                    <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                    <SelectItem value="high">🔴 High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={createEvent}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!newEvent.title?.trim()}
                >
                  Create Event
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateEventOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4">
        {sortedEvents.map((event, index) => (
          <div
            key={event.id}
            className={`
              p-6 rounded-xl border-2 transition-all duration-200 group
              ${event.enabled 
                ? 'border-green-200 bg-green-50/50 shadow-sm' 
                : 'border-gray-200 bg-gray-50'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className={`${event.iconColor}`}>
                      {getIconComponent(event.icon)}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    <Badge className={`text-xs ${getPriorityColor(event.priority)}`}>
                      {event.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Every {formatFrequency(event.frequency)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Bell className="w-4 h-4" />
                      {formatDuration(event.duration)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveEvent(event.id, 'up')}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveEvent(event.id, 'down')}
                    disabled={index === sortedEvents.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    ↓
                  </Button>
                </div>
                
                <Button
                  variant={event.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleEvent(event.id)}
                  className="min-w-[80px]"
                >
                  {event.enabled ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteEvent(event.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {sortedEvents.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg mb-2">No events created yet</p>
            <p className="text-gray-400 text-sm">Click "Create New Event" to get started with wellness reminders</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
        <h3 className="text-lg font-semibold text-orange-900 mb-2">
          🎯 Pro Tips for Better Wellness
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-orange-800">
          <div>• High priority events interrupt work more assertively</div>
          <div>• Short frequent reminders work better than long ones</div>
          <div>• Water reminders every 30 minutes are optimal</div>
          <div>• Eye breaks every 20 minutes prevent strain</div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage; 