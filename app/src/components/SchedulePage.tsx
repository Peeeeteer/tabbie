import React, { useState, useRef } from 'react';
import { useTodo } from '@/contexts/TodoContext';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  Eraser,
  SplitSquareHorizontal,
  Copy,
  ClipboardPaste,
  ArrowRight,
  Check,
  MoreHorizontal,
  Play,
  ChevronLeft,
  ChevronRight,

  Calendar as CalendarIcon,
  History,
  Coffee,
  AlertCircle
} from 'lucide-react';
import { startOfWeek, addWeeks, subWeeks, format, addDays, isSameDay, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SchedulePageProps {
  theme?: 'clean' | 'retro';
  onNavigateToPomodoro?: () => void;
}

// Constants
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const START_HOUR = 6; // 6 AM
const END_HOUR = 24; // 12 AM (Midnight)
const HOURS_COUNT = END_HOUR - START_HOUR;

// --- Helper Components ---

const DraggableTask = React.memo(({ task, theme }: { task: any, theme: string }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `task-${task.id}`,
    data: { type: 'task', task }
  });

  // Determine status icon/color
  let statusIcon = null;
  let statusColor = "text-muted-foreground";
  let statusText = "";

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const next3Days = new Date(today);
    next3Days.setDate(next3Days.getDate() + 3);

    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    if (dueDay < today) {
      statusIcon = <div className="w-2 h-2 rounded-full bg-red-500" />;
      statusColor = "text-red-500";
      statusText = "Overdue";
    } else if (dueDay.getTime() === today.getTime()) {
      statusIcon = <div className="w-2 h-2 rounded-full bg-green-500" />;
      statusColor = "text-green-500";
      statusText = "Today";
    } else if (dueDay.getTime() === tomorrow.getTime()) {
      statusIcon = <div className="w-2 h-2 rounded-full bg-yellow-500" />;
      statusColor = "text-yellow-600";
      statusText = "Tomorrow";
    } else if (dueDay <= next3Days) {
      statusIcon = <div className="w-2 h-2 rounded-full bg-blue-500" />;
      statusColor = "text-blue-500";
      statusText = "Soon";
    }
  } else {
    // Unscheduled (No Due Date)
    statusIcon = <div className="w-2 h-2 rounded-full border border-muted-foreground/50" />;
    statusColor = "text-muted-foreground";
    statusText = "Unscheduled";
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 mb-2 border shadow-sm rounded-md cursor-grab active:cursor-grabbing transition-all hover:scale-105 bg-card hover:bg-accent border-transparent hover:border-border text-sm flex flex-col gap-1 text-foreground",
        theme === 'retro' && "bg-card border-2 border-black dark:border-gray-600 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] dark:bg-slate-800 dark:text-white"
      )}
      style={transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      } : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{task.title}</span>
        {statusIcon && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {statusIcon}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{statusText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {statusText && (
        <span className={cn("text-[10px] font-medium", statusColor)}>
          {statusText}
        </span>
      )}
    </div>
  );
});
DraggableTask.displayName = 'DraggableTask';

// Removed DraggableBusyItem as requested

const TimeSlot = ({ dayIndex, hour, totalHeight, onClick }: { dayIndex: number, hour: number, totalHeight: number, onClick: () => void }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${dayIndex}-${hour}`,
    data: { dayIndex, hour }
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{ height: `${100 / HOURS_COUNT}%` }}
      className={cn(
        "border-b border-r relative transition-colors box-border cursor-cell hover:bg-accent/5",
        isOver ? "bg-primary/5" : "transparent"
      )}
    />
  );
};

const TaskCard = React.forwardRef(({
  block,
  task,
  style,
  className,
  onClick,
  onResizeStart,
  theme,
  currentTaskId,
  isTimerRunning,
  onStartPomodoro,
  attributes,
  listeners
}: any, ref: any) => {
  const duration = block.endTime - block.startTime;
  const showDetails = duration >= 30;

  return (
    <div
      ref={ref}
      {...listeners}
      {...attributes}
      data-no-drag-create="true"
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
      className={cn(
        "absolute rounded-r-md rounded-l-[2px] overflow-hidden cursor-grab active:cursor-grabbing shadow-sm transition-all flex flex-col border-y border-r bg-card hover:bg-accent/50 group/task",
        // Dark mode visibility fix
        "dark:bg-zinc-800 dark:border-zinc-700",
        // Left Accent Border
        "border-l-[3px] border-l-primary",
        theme === 'retro' && "border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:border-gray-600 dark:bg-slate-800",
        block.taskId === currentTaskId && isTimerRunning && "ring-2 ring-primary ring-offset-0 animate-pulse",
        className
      )}
      style={style}
    >
      {/* Resize Handle Top */}
      <div
        onPointerDown={(e) => onResizeStart && onResizeStart(e, block.id, 'top')}
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20 opacity-0 group-hover/task:opacity-100"
      />

      {/* Content */}
      <div className="flex flex-col px-2 py-1 h-full min-h-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="truncate font-medium text-xs leading-tight">
            {task?.title || 'Unknown Task'}
          </span>
          {block.taskId === currentTaskId && isTimerRunning && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_1px_rgba(239,68,68,0.8)] animate-pulse shrink-0" />
          )}
          {showDetails && (
            <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap shrink-0">
              {duration}m
            </span>
          )}
        </div>

        {showDetails && (
          <span className="text-[10px] text-muted-foreground/70 font-mono truncate mt-0.5">
            {Math.floor(block.startTime / 60)}:{String(block.startTime % 60).padStart(2, '0')}
            {" - "}
            {Math.floor(block.endTime / 60)}:{String(block.endTime % 60).padStart(2, '0')}
          </span>
        )}

        {/* Hover Actions */}
        <div className="opacity-0 group-hover/task:opacity-100 transition-opacity flex items-center ml-auto pl-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartPomodoro && onStartPomodoro(task);
                  }}
                >
                  <Play className="w-3 h-3 fill-current" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Start Session</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Resize Handle Bottom */}
      <div
        onPointerDown={(e) => onResizeStart && onResizeStart(e, block.id, 'bottom')}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 opacity-0 group-hover/task:opacity-100"
      />
    </div>
  );
});
TaskCard.displayName = 'TaskCard';

const TaskItem = React.memo(({
  block,
  task,
  containerStart,
  containerDuration,
  onClick,
  onResizeStart,
  onStartPomodoro,
  theme,
  isTimerRunning,
  currentTaskId
}: {
  block: any,
  task: any,
  containerStart: number,
  containerDuration: number,
  onClick: () => void,
  onResizeStart: (e: React.PointerEvent, blockId: string, direction: 'top' | 'bottom') => void,
  onStartPomodoro: (task: any) => void,
  theme: string,
  isTimerRunning: boolean,
  currentTaskId: string | null
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: { type: 'block', block }
  });

  // Calculate relative position within container
  const relativeStart = block.startTime - containerStart;
  const topPercent = (relativeStart / containerDuration) * 100;
  const heightPercent = ((block.endTime - block.startTime) / containerDuration) * 100;

  // Check if touching bottom
  const isAtBottom = (block.endTime - containerStart) >= containerDuration;

  const style: React.CSSProperties = {
    top: `${topPercent}%`,
    height: isAtBottom ? `calc(${heightPercent}% - 12px)` : `${heightPercent}%`,
    left: '4px',
    right: '4px',
    zIndex: isDragging ? 999 : 10,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1 // Hide original when dragging
  };

  return (
    <TaskCard
      ref={setNodeRef}
      block={block}
      task={task}
      style={style}
      onClick={onClick}
      onResizeStart={onResizeStart}
      onStartPomodoro={onStartPomodoro}
      theme={theme}
      currentTaskId={currentTaskId}
      isTimerRunning={isTimerRunning}
      attributes={attributes}
      listeners={listeners}
    />
  );
});
TaskItem.displayName = 'TaskItem';

const ContainerBlock = React.memo(({
  block,
  category,
  childBlocks,
  tasks,
  onResizeStart,
  onClick,
  theme,
  currentTaskId,
  isTimerRunning,
  onDistribute,
  onStartPomodoro
}: {
  block: any,
  category: any,
  childBlocks: any[],
  tasks: any[],
  onResizeStart: (e: React.PointerEvent, blockId: string, direction: 'top' | 'bottom') => void,
  onClick: (b: any) => void,
  theme: string,
  currentTaskId: string | null,
  isTimerRunning: boolean,
  onDistribute?: (blockId: string) => void,
  onStartPomodoro: (task: any) => void
}) => {
  // Container is NOT draggable anymore (as per user request)
  // const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ ... });
  const isDragging = false; // Placeholder

  // Use Droppable to detect drops specifically ON this container
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `container-${block.id}`,
    data: { type: 'container', block }
  });

  const startMinutes = block.startTime;
  const duration = block.endTime - block.startTime;
  const dayStartMinutes = START_HOUR * 60;
  const totalDayMinutes = HOURS_COUNT * 60;

  const topPercent = ((startMinutes - dayStartMinutes) / totalDayMinutes) * 100;
  const heightPercent = (duration / totalDayMinutes) * 100;

  const style: React.CSSProperties = {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    backgroundColor: block.isBusy
      ? undefined // Handled by className for dark mode support
      : (category?.color ? `${category.color}08` : '#ccc'), // Very subtle background
    border: `1px dashed ${block.isBusy ? '#9ca3af' : (category?.color || '#ccc')}`, // Dashed border for container
    zIndex: 1,
    // transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, // Removed
    backgroundImage: block.isBusy
      ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)'
      : 'none'
  };

  // Merge refs
  const setRefs = (node: HTMLElement | null) => {
    // setNodeRef(node); // Removed
    setDroppableRef(node);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={cn(
        "absolute left-0.5 right-0.5 rounded-md group transition-all",
        theme === 'retro' && "border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]",
        isOver && !isDragging && "ring-2 ring-primary ring-offset-1 bg-primary/10",
        block.isBusy && "cursor-grab active:cursor-grabbing",
        // Dark mode support for busy blocks
        block.isBusy && theme === 'retro' && "bg-[#dedede] dark:bg-slate-800 dark:border-gray-600"
      )}

      data-no-drag-create="true"
      onClick={(e) => {
        e.stopPropagation();
        onClick(block);
      }}
    >
      {/* Resize Handles for Container */}
      <div
        onPointerDown={(e) => onResizeStart(e, block.id, 'top')}
        className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-black/5 z-20"
      />

      {/* Container Label & Controls - TAB STYLE */}
      <div className="absolute -top-6 right-0 flex items-center gap-1 z-40">
        {/* Label Tab */}
        <div className="bg-background border shadow-sm rounded-t-md px-2 py-1 flex items-center gap-1 text-xs font-medium text-muted-foreground h-6">
          {block.label || category?.name || 'Container'}
        </div>

        {/* Distribute Button Tab */}
        {!block.isBusy && childBlocks.length > 0 && onDistribute && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full shadow-sm bg-background hover:bg-primary hover:text-primary-foreground border-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDistribute(block.id);
                }}
              >
                <SplitSquareHorizontal className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Distribute Tasks</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Render Child Tasks */}
      {!block.isBusy && childBlocks.map(child => (
        <TaskItem
          key={child.id}
          block={child}
          task={tasks.find(t => t.id === child.taskId)}
          containerStart={block.startTime}
          containerDuration={duration}
          onClick={() => onClick(child)}
          onResizeStart={onResizeStart}
          onStartPomodoro={onStartPomodoro}
          theme={theme}
          currentTaskId={currentTaskId}
          isTimerRunning={isTimerRunning}
        />
      ))}

      <div
        onPointerDown={(e) => onResizeStart(e, block.id, 'bottom')}
        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-black/5 z-20 flex justify-center items-end"
      >
        <div className="w-6 h-1 bg-black/10 rounded-full mb-1" />
      </div>
    </div>
  );
});
ContainerBlock.displayName = 'ContainerBlock';

// Droppable Slot Component
// Droppable Slot Component
const DroppableTimeSlot = ({ dayIndex, hour, minute, children }: { dayIndex: number, hour: number, minute: number, children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${dayIndex}-${hour}-${minute}`,
    data: { dayIndex, hour, minute }
  });

  return (
    <div ref={setNodeRef} className={cn(
      "h-[15px] border-r border-muted/50 relative",
      minute === 45 ? "border-b border-dashed" : "", // Only show border at end of hour
      isOver && "bg-primary/5"
    )}>
      {children}
    </div>
  );
};

// Sidebar Droppable Component
const SidebarDroppable = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'sidebar-unschedule',
    data: { type: 'sidebar' }
  });

  return (
    <div ref={setNodeRef} className={cn("h-full transition-colors", isOver && "bg-destructive/10 ring-2 ring-inset ring-destructive")}>
      {children}
    </div>
  );
};

const SchedulePage: React.FC<SchedulePageProps> = ({ theme = 'clean', onNavigateToPomodoro }) => {
  const {
    userData,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    currentTaskId,
    pomodoroTimer,
    startPomodoro,
    stopPomodoro,
    updateUserNotes
  } = useTodo();

  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [dragPreviewTime, setDragPreviewTime] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showLive, setShowLive] = useState(true);

  // Date Navigation State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handlePrevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const handleToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekRangeStr = `${format(currentWeekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false); // Track resize state to prevent click

  // Category Selection
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tabbie_schedule_filter') || 'all';
    }
    return 'all';
  });

  // Persist category selection
  React.useEffect(() => {
    localStorage.setItem('tabbie_schedule_filter', selectedCategory);
  }, [selectedCategory]);

  // New Block Creation State
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [newBlockDay, setNewBlockDay] = useState<number>(0);
  const [newBlockStart, setNewBlockStart] = useState<number>(0);
  const [newBlockCategory, setNewBlockCategory] = useState<string>('');
  const [newBlockEndTimeStr, setNewBlockEndTimeStr] = useState("10:00");

  // Clipboard State
  const [copiedDayBlocks, setCopiedDayBlocks] = useState<{ startTime: number, endTime: number, categoryId: string }[] | null>(null);

  // Resizing State
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<'top' | 'bottom' | null>(null);
  const [initialResizeY, setInitialResizeY] = useState<number>(0);

  const [initialBlockData, setInitialBlockData] = useState<{ start: number, end: number } | null>(null);
  const [resizeStatus, setResizeStatus] = useState<{ time: string, x: number, y: number } | null>(null);

  // Dialog State
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string>("");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("10:00");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // --- Handlers ---

  // --- HELPER FUNCTIONS ---

  const getBlockDuration = (block: any) => block.endTime - block.startTime;

  // Move a block by a delta (minutes). If it's a container, move its children too.
  // Returns the modified blocks (does not save to state immediately, returns for batching)
  const calculateMove = (blockId: string, delta: number, currentBlocks: any[]): any[] => {
    const block = currentBlocks.find(b => b.id === blockId);
    if (!block) return [];

    const updates: any[] = [];

    // Move the block itself
    updates.push({ ...block, startTime: block.startTime + delta, endTime: block.endTime + delta });

    // If container, move children
    const isContainer = !block.taskId && !block.isBusy;
    if (isContainer) {
      const children = currentBlocks.filter(b =>
        b.taskId &&
        b.categoryId === block.categoryId &&
        b.startTime >= block.startTime &&
        b.endTime <= block.endTime
      );

      children.forEach(child => {
        updates.push({ ...child, startTime: child.startTime + delta, endTime: child.endTime + delta });
      });
    }

    return updates;
  };

  // Resolve overlaps by pushing blocks down (Ripple Effect)
  // Only pushes blocks that are collided with. Preserves gaps if no collision.
  const resolveOverlaps = (changedBlocks: any[], allBlocks: any[]) => {
    // 1. Merge changed blocks into a working copy of allBlocks
    let workingBlocks = allBlocks.map(b => {
      const change = changedBlocks.find(cb => cb.id === b.id);
      return change || b;
    });

    // 2. Identify Top Level Blocks (Containers, Busy, Orphans)
    // We only check collisions between these. Nested tasks move with their parents.
    const isTopLevel = (b: any) => {
      if (b.isBusy) return true; // Busy is always top level
      if (!b.taskId) return true; // Container is top level

      // Task: Is it orphan?
      // Check if it's inside a container in the WORKING set
      const parent = workingBlocks.find(p =>
        !p.taskId && !p.isBusy &&
        p.categoryId === b.categoryId &&
        p.startTime <= b.startTime &&
        p.endTime >= b.endTime
      );
      return !parent; // If no parent, it's top level
    };

    // We need to sort by startTime. 
    // But we need to process the "Source of Push" first? 
    // No, just sort all Top Level blocks by startTime.
    // Iterate and if Prev overlaps Next, push Next.

    // We might need multiple passes or a recursive approach if a push causes another push.
    // A simple sorted iteration works for "Push Down" (increasing time).

    let hasOverlap = true;
    let iterations = 0;

    // We only need one pass if we sort correctly, but let's be safe.
    while (hasOverlap && iterations < 10) {
      hasOverlap = false;
      iterations++;

      const topLevel = workingBlocks.filter(isTopLevel).sort((a, b) => a.startTime - b.startTime);

      for (let i = 0; i < topLevel.length - 1; i++) {
        const current = topLevel[i];
        const next = topLevel[i + 1];

        if (current.endTime > next.startTime) {
          // Collision!
          hasOverlap = true;
          const overlapAmount = current.endTime - next.startTime;

          // Move 'next' (and its children) down
          const moves = calculateMove(next.id, overlapAmount, workingBlocks);

          // Apply moves to workingBlocks
          workingBlocks = workingBlocks.map(b => {
            const move = moves.find(m => m.id === b.id);
            return move || b;
          });

          // Update 'next' reference in our local sorted array so the next iteration uses new time
          // (Actually, we should break and restart sort, or update the object in place)
          // Let's update the object in the 'topLevel' array to continue the chain in this pass
          const nextIndex = topLevel.indexOf(next);
          if (nextIndex !== -1) {
            topLevel[nextIndex] = workingBlocks.find(b => b.id === next.id);
          }
        }
      }
    }

    return workingBlocks;
  };

  // --- Handlers ---

  const handleResizeStart = (e: React.PointerEvent, blockId: string, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;

    const block = userData.timeBlocks?.find(b => b.id === blockId);
    if (!block) return;

    setResizingBlockId(blockId);
    setResizeDirection(direction);
    setInitialResizeY(e.clientY);
    setInitialBlockData({ start: block.startTime, end: block.endTime });

    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizingBlockId || !initialBlockData || !containerRef.current) return;

    const deltaY = e.clientY - initialResizeY;
    const containerHeight = containerRef.current.clientHeight;
    const minutesPerPixel = (HOURS_COUNT * 60) / containerHeight;
    const deltaMinutes = Math.round(deltaY * minutesPerPixel / 15) * 15;

    let newStart = initialBlockData.start;
    let newEnd = initialBlockData.end;

    const block = userData.timeBlocks?.find(b => b.id === resizingBlockId);
    if (!block) return;

    // TASK RESIZING: Clamp to Container (No Push)
    if (block.taskId) {
      const container = (userData.timeBlocks || []).find(b =>
        !b.taskId && !b.isBusy &&
        b.categoryId === block.categoryId &&
        b.startTime <= block.startTime &&
        b.endTime >= block.endTime
      );

      if (resizeDirection === 'top') {
        newStart = Math.min(initialBlockData.start + deltaMinutes, initialBlockData.end - 15);
        if (container) newStart = Math.max(container.startTime, newStart);
      } else {
        newEnd = Math.max(initialBlockData.end + deltaMinutes, initialBlockData.start + 15);
        if (container) newEnd = Math.min(container.endTime, newEnd);
      }

      updateTimeBlock(resizingBlockId, { startTime: newStart, endTime: newEnd });

      const timeStr = resizeDirection === 'top'
        ? `${Math.floor(newStart / 60)}:${String(newStart % 60).padStart(2, '0')}`
        : `${Math.floor(newEnd / 60)}:${String(newEnd % 60).padStart(2, '0')}`;

      setResizeStatus({
        time: timeStr,
        x: e.clientX,
        y: e.clientY
      });
      return;
    }

    // CONTAINER/BUSY RESIZING
    if (resizeDirection === 'top') {
      newStart = Math.min(initialBlockData.start + deltaMinutes, initialBlockData.end - 15);
      newStart = Math.max(START_HOUR * 60, newStart);
    } else {
      newEnd = Math.max(initialBlockData.end + deltaMinutes, initialBlockData.start + 15);
      newEnd = Math.min(END_HOUR * 60, newEnd);
    }

    // Apply Resize
    // If we resize a container, we just update it. Children stay put (absolute time).
    // If we shrink it past children, they might become orphans (which is fine, logic handles orphans).
    // But we need to resolve overlaps for blocks BELOW.

    const resizedBlock = { ...block, startTime: newStart, endTime: newEnd };

    // Resolve Overlaps (Push Down)
    // FIX: Only resolve overlaps for the current day to prevent cross-day ripple
    const allBlocks = userData.timeBlocks || [];
    const dayBlocks = allBlocks.filter(b => b.dayOfWeek === block.dayOfWeek);
    const resolvedBlocks = resolveOverlaps([resizedBlock], dayBlocks);

    // Apply all changes
    // We need to batch update. Since we don't have a batch update method in context,
    // we'll iterate. (Performance warning, but fine for small schedule).
    // Ideally context should have setTimeBlocks.
    // For now, let's just update the ones that changed.

    resolvedBlocks.forEach(b => {
      const original = allBlocks.find(o => o.id === b.id);
      if (original && (original.startTime !== b.startTime || original.endTime !== b.endTime)) {
        updateTimeBlock(b.id, { startTime: b.startTime, endTime: b.endTime });
      }
    });

    const timeStr = resizeDirection === 'top'
      ? `${Math.floor(newStart / 60)}:${String(newStart % 60).padStart(2, '0')}`
      : `${Math.floor(newEnd / 60)}:${String(newEnd % 60).padStart(2, '0')}`;

    setResizeStatus({
      time: timeStr,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    setResizingBlockId(null);
    setResizeDirection(null);
    setInitialBlockData(null);
    setResizeStatus(null);
    (e.target as Element).releasePointerCapture(e.pointerId);

    // Reset ref after a short delay to ensure onClick is skipped
    setTimeout(() => {
      isResizingRef.current = false;
    }, 100);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'task') {
      setActiveDragItem({ type: 'task', data: event.active.data.current?.task });
    } else if (event.active.data.current?.type === 'busy') {
      setActiveDragItem({ type: 'busy' });
    } else if (event.active.data.current?.type === 'block') {
      setActiveDragItem({ type: 'block', data: event.active.data.current?.block });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    if (!over) {
      setDragPreviewTime(null);
      return;
    }

    let minutes = 0;

    if (over.data.current?.dayIndex !== undefined) {
      const slotData = over.data.current;
      const m = slotData.minute || 0;
      minutes = slotData.hour * 60 + m;
    } else if (over.data.current?.type === 'container') {
      const containerBlock = over.data.current.block;
      if (active.rect.current?.translated && over.rect) {
        const containerTop = over.rect.top;
        const dropTop = active.rect.current.translated.top;
        const relativeY = dropTop - containerTop;
        const containerHeight = over.rect.height;
        const containerDuration = containerBlock.endTime - containerBlock.startTime;
        const minutesOffset = (relativeY / containerHeight) * containerDuration;
        const snappedOffset = Math.round(minutesOffset / 15) * 15;
        minutes = Math.max(containerBlock.startTime, containerBlock.startTime + snappedOffset);
      } else {
        minutes = containerBlock.startTime;
      }
    } else {
      setDragPreviewTime(null);
      return;
    }

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    setDragPreviewTime(`${h}:${String(m).padStart(2, '0')}`);
  };



  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    // Handle Drag to Sidebar (Unschedule)
    if (over.id === 'sidebar-unschedule') {
      if (active.data.current?.type === 'block') {
        const blockId = active.data.current.block.id;
        if (confirm("Unschedule this task?")) {
          deleteTimeBlock(blockId);
        }
      }
      return;
    }

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    let proposedStart = 0;
    let proposedEnd = 0;
    let dayIndex = 0;

    if (over.data.current?.dayIndex !== undefined) {
      const slotData = over.data.current;
      dayIndex = slotData.dayIndex;
      const minute = slotData.minute || 0;
      proposedStart = slotData.hour * 60 + minute;
      proposedEnd = proposedStart + 60; // Default 1h duration for new items
    } else if (overType === 'container') {
      const containerBlock = over.data.current?.block;
      dayIndex = containerBlock.dayOfWeek;

      // PRECISE DROP POSITIONING
      // Strategy: Use the `active.rect.current.translated` (final position)
      // and compare it to `over.rect` (container position).

      if (active.rect.current?.translated && over.rect) {
        const containerTop = over.rect.top;
        const dropTop = active.rect.current.translated.top;
        const relativeY = dropTop - containerTop;

        // Convert pixels to minutes
        // We know the container height corresponds to its duration
        const containerHeight = over.rect.height;
        const containerDuration = containerBlock.endTime - containerBlock.startTime;

        const minutesOffset = (relativeY / containerHeight) * containerDuration;

        // Snap to 15m
        const snappedOffset = Math.round(minutesOffset / 15) * 15;

        proposedStart = containerBlock.startTime + snappedOffset;

        // Clamp start to container start
        proposedStart = Math.max(proposedStart, containerBlock.startTime);
      } else {
        // Fallback
        proposedStart = containerBlock.startTime;
      }

      // For existing blocks, preserve duration
      if (activeType === 'block') {
        const block = active.data.current?.block;
        const duration = block.endTime - block.startTime;
        proposedEnd = proposedStart + duration;
      } else {
        proposedEnd = proposedStart + 60; // Default
      }

    } else {
      return;
    }

    let blockId = '';
    let categoryId = '';
    let taskId = '';
    let isBusy = false;
    let label = '';

    if (activeType === 'task') {
      const task = active.data.current?.task;
      taskId = task.id;
      categoryId = task.categoryId;
      const duration = (task.estimatedPomodoros || 2) * 30;
      proposedEnd = proposedStart + duration;
    } else if (activeType === 'busy') {
      isBusy = true;
      label = 'BUSY';
      categoryId = 'busy';
      proposedEnd = proposedStart + 60;
    } else if (activeType === 'block') {
      const block = active.data.current?.block;
      blockId = block.id;
      categoryId = block.categoryId;
      taskId = block.taskId;
      isBusy = block.isBusy;
      label = block.label;
      // Duration already handled above for precise positioning
    }

    // --- LOGIC ---

    const allBlocks = userData.timeBlocks || [];
    const existingBlocks = allBlocks.filter(b => b.dayOfWeek === dayIndex && b.id !== blockId);

    // 1. Check for Container Drop (Nesting)
    const targetContainer = existingBlocks.find(b =>
      !b.taskId && !b.isBusy &&
      (
        (proposedStart >= b.startTime && proposedStart < b.endTime) ||
        (proposedEnd > b.startTime && proposedEnd <= b.endTime) ||
        (proposedStart <= b.startTime && proposedEnd >= b.endTime)
      )
    );

    if (targetContainer) {
      if (activeType === 'task' || (activeType === 'block' && taskId)) {
        // STRICT CATEGORY CHECK
        if (targetContainer.categoryId !== categoryId) {
          alert(`Category Mismatch!`);
          return;
        }

        // LOGIC SPLIT:
        // 1. NEW TASKS (from sidebar) -> Auto-Distribute / Smart Fill
        // 2. EXISTING BLOCKS (moving) -> Preserve Duration / Clamp (Independent Move)

        if (activeType === 'task') {
          // --- NEW TASK LOGIC (Auto-Fill / Distribute) ---

          // Find existing tasks in this container
          const childTasks = existingBlocks.filter(b =>
            b.taskId &&
            b.categoryId === targetContainer.categoryId &&
            b.startTime >= targetContainer.startTime &&
            b.endTime <= targetContainer.endTime
          ).sort((a, b) => a.startTime - b.startTime);

          // AUTO-DISTRIBUTE LOGIC (If 2+ tasks total)
          // User wants to split even if it's just the 2nd task
          if (childTasks.length >= 1) {
            const containerDuration = targetContainer.endTime - targetContainer.startTime;
            const totalTasks = childTasks.length + 1; // Existing + New
            const gap = 15; // 15 minutes gap (User requested 15-20)
            const totalGap = (totalTasks - 1) * gap;
            const availableTime = containerDuration - totalGap;

            if (availableTime > 0) {
              // Calculate duration per task (floor to nearest minute, or maybe 5m?)
              // Let's keep it simple.
              const taskDuration = Math.floor(availableTime / totalTasks);

              // 1. Update Existing Tasks
              let cursor = targetContainer.startTime;
              childTasks.forEach(child => {
                const newStart = cursor;
                const newEnd = cursor + taskDuration;
                updateTimeBlock(child.id, { startTime: newStart, endTime: newEnd });
                cursor = newEnd + gap;
              });

              // 2. Add New Task at the end
              proposedStart = cursor;
              proposedEnd = cursor + taskDuration;

              addTimeBlock(categoryId, dayIndex, proposedStart, proposedEnd, taskId, label, isBusy);
              return;
            }
          }

          // SMART AUTO-FILL LOGIC (Fallback)
          const lastTaskEnd = childTasks.length > 0
            ? Math.max(...childTasks.map(t => t.endTime))
            : targetContainer.startTime;

          let newStart = lastTaskEnd;
          let newEnd = targetContainer.endTime;

          if (newStart >= newEnd) {
            alert("Container is full!");
            return;
          }

          proposedStart = newStart;
          proposedEnd = newEnd;

          addTimeBlock(categoryId, dayIndex, proposedStart, proposedEnd, taskId, label, isBusy);

        } else {
          // --- EXISTING BLOCK LOGIC (Move / Clamp) ---
          // Preserve duration, just clamp to container bounds
          // proposedStart is already calculated precisely above

          // Clamp Start
          proposedStart = Math.max(proposedStart, targetContainer.startTime);

          // Clamp End (ensure it doesn't exceed container)
          proposedEnd = Math.min(proposedEnd, targetContainer.endTime);

          // If clamping end made it invalid (start >= end), push start back?
          if (proposedEnd <= proposedStart) {
            // Try to keep minimum 15m
            proposedStart = Math.max(targetContainer.startTime, proposedEnd - 15);
          }

          updateTimeBlock(blockId, { dayOfWeek: dayIndex, startTime: proposedStart, endTime: proposedEnd });
        }

        return; // Done
      }
    } else {
      // If dropping a TASK on empty space (no container), REJECT IT
      // Tasks MUST go into containers (unless they are orphans, but we prefer containers)
      // Wait, user might want to create a new block + task?
      // Current logic: If dropping on empty slot, create a CONTAINER for it?
      // Or just an orphan task?
      // Let's allow orphan tasks for now, but maybe wrap them?
      // For now, standard behavior:

      if (activeType === 'block') {
        updateTimeBlock(blockId, { dayOfWeek: dayIndex, startTime: proposedStart, endTime: proposedEnd });
      } else {
        // Create new block (orphan or container?)
        // Let's create it as a container-less block (orphan)
        addTimeBlock(categoryId, dayIndex, proposedStart, proposedEnd, taskId, label, isBusy);
      }
    }
  };


  const handleBlockClick = (block: any) => {
    if (resizingBlockId || isResizingRef.current) return;

    setEditingBlock(block.id);
    setEditCategory(block.categoryId || "");
    const startH = Math.floor(block.startTime / 60).toString().padStart(2, '0');
    const startM = (block.startTime % 60).toString().padStart(2, '0');
    const endH = Math.floor(block.endTime / 60).toString().padStart(2, '0');
    const endM = (block.endTime % 60).toString().padStart(2, '0');
    setEditStartTime(`${startH}:${startM}`);
    setEditEndTime(`${endH}:${endM}`);
  };

  const handleSaveEdit = () => {
    if (!editingBlock) return;

    const [startH, startM] = editStartTime.split(':').map(Number);
    const [endH, endM] = editEndTime.split(':').map(Number);

    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    if (endTime <= startTime) {
      alert("End time must be after start time");
      return;
    }

    updateTimeBlock(editingBlock, { startTime, endTime, categoryId: editCategory });
    setEditingBlock(null);
  };

  const handleDeleteBlock = () => {
    if (editingBlock) {
      deleteTimeBlock(editingBlock);
      setEditingBlock(null);
    }
  };

  const handleStartPomodoro = () => {
    if (!editingBlock) return;

    // Save changes first
    const [startH, startM] = editStartTime.split(':').map(Number);
    const [endH, endM] = editEndTime.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    if (endTime > startTime) {
      updateTimeBlock(editingBlock, { startTime, endTime, categoryId: editCategory });
    }

    const block = userData.timeBlocks?.find(b => b.id === editingBlock);
    if (block && block.taskId) {
      const task = userData.tasks?.find(t => t.id === block.taskId);
      if (task) {
        startPomodoro(task);
        // In a real app, we might navigate here. 
        // Assuming the user can see the timer elsewhere or it's global.
        onNavigateToPomodoro && onNavigateToPomodoro();
      }
    }
    setEditingBlock(null);
  };

  // --- Creation & Copy Logic ---

  const handleSlotClick = (dayIndex: number, hour: number) => {
    setNewBlockDay(dayIndex);
    setNewBlockStart(hour * 60);

    // Set default end time (1 hour later)
    const endH = (hour + 1).toString().padStart(2, '0');
    setNewBlockEndTimeStr(`${endH}:00`);

    // Pick first category as default
    if (userData.categories.length > 0) {
      setNewBlockCategory(userData.categories[0].id);
    }

    // AUTO-CREATE (No Dialog) per user request to reduce friction
    // If we want to allow editing immediately, we could setEditingBlock(newId)
    // But for now, let's just create it.
    const endTime = (hour + 1) * 60;
    if (userData.categories.length > 0) {
      addTimeBlock(userData.categories[0].id, dayIndex, hour * 60, endTime);
    }
    // setIsCreatingBlock(true); // OLD: Open dialog
  };

  const handleCreateBlock = () => {
    if (!newBlockCategory) return;

    const [endH, endM] = newBlockEndTimeStr.split(':').map(Number);
    const endTime = endH * 60 + endM;

    if (endTime <= newBlockStart) {
      alert("End time must be after start time");
      return;
    }

    addTimeBlock(newBlockCategory, newBlockDay, newBlockStart, endTime);
    setIsCreatingBlock(false);
  };

  const copySchedule = (dayIndex: number) => {
    const blocks = (userData.timeBlocks || []).filter(b => b.dayOfWeek === dayIndex);
    const simpleBlocks = blocks.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
      categoryId: b.categoryId
    }));
    setCopiedDayBlocks(simpleBlocks);
  };

  const pasteSchedule = (dayIndex: number) => {
    if (!copiedDayBlocks) return;

    // Clear current day
    const blocksToRemove = (userData.timeBlocks || [])
      .filter(b => b.dayOfWeek === dayIndex)
      .map(b => b.id);
    blocksToRemove.forEach(id => deleteTimeBlock(id));

    // Add new blocks
    copiedDayBlocks.forEach(b => {
      addTimeBlock(b.categoryId, dayIndex, b.startTime, b.endTime);
    });
  };

  const clearDay = (dayIndex: number) => {
    const blocksToRemove = (userData.timeBlocks || [])
      .filter(b => b.dayOfWeek === dayIndex)
      .map(b => b.id);
    blocksToRemove.forEach(id => deleteTimeBlock(id));
  };

  // Helper to split day for a specific day index
  const splitDay = (dayIndex: number, parts: number) => {
    // 1. Identify Busy Blocks (we keep these)
    const busyBlocks = (userData.timeBlocks || [])
      .filter(b => b.dayOfWeek === dayIndex && b.isBusy)
      .sort((a, b) => a.startTime - b.startTime);

    // 2. Clear non-busy blocks
    const blocksToRemove = (userData.timeBlocks || [])
      .filter(b => b.dayOfWeek === dayIndex && !b.isBusy)
      .map(b => b.id);
    blocksToRemove.forEach(id => deleteTimeBlock(id));

    // 3. Define Working Hours
    const startWork = 9 * 60; // 09:00
    const endWork = 17 * 60;  // 17:00

    // 4. Calculate Available Time Ranges
    let availableRanges: { start: number, end: number }[] = [];
    let cursor = startWork;

    busyBlocks.forEach(busy => {
      if (busy.startTime > cursor) {
        availableRanges.push({ start: cursor, end: busy.startTime });
      }
      cursor = Math.max(cursor, busy.endTime);
    });

    if (cursor < endWork) {
      availableRanges.push({ start: cursor, end: endWork });
    }

    // 5. Distribute Parts into Available Ranges
    // Calculate total available minutes
    const totalAvailableMinutes = availableRanges.reduce((acc, range) => acc + (range.end - range.start), 0);

    if (totalAvailableMinutes <= 0) return; // No time available

    // We want to split the available time into `parts` chunks roughly.
    // Strategy: Fill ranges sequentially with chunks.

    const targetChunkDuration = Math.floor(totalAvailableMinutes / parts);
    const categories = userData.categories;
    let categoryIndex = 0;

    availableRanges.forEach(range => {
      let rangeCursor = range.start;
      while (rangeCursor < range.end) {
        // Determine chunk size: try to fit targetChunkDuration, but clamp to range end
        let chunkSize = targetChunkDuration;

        // If remaining space is too small, just extend the last block or ignore (simplified: just take what's left if < chunk)
        if (range.end - rangeCursor < 30) break; // Too small

        const proposedEnd = Math.min(rangeCursor + chunkSize, range.end);

        // Add Block
        const category = categories[categoryIndex % categories.length];
        addTimeBlock(category.id, dayIndex, rangeCursor, proposedEnd);

        categoryIndex++;
        rangeCursor = proposedEnd;
      }
    });
  };

  const handleDistributeTasks = (containerBlockId: string) => {
    const container = userData.timeBlocks?.find(b => b.id === containerBlockId);
    if (!container) return;

    const children = userData.timeBlocks?.filter(b =>
      b.taskId &&
      b.categoryId === container.categoryId &&
      b.startTime >= container.startTime &&
      b.endTime <= container.endTime
    ).sort((a, b) => a.startTime - b.startTime);

    if (!children || children.length < 2) return;

    const containerDuration = container.endTime - container.startTime;
    const gap = 10; // 10 minutes
    const totalGap = (children.length - 1) * gap;
    const availableTime = containerDuration - totalGap;

    if (availableTime <= 0) return; // Too many tasks / too small container

    const taskDuration = Math.floor(availableTime / children.length);

    let cursor = container.startTime;
    children.forEach((child) => {
      const newStart = cursor;
      const newEnd = cursor + taskDuration;

      if (child.startTime !== newStart || child.endTime !== newEnd) {
        updateTimeBlock(child.id, { startTime: newStart, endTime: newEnd });
      }

      cursor = newEnd + gap;
    });
  };

  // Calculate current time position
  const now = currentTime;
  const currentDayIndex = (now.getDay() + 6) % 7; // Mon=0, Sun=6
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayStartMinutes = START_HOUR * 60;
  const totalDayMinutes = HOURS_COUNT * 60;
  const currentTimePercent = ((currentMinutes - dayStartMinutes) / totalDayMinutes) * 100;
  const isWithinView = currentMinutes >= dayStartMinutes && currentMinutes <= (END_HOUR * 60);

  // --- Drag to Create Logic ---
  const [isCreating, setIsCreating] = useState(false);
  const [creationStart, setCreationStart] = useState<{ dayIndex: number, time: number } | null>(null);
  const [creationEnd, setCreationEnd] = useState<number | null>(null);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [newBlockLabel, setNewBlockLabel] = useState("");

  const handleGridPointerDown = (e: React.PointerEvent, dayIndex: number, hour: number) => {
    // Only start if clicking on empty space (not on a block)
    // We rely on event bubbling: blocks stop propagation.
    if (resizingBlockId) return;

    // Double check target to be safe
    if ((e.target as HTMLElement).closest('[data-no-drag-create]')) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // FIX: Use fixed pixel height (1px = 1min) and account for 40px header
    // The grid rows are h-[60px], so 60px = 60min => 1px = 1min.
    const headerHeight = 40;
    const relativeY = e.clientY - containerRect.top + containerRef.current!.scrollTop;
    const gridY = Math.max(0, relativeY - headerHeight);
    const minutes = Math.floor(gridY) + (START_HOUR * 60);

    // Snap to 15m
    const snappedStart = Math.round(minutes / 15) * 15;

    setIsCreating(true);
    setCreationStart({ dayIndex, time: snappedStart });
    setCreationEnd(snappedStart + 60); // Default 1h visual
    setNewBlockLabel(""); // Reset label

    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (!isCreating || !creationStart || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const headerHeight = 40;
    const relativeY = e.clientY - containerRect.top + containerRef.current.scrollTop;
    const gridY = Math.max(0, relativeY - headerHeight);
    const minutes = Math.floor(gridY) + (START_HOUR * 60);
    const snappedEnd = Math.round(minutes / 15) * 15;

    setCreationEnd(snappedEnd); // Allow dragging up or down
  };

  const handleGridPointerUp = (e: React.PointerEvent) => {
    if (!isCreating) return;

    setIsCreating(false);
    (e.target as Element).releasePointerCapture(e.pointerId);

    // Open Category Selection
    setShowCategorySelect(true);
  };

  const handleCreateFromDrag = (categoryId: string, isBusy: boolean = false) => {
    if (creationStart && creationEnd) {
      // If label is provided, use it. If not, it's a standard category block.
      // Actually, user wants "whatever text user wants" to replace "block time".
      // So if they type a label, we should probably treat it as a "Busy" block OR a labeled category block.
      // Let's make it a labeled category block if category is selected.
      // Or if they want a "Busy" block, maybe we add a "Busy" option in the modal?
      // The user said "remove the block time thing as it will serve that purpose".
      // So we pass the label to addTimeBlock.

      // We need to update addTimeBlock to accept label for non-busy blocks too?
      // Yes, we updated TodoContext earlier to accept label.

      // Handle upward drag (swap start/end if needed)
      const finalStart = Math.min(creationStart.time, creationEnd);
      const finalEnd = Math.max(creationStart.time, creationEnd);

      // Ensure at least 15m duration
      const duration = Math.max(15, finalEnd - finalStart);
      const adjustedEnd = finalStart + duration;

      const dateStr = format(addDays(currentWeekStart, creationStart.dayIndex), 'yyyy-MM-dd');
      addTimeBlock(categoryId, creationStart.dayIndex, finalStart, adjustedEnd, undefined, newBlockLabel || undefined, isBusy, dateStr);
    }
    setShowCategorySelect(false);
    setCreationStart(null);
    setCreationEnd(null);
    setNewBlockLabel("");
  };

  // --- Render ---

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
      <div className="h-full flex flex-col overflow-hidden max-h-screen bg-background"
        onPointerMove={(e) => {
          if (resizingBlockId) handleResizeMove(e);
          if (isCreating) handleGridPointerMove(e);
        }}
        onPointerUp={(e) => {
          if (resizingBlockId) handleResizeEnd(e);
          if (isCreating) handleGridPointerUp(e);
        }}>

        {/* --- Toolbar / Header --- */}
        <div className="flex items-center justify-between px-4 py-2 border-b shrink-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 z-10">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
              <p className="text-muted-foreground">Plan your weekly routine</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Week Navigation */}
              <div className="flex items-center gap-2 bg-card border rounded-md p-1 shadow-sm">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-2 text-sm font-medium min-w-[140px] text-center flex items-center justify-center gap-2 cursor-pointer hover:bg-accent/50 rounded py-1" onClick={handleToday}>
                  <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  {weekRangeStr}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                <Button
                  variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs h-7"
                >
                  All
                </Button>
                {userData.categories.map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="text-xs h-7 gap-1.5 px-2"
                    style={selectedCategory === cat.id ? { backgroundColor: `${cat.color}20`, color: cat.color } : {}}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Today
                </Button>
                <Button
                  variant={showLive ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowLive(!showLive)}
                  className={cn("gap-2", showLive && "bg-red-500/10 text-red-500 border-red-500/20")}
                >
                  <div className={cn("w-2 h-2 rounded-full bg-red-500", showLive && "animate-pulse")} />
                  {showLive ? "Live On" : "Live Off"}
                </Button>
                <Button
                  variant={showHistory ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn("gap-2", showHistory && "bg-primary/10 text-primary border-primary/20")}
                >
                  <History className="w-4 h-4" />
                  {showHistory ? "Hide History" : "Show History"}
                </Button>
                <div className="flex items-center rounded-md border bg-background shadow-sm">
                  <Button variant="outline" size="sm" onClick={onNavigateToPomodoro} className="gap-2 hidden md:flex">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Focus Mode
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Main Calendar Grid */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto relative select-none"
              onPointerMove={handleGridPointerMove}
              onPointerUp={handleGridPointerUp}
            >
              {/* Header Row Removed as per user request */}

              {/* Body Row (Time + Days) */}
              <div className="flex min-h-0">
                {/* Time Labels */}
                <div className="w-16 shrink-0 border-r bg-background sticky left-0 z-30">
                  <div className="h-10 border-b bg-muted/50 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    Time
                  </div>
                  {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                    <div key={i} className="h-[60px] border-b text-xs text-muted-foreground p-1 text-right pr-2 relative">
                      <span className="-top-2 relative bg-background px-1">
                        {String(START_HOUR + i).padStart(2, '0')}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Days Columns */}
                {DAYS.map((day, dayIndex) => (
                  <div key={day} className="flex-1 border-r min-w-[120px] relative group/col">
                    {/* Header */}
                    <div className={cn(
                      "h-10 border-b bg-muted/50 flex items-center justify-between px-2 font-medium text-sm sticky top-0 z-20 backdrop-blur",
                      dayIndex === currentDayIndex && "bg-primary/5 text-primary"
                    )}>
                      <span>{format(addDays(currentWeekStart, dayIndex), 'EEE d')}</span>
                      <div className="flex gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 data-[state=open]:bg-accent">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => splitDay(dayIndex, 2)}>
                              <SplitSquareHorizontal className="mr-2 h-4 w-4" /> Split into 2
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => splitDay(dayIndex, 3)}>
                              <SplitSquareHorizontal className="mr-2 h-4 w-4" /> Split into 3
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              copySchedule(dayIndex);
                              alert(`Copied ${day}'s schedule!`);
                            }}>
                              <Copy className="mr-2 h-4 w-4" /> Copy Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              if (confirm(`Paste schedule to ${day}? This will overwrite existing blocks.`)) {
                                pasteSchedule(dayIndex);
                              }
                            }}>
                              <ClipboardPaste className="mr-2 h-4 w-4" /> Paste Schedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (confirm(`Clear all tasks for ${day}?`)) {
                                  clearDay(dayIndex);
                                }
                              }}>
                              <Eraser className="mr-2 h-4 w-4" /> Clear Day
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>



                    {/* Grid Slots */}
                    <div className="relative h-[calc(100%-40px)]"
                      onPointerDown={(e) => handleGridPointerDown(e, dayIndex, 0)}>
                      {/* Background Lines / Droppable Slots */}
                      {Array.from({ length: HOURS_COUNT * 4 }).map((_, i) => {
                        const hour = START_HOUR + Math.floor(i / 4);
                        const minute = (i % 4) * 15;
                        return (
                          <DroppableTimeSlot key={i} dayIndex={dayIndex} hour={hour} minute={minute}>
                            {null}
                          </DroppableTimeSlot>
                        );
                      })}

                      {/* Current Time Line - ONLY ON CURRENT DAY */}
                      {dayIndex === currentDayIndex && isWithinView && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-50 pointer-events-none flex items-center"
                          style={{ top: currentTimePercent + "%" }}
                        >
                          <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
                          <div className="absolute right-0 text-[10px] font-bold text-red-500 bg-background/80 px-1 rounded-l-sm">
                            {Math.floor(currentMinutes / 60)}:{String(currentMinutes % 60).padStart(2, '0')}
                          </div>
                        </div>
                      )}

                      {/* Creation Preview Block */}
                      {isCreating && creationStart?.dayIndex === dayIndex && creationEnd && (
                        <div className="absolute left-1 right-1 bg-primary/20 border-2 border-primary border-dashed rounded-md z-50 pointer-events-none flex items-center justify-center text-xs font-bold text-primary"
                          style={{
                            top: ((Math.min(creationStart.time, creationEnd) - (START_HOUR * 60)) / (HOURS_COUNT * 60)) * 100 + "%",
                            height: (Math.abs(creationEnd - creationStart.time) / (HOURS_COUNT * 60)) * 100 + "%"
                          }}>
                          New Block
                        </div>
                      )}

                      {/* Render Blocks Grouped by Container */}
                      {(() => {
                        const dayDateStr = format(addDays(currentWeekStart, dayIndex), 'yyyy-MM-dd');
                        const currentRealWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                        const isCurrentRealWeek = isSameDay(currentWeekStart, currentRealWeekStart);

                        const dayBlocks = (userData.timeBlocks || []).filter(b => {
                          if (b.date) return b.date === dayDateStr;
                          // Legacy blocks (no date): Show only if we are viewing the current real week
                          return b.dayOfWeek === dayIndex && isCurrentRealWeek;
                        });
                        const containers = dayBlocks.filter(b => !b.taskId && !b.isBusy);
                        const busyBlocks = dayBlocks.filter(b => b.isBusy);
                        const taskBlocks = dayBlocks.filter(b => b.taskId);
                        const processedTaskIds = new Set<string>();

                        const renderedContainers = containers.map(container => {
                          const childTasks = taskBlocks.filter(taskBlock => {
                            const taskMid = (taskBlock.startTime + taskBlock.endTime) / 2;
                            const isInside = taskMid >= container.startTime && taskMid <= container.endTime;
                            if (isInside) processedTaskIds.add(taskBlock.id);
                            return isInside;
                          });

                          return (
                            <ContainerBlock
                              key={container.id}
                              block={container}
                              category={userData.categories.find(c => c.id === container.categoryId)}
                              childBlocks={childTasks}
                              tasks={userData.tasks}
                              onResizeStart={handleResizeStart}
                              onClick={handleBlockClick}
                              theme={theme}
                              currentTaskId={currentTaskId}
                              isTimerRunning={pomodoroTimer.isRunning}
                              onDistribute={handleDistributeTasks}
                              onStartPomodoro={startPomodoro}
                            />
                          );
                        });

                        const orphanTasks = taskBlocks.filter(b => !processedTaskIds.has(b.id)).map(block => (
                          <div
                            key={block.id}
                            className="absolute left-1 right-1 z-10"
                            style={{
                              top: `${((block.startTime - (START_HOUR * 60)) / (HOURS_COUNT * 60)) * 100}%`,
                              height: `${((block.endTime - block.startTime) / (HOURS_COUNT * 60)) * 100}%`,
                            }}
                          >
                            <TaskItem
                              block={block}
                              task={userData.tasks.find(t => t.id === block.taskId)}
                              containerStart={block.startTime} // It's its own container effectively
                              containerDuration={block.endTime - block.startTime} // 100% height
                              onClick={() => handleBlockClick(block)}
                              onResizeStart={handleResizeStart}
                              onStartPomodoro={(task) => {
                                startPomodoro(task);
                                onNavigateToPomodoro && onNavigateToPomodoro();
                              }}
                              theme={theme}
                              currentTaskId={currentTaskId}
                              isTimerRunning={!!pomodoroTimer.isRunning}
                            />
                          </div>
                        ));

                        const renderedBusy = busyBlocks.map(block => (
                          <ContainerBlock
                            key={block.id}
                            block={block}
                            category={null}
                            childBlocks={[]}
                            tasks={[]}
                            onResizeStart={handleResizeStart}
                            onClick={handleBlockClick}
                            theme={theme}
                            currentTaskId={currentTaskId}
                            isTimerRunning={!!pomodoroTimer?.isRunning}
                            onStartPomodoro={(task) => {
                              startPomodoro(task);
                              onNavigateToPomodoro && onNavigateToPomodoro();
                            }}
                          />
                        ));

                        // ACTIVITY TRACK BACKGROUND
                        // This creates the "one big line" feel
                        const activityTrack = (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-muted/30 rounded-full mx-0.5" />
                        );



                        // HISTORY RENDERING - ACTIVITY RIBBON
                        const renderedHistory = showHistory ? (userData.pomodoroSessions || [])
                          .filter(session => {
                            if (!session.started || !session.ended) return false;
                            const sessionDate = new Date(session.started);
                            const colDate = addDays(currentWeekStart, dayIndex);
                            return isSameDay(sessionDate, colDate);
                          })
                          .map(session => {
                            const start = new Date(session.started);
                            const end = new Date(session.ended!);
                            const startMins = start.getHours() * 60 + start.getMinutes();
                            const endMins = end.getHours() * 60 + end.getMinutes();
                            const duration = endMins - startMins;

                            if (duration <= 0) return null;

                            const task = userData.tasks.find(t => t.id === session.taskId);
                            const category = task ? userData.categories.find(c => c.id === task.categoryId) : null;

                            return (
                              <div
                                key={session.id}
                                className={cn(
                                  "absolute left-0 z-40 flex flex-col justify-center shadow-sm overflow-hidden transition-all duration-300 ease-out group",
                                  "w-1.5 hover:w-56 hover:z-50 hover:shadow-xl rounded-r-md mx-0.5", // Added mx-0.5 to align with track
                                  // Work: Dark (light mode) / White (dark mode)
                                  // Break: Green
                                  session.type === 'work'
                                    ? "bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900"
                                    : "bg-green-500 text-white"
                                )}
                                style={{
                                  top: `${((startMins - (START_HOUR * 60)) / (HOURS_COUNT * 60)) * 100}%`,
                                  height: `${(duration / (HOURS_COUNT * 60)) * 100}%`,
                                }}
                              >
                                {/* Pause Intervals Overlay */}
                                {session.pauses?.map((pause, i) => {
                                  const pauseStart = new Date(pause.start);
                                  const pauseEnd = new Date(pause.end);
                                  const pauseStartMins = pauseStart.getHours() * 60 + pauseStart.getMinutes();
                                  const pauseEndMins = pauseEnd.getHours() * 60 + pauseEnd.getMinutes();

                                  // Calculate relative position within the session
                                  const sessionStartMins = start.getHours() * 60 + start.getMinutes();
                                  const sessionDuration = (end.getHours() * 60 + end.getMinutes()) - sessionStartMins;

                                  const relativeTop = ((pauseStartMins - sessionStartMins) / sessionDuration) * 100;
                                  const relativeHeight = ((pauseEndMins - pauseStartMins) / sessionDuration) * 100;

                                  return (
                                    <div
                                      key={i}
                                      className="absolute left-0 w-full bg-red-500/80 z-10"
                                      style={{
                                        top: `${relativeTop}%`,
                                        height: `${relativeHeight}%`,
                                      }}
                                    />
                                  );
                                })}

                                {/* Content - Hidden until hover */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 pl-3 pr-2 flex flex-col whitespace-nowrap bg-card/95 backdrop-blur-sm h-full justify-center border-l border-border/50 text-foreground relative z-20">
                                  <div className="font-bold text-xs flex items-center gap-1">
                                    {session.type === 'work' ? (
                                      <>
                                        {category?.icon} <span className="truncate">{task?.title || 'Unknown Task'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Coffee className="w-3 h-3" /> {session.type === 'shortBreak' ? 'Short Break' : 'Long Break'}
                                      </>
                                    )}
                                  </div>
                                  <div className="text-[10px] opacity-90 flex items-center gap-1">
                                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                    <span className="font-mono">({duration}m)</span>
                                  </div>
                                  {session.pauses && session.pauses.length > 0 && (
                                    <div className="text-[9px] text-red-500 font-bold mt-0.5">
                                      {session.pauses.length} Pause{session.pauses.length > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }) : [];

                        // ACTIVE SESSION RENDERING (Live)
                        // Show active session regardless of history toggle
                        // ACTIVE SESSION RENDERING (Live)
                        // Show active session regardless of history toggle
                        if (showLive && pomodoroTimer.isRunning && pomodoroTimer.currentSession && pomodoroTimer.currentSession.started) {
                          const session = pomodoroTimer.currentSession;
                          const start = new Date(session.started);

                          // Check if session belongs to this day
                          const colDate = addDays(currentWeekStart, dayIndex);
                          if (isSameDay(start, colDate)) {
                            const startMins = start.getHours() * 60 + start.getMinutes();

                            // Calculate elapsed time based on current time
                            const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                            const elapsedMins = Math.max(1, nowMins - startMins);

                            // Target duration (e.g. 25m)
                            const targetMins = session.duration || 25;

                            // Display height is max of target or elapsed (handles overtime)
                            const displayDuration = Math.max(elapsedMins, targetMins);

                            const task = userData.tasks.find(t => t.id === session.taskId);
                            const category = task ? userData.categories.find(c => c.id === task.categoryId) : null;

                            renderedHistory.push(
                              <div
                                key="active-session"
                                className={cn(
                                  "absolute left-0 z-50 flex flex-col justify-center shadow-md overflow-hidden transition-all duration-300 ease-out group",
                                  "w-1.5 hover:w-56 hover:z-[60] hover:shadow-xl rounded-r-md mx-0.5",
                                  // Paused: Red
                                  // Running Work: Dark/White
                                  // Running Break: Green
                                  !pomodoroTimer.isRunning
                                    ? "bg-red-500 text-white"
                                    : session.type === 'work'
                                      ? "bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900 animate-pulse"
                                      : "bg-green-500 text-white animate-pulse"
                                )}
                                style={{
                                  top: `${((startMins - (START_HOUR * 60)) / (HOURS_COUNT * 60)) * 100}%`,
                                  height: `${(displayDuration / (HOURS_COUNT * 60)) * 100}%`,
                                }}
                              >
                                {/* Live Indicator Line */}
                                <div className={cn(
                                  "absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500",
                                  pomodoroTimer.isRunning ? "animate-pulse" : "opacity-50",
                                  session.type === 'work' ? "bg-white/30" : "bg-white/30"
                                )} />

                                {/* Content - Hidden until hover */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 pl-3 pr-2 flex flex-col whitespace-nowrap bg-card/95 backdrop-blur-sm h-full justify-center border-l border-border/50 text-foreground">
                                  <div className="font-bold text-xs flex items-center gap-1">
                                    {/* Live Dot */}
                                    <div className={cn("w-2 h-2 rounded-full", pomodoroTimer.isRunning ? "bg-green-500 animate-pulse" : "bg-red-500")} />

                                    {session.type === 'work' ? (
                                      <>
                                        {category?.icon} <span className="truncate">{task?.title || 'Unknown Task'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Coffee className="w-3 h-3" /> {session.type === 'shortBreak' ? 'Short Break' : 'Long Break'}
                                      </>
                                    )}
                                  </div>

                                  <div className="text-[10px] opacity-90 flex items-center gap-1 mt-0.5">
                                    {format(start, 'HH:mm')} - Now
                                    <span className="font-mono">({elapsedMins}m / {targetMins}m)</span>
                                  </div>

                                  {/* Paused State */}
                                  {!pomodoroTimer.isRunning && (
                                    <div className="text-[9px] font-bold text-red-500 uppercase tracking-wider mt-0.5">
                                      PAUSED
                                    </div>
                                  )}

                                  {/* Overtime Indicator */}
                                  {elapsedMins > targetMins && (
                                    <div className="text-[9px] font-bold text-red-500 mt-0.5">
                                      OVERTIME (+{elapsedMins - targetMins}m)
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        }

                        return [
                          activityTrack,
                          ...renderedContainers,
                          ...orphanTasks,
                          ...renderedBusy,
                          ...renderedHistory
                        ];
                      })()}
                    </div>
                  </div>

                ))}
              </div>
            </div>
          </div>
          {/* Sidebar */}
          {/* Sidebar */}
          <SidebarDroppable>
            <div className="w-64 border-l bg-card/50 backdrop-blur-sm flex flex-col h-full">
              <div className="p-3 border-b bg-muted/20">
                <h3 className="font-semibold text-sm">Tasks & Blocks</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Drag items to schedule</p>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {/* Group by Category */}
                {userData.categories
                  .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
                  .map(cat => {
                    const catTasks = (userData.tasks || []).filter(t => t.categoryId === cat.id && !t.completed && !t.scheduledDate);
                    if (catTasks.length === 0) return null;

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1">
                          <span>{cat.icon}</span> {cat.name}
                        </div>
                        {catTasks.map(task => (
                          <DraggableTask key={task.id} task={task} theme={theme} />
                        ))}
                      </div>
                    );
                  })}

                {/* Empty State */}
                {(!userData.tasks || userData.tasks.filter(t => !t.completed && !t.scheduledDate).length === 0) && (
                  <div className="p-4 text-center text-muted-foreground text-xs">
                    No unscheduled tasks found. Great job!
                  </div>
                )}

                {/* Drop Zone Hint */}
                <div className="mt-4 border-2 border-dashed border-muted rounded-lg p-4 text-center text-xs text-muted-foreground">
                  Drop here to unschedule
                </div>
              </div>
            </div>
          </SidebarDroppable>
        </div>
      </div>


      {/* Category Selection Modal for Drag-to-Create */}
      <Dialog open={showCategorySelect} onOpenChange={setShowCategorySelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Category Selection First */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Select Category</span>
              <div className="grid grid-cols-2 gap-2">
                {userData.categories.map(cat => (
                  <Button key={cat.id} variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => handleCreateFromDrag(cat.id)}>
                    <span className="text-xl">{cat.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or create custom block</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium">Label (Optional)</span>
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="e.g. Gym, Lunch, Deep Work..."
                  value={newBlockLabel}
                  onChange={(e) => setNewBlockLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFromDrag('busy', true);
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCreateFromDrag('busy', true)}
                  className="shrink-0"
                >
                  <SplitSquareHorizontal className="w-4 h-4 mr-2" />
                  <span>Create</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DragOverlay>
        {activeDragItem ? (
          activeDragItem.type === 'block' && activeDragItem.data.taskId ? (
            <div className="w-[150px] h-[60px] relative"> {/* Fixed size preview */}
              <TaskCard
                block={activeDragItem.data}
                task={userData.tasks.find(t => t.id === activeDragItem.data.taskId)}
                style={{ height: '100%', width: '100%' }}
                theme={theme}
                currentTaskId={currentTaskId}
                isTimerRunning={pomodoroTimer.isRunning}
              />
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-md border shadow-xl opacity-90 cursor-grabbing bg-background min-w-[150px]",
              theme === 'retro' && "bg-card border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:bg-slate-800 dark:text-white"
            )}>
              {activeDragItem.type === 'task' && (
                <span className="text-sm font-medium">{activeDragItem.data.title}</span>
              )}
              {activeDragItem.type === 'busy' && (
                <span className="text-sm font-medium">🚫 Block Time</span>
              )}
              {activeDragItem.type === 'block' && (
                <div className="flex flex-col w-full">
                  {/* Time removed as per user request */}
                  <span className="text-sm font-medium">
                    {activeDragItem.data.label || 'Block'}
                  </span>
                </div>
              )}
            </div>
          )
        ) : null}
        {dragPreviewTime && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-50 pointer-events-none whitespace-nowrap">
            {dragPreviewTime}
          </div>
        )}
      </DragOverlay>

      {/* --- Edit Block Dialog --- */}
      <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <DialogContent className={cn(
          "sm:max-w-[425px]",
          theme === 'retro' && "border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        )}>
          <DialogHeader>
            <DialogTitle>Edit Time Block</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <span className="text-xs font-medium">Category</span>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {userData.categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span> {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <span className="text-xs font-medium">Time & Duration</span>
              <div className="p-3 bg-muted/30 rounded-md border space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Start</span>
                    <Input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="h-8 mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-center pt-4 text-muted-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">End</span>
                    <Input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="h-8 mt-1"
                    />
                  </div>
                </div>

                {/* Quick Duration Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const isTask = editingBlock && userData.timeBlocks?.find(b => b.id === editingBlock)?.taskId;
                    const durations = isTask
                      ? [15, 30, 45, 60, 90, 120] // Minutes for tasks
                      : [60, 120, 180, 240, 300, 360]; // Hours for categories/containers

                    return durations.map(mins => (
                      <Button
                        key={mins}
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => {
                          const [h, m] = editStartTime.split(':').map(Number);
                          const startMins = h * 60 + m;
                          const endMins = startMins + mins;
                          const endH = Math.floor(endMins / 60) % 24;
                          const endM = endMins % 60;
                          setEditEndTime(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);
                        }}
                      >
                        +{isTask ? `${mins}m` : `${mins / 60}h`}
                      </Button>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Show Task Info if linked */}
            {/* Show Task Info if linked */}
            {(() => {
              const block = userData.timeBlocks?.find(b => b.id === editingBlock);
              const task = block?.taskId ? userData.tasks?.find(t => t.id === block.taskId) : null;

              if (!task) return null;

              return (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 space-y-2">
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium block mb-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Linked Task
                    </span>
                    <div className="font-medium text-sm">{task.title}</div>
                  </div>

                  {task.description && (
                    <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded">
                      {task.description}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Completed / Estimated Pomodoros">
                      <span>🍅</span>
                      <span className="font-medium">
                        {task.pomodoroSessions?.filter((s: any) => s.completed).length || 0}
                        <span className="text-muted-foreground/60 mx-1">/</span>
                        {task.estimatedPomodoros || '?'}
                      </span>
                    </div>
                    {task.priority && (
                      <div className="capitalize flex items-center gap-1">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          task.priority === 'high' ? "bg-red-500" :
                            task.priority === 'medium' ? "bg-yellow-500" :
                              "bg-blue-500"
                        )} />
                        {task.priority} Priority
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="destructive" size="sm" onClick={handleDeleteBlock} className="gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>

            <div className="flex gap-2">
              {editingBlock && userData.timeBlocks?.find(b => b.id === editingBlock)?.taskId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartPomodoro}
                  className={cn(
                    "gap-2",
                    theme === 'retro' && "border-2 border-black hover:bg-accent"
                  )}
                >
                  Start Session ⏱️
                </Button>
              )}
              <Button size="sm" onClick={handleSaveEdit} className={theme === 'retro' ? "border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all" : ""}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Create Block Dialog (Currently Unused due to Auto-Create) --- */}
      <Dialog open={isCreatingBlock} onOpenChange={setIsCreatingBlock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Block</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <span className="text-xs font-medium">Category</span>
              <Select value={newBlockCategory} onValueChange={setNewBlockCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userData.categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span> {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-medium">Start Time</span>
                <div className="p-2 border rounded-md bg-muted/20 text-sm">
                  {Math.floor(newBlockStart / 60).toString().padStart(2, '0')}:
                  {(newBlockStart % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium">End Time</span>
                <Input
                  type="time"
                  value={newBlockEndTimeStr}
                  onChange={(e) => setNewBlockEndTimeStr(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateBlock}>Create Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {resizeStatus && (
        <div
          className="fixed z-50 bg-black text-white text-xs font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{ top: resizeStatus.y - 40, left: resizeStatus.x - 20 }}
        >
          {resizeStatus.time}
        </div>
      )}
    </DndContext>
  );
};

export default SchedulePage;

