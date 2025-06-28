"use client"

import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface DateTimePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Pick a date and time",
  className,
}: DateTimePickerProps) {
  const [time, setTime] = React.useState('09:00');
  const [is24Hour, setIs24Hour] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      selectedDate.setHours(parseInt(hours), parseInt(minutes));
      onDateChange(selectedDate);
    } else {
      onDateChange(undefined);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onDateChange(newDate);
    }
  };

  const handleQuickDate = (daysOffset: number) => {
    const [hours, minutes] = time.split(':');
    const newDate = addDays(new Date(), daysOffset);
    newDate.setHours(parseInt(hours), parseInt(minutes));
    onDateChange(newDate);
  };

  React.useEffect(() => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  }, [date]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span>{format(date, 'MMM dd, yyyy')} at {format(date, is24Hour ? 'HH:mm' : 'h:mm a')}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIs24Hour(!is24Hour)}
              className="text-xs px-2 py-1 h-7"
            >
              {is24Hour ? '24h' : 'AM/PM'}
            </Button>
          </div>
        </div>
        
        {/* Quick Date Shortcuts */}
        <div className="p-3 border-b bg-gray-50">
          <div className="text-xs font-medium text-gray-600 mb-2">Quick Select</div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(0)}
              className="h-8 px-2 text-xs flex items-center gap-1"
            >
              <span>📅</span>
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(1)}
              className="h-8 px-2 text-xs flex items-center gap-1"
            >
              <span>🌅</span>
              Tomorrow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(3)}
              className="h-8 px-2 text-xs flex items-center gap-1"
            >
              <span>📆</span>
              3 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(7)}
              className="h-8 px-2 text-xs flex items-center gap-1"
            >
              <span>🗓️</span>
              Week
            </Button>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
} 