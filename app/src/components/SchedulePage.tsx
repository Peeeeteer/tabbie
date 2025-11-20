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
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  GripVertical,
  X,
  Check,
  Trash2,
  Edit2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Eraser,
  SplitSquareHorizontal,
  Copy,
  ClipboardPaste,
  Timer,
  Minimize2
} from 'lucide-react';
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

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 mb-2 border shadow-sm rounded-md cursor-grab active:cursor-grabbing transition-all hover:scale-105 bg-card hover:bg-accent border-transparent hover:border-border text-sm flex items-center gap-2 text-foreground",
        theme === 'retro' && "bg-card border-2 border-black dark:border-gray-600 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] dark:bg-slate-800 dark:text-white"
      )}
      style={transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      } : undefined}
    >
      <span className="truncate">{task.title}</span>
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

const TaskItem = React.memo(({
  block,
  task,
  containerStart,
  containerDuration,
  onClick,
  onResizeStart,
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

  const style: React.CSSProperties = {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    left: '4px',
    right: '4px',
    zIndex: isDragging ? 999 : 10,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => e.stopPropagation()} // Prevent Drag-to-Create
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute rounded-sm p-1 text-[10px] overflow-hidden cursor-grab active:cursor-grabbing shadow-sm transition-all flex items-center gap-1 border group/task",
        theme === 'retro'
          ? "bg-white border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] dark:bg-slate-800 dark:border-gray-600 dark:text-white"
          : "bg-background border-border",
        block.taskId === currentTaskId && isTimerRunning && "ring-2 ring-primary ring-offset-0 animate-pulse"
      )}
      style={style}
    >
      {/* Resize Handle Top */}
      <div
        onPointerDown={(e) => onResizeStart(e, block.id, 'top')}
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/5 z-20 opacity-0 group-hover/task:opacity-100"
      />

      <div className="flex items-center justify-between w-full gap-2">
        <span className="truncate font-medium">{task?.title || 'Unknown Task'}</span>
        <div className="flex items-center gap-2 opacity-70 text-[9px] font-mono whitespace-nowrap">
          <div className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            <span>{Math.floor(block.startTime / 60)}:{String(block.startTime % 60).padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Timer className="w-3 h-3" />
            <span>{((block.endTime - block.startTime) / 30).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Resize Handle Bottom */}
      <div
        onPointerDown={(e) => onResizeStart(e, block.id, 'bottom')}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/5 z-20 opacity-0 group-hover/task:opacity-100"
      />
    </div>
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
  isTimerRunning
}: {
  block: any,
  category: any,
  childBlocks: any[],
  tasks: any[],
  onResizeStart: (e: React.PointerEvent, blockId: string, direction: 'top' | 'bottom') => void,
  onClick: (b: any) => void,
  theme: string,
  currentTaskId: string | null,
  isTimerRunning: boolean
}) => {
  // Container is draggable too
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: { type: 'block', block }
  });

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
      : (category?.color ? `${category.color}15` : '#ccc'),
    border: `1px solid ${block.isBusy ? '#9ca3af' : (category?.color || '#ccc')}`,
    zIndex: isDragging ? 999 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    backgroundImage: block.isBusy
      ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)'
      : 'none'
  };

  // Merge refs
  const setRefs = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={cn(
        "absolute left-0.5 right-0.5 rounded-md overflow-hidden group transition-all",
        theme === 'retro' && "border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]",
        isOver && !isDragging && "ring-2 ring-primary ring-offset-1 bg-primary/10",
        block.isBusy && "cursor-grab active:cursor-grabbing",
        // Dark mode support for busy blocks
        block.isBusy && theme === 'retro' && "bg-[#dedede] dark:bg-slate-800 dark:border-gray-600"
      )}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => e.stopPropagation()} // Prevent Drag-to-Create
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

      {/* Container Label */}
      <div className="absolute top-1 left-1 right-1 flex items-center gap-1 opacity-50 pointer-events-none">
        {block.label ? (
          <span className="text-xs font-bold uppercase text-muted-foreground">{block.label}</span>
        ) : block.isBusy ? (
          <span className="text-xs font-bold uppercase text-muted-foreground">BUSY</span>
        ) : (
          <>
            <span className="text-lg">{category?.icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider">{category?.name}</span>
          </>
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

const SchedulePage: React.FC<SchedulePageProps> = ({ theme = 'clean' }) => {
  const { userData, addTimeBlock, deleteTimeBlock, updateTimeBlock, startPomodoro, pomodoroTimer, currentTaskId } = useTodo();
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Dialog State
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
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    setResizingBlockId(null);
    setResizeDirection(null);
    setInitialBlockData(null);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'task') {
      setActiveDragItem({ type: 'task', data: event.active.data.current?.task });
    } else if (event.active.data.current?.type === 'busy') {
      setActiveDragItem({ type: 'busy' });
    } else if (event.active.data.current?.type === 'block') {
      // Block dragging logic handled in dragEnd/move
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    let proposedStart = 0;
    let proposedEnd = 0;
    let dayIndex = 0;

    if (over.data.current?.dayIndex !== undefined) {
      const slotData = over.data.current;
      dayIndex = slotData.dayIndex;
      proposedStart = slotData.hour * 60;
      proposedEnd = (slotData.hour + 1) * 60;
    } else if (overType === 'container') {
      const containerBlock = over.data.current?.block;
      dayIndex = containerBlock.dayOfWeek;
      proposedStart = containerBlock.startTime;
      proposedEnd = proposedStart + 60;
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
      const duration = block.endTime - block.startTime;
      proposedEnd = proposedStart + duration;
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
        // Clamp
        proposedStart = Math.max(proposedStart, targetContainer.startTime);
        proposedEnd = Math.min(proposedEnd, targetContainer.endTime);
        if (proposedEnd <= proposedStart) proposedEnd = Math.min(proposedStart + 30, targetContainer.endTime);

        // Add/Update Task
        if (activeType === 'block') {
          updateTimeBlock(blockId, { dayOfWeek: dayIndex, startTime: proposedStart, endTime: proposedEnd });
        } else {
          addTimeBlock(categoryId, dayIndex, proposedStart, proposedEnd, taskId, label, isBusy);
        }
        return; // Done, no push needed for nested tasks
      }
    } else {
      // If dropping a TASK on empty space (no container), REJECT IT
      if (activeType === 'task') {
        alert("Please drag tasks into a matching Category Block.");
        return;
      }
    }

    // 2. Standard Drop (Top Level)
    // Create/Update the block
    let newBlock: any = { id: blockId || 'temp', categoryId, dayOfWeek: dayIndex, startTime: proposedStart, endTime: proposedEnd, taskId, isBusy, label };

    // If it's a new block, we don't have an ID yet, but resolveOverlaps needs one to track it.
    // We can simulate it.

    // If we are moving a block (activeType === 'block'), we treat it as a move.
    // If creating new, we treat it as an insertion.

    let blocksToResolve = [...allBlocks];
    if (activeType === 'block') {
      // Update existing in list
      blocksToResolve = blocksToResolve.map(b => b.id === blockId ? { ...b, dayOfWeek: dayIndex, startTime: proposedStart, endTime: proposedEnd } : b);
    } else {
      // Add temp to list for resolution
      blocksToResolve.push(newBlock);
    }

    // Resolve Overlaps
    // We only pass the "Changed" block to start the ripple? 
    // Actually resolveOverlaps takes (changed, all).
    // For a move, the "changed" is the moved block.
    const resolved = resolveOverlaps([newBlock], blocksToResolve);

    // Apply Changes
    resolved.forEach(b => {
      if (b.id === 'temp') {
        // This is our new block
        addTimeBlock(b.categoryId, b.dayOfWeek, b.startTime, b.endTime, b.taskId, b.label, b.isBusy);
      } else {
        const original = allBlocks.find(o => o.id === b.id);
        if (original && (original.startTime !== b.startTime || original.endTime !== b.endTime)) {
          updateTimeBlock(b.id, { startTime: b.startTime, endTime: b.endTime });
        }
      }
    });
  };

  const handleBlockClick = (block: any) => {
    if (resizingBlockId) return;

    setEditingBlock(block.id);
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

    updateTimeBlock(editingBlock, { startTime, endTime });
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
    const block = userData.timeBlocks?.find(b => b.id === editingBlock);
    if (block && block.taskId) {
      const task = userData.tasks?.find(t => t.id === block.taskId);
      if (task) {
        startPomodoro(task);
        // In a real app, we might navigate here. 
        // Assuming the user can see the timer elsewhere or it's global.
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

        // Stop if we've created enough parts? 
        // User asked to "split into 3", which implies 3 working blocks.
        // But if busy blocks fragment the day, we might get more or fewer natural slots.
        // For now, let's just fill the available time with blocks of `targetChunkDuration`.
      }
    });
  };

  // Calculate current time position
  const now = new Date();
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
    const relativeY = e.clientY - containerRect.top + containerRef.current.scrollTop;
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

      addTimeBlock(categoryId, creationStart.dayIndex, finalStart, adjustedEnd, undefined, newBlockLabel || undefined, isBusy);
    }
    setShowCategorySelect(false);
    setCreationStart(null);
    setCreationEnd(null);
    setNewBlockLabel("");
  };

  // --- Render ---

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Weekly Schedule
              <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                Beta
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Filter Tasks:</span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
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
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => {
                      if (confirm("Are you sure you want to clear today's schedule?")) {
                        clearDay(currentDayIndex);
                      }
                    }}>
                      <Eraser className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear Today</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => splitDay(currentDayIndex, 3)}>
                      <SplitSquareHorizontal className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Split Day (3 slots)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => {
                      // Compact Schedule Logic: Remove gaps
                      const dayBlocks = (userData.timeBlocks || [])
                        .filter(b => b.dayOfWeek === currentDayIndex)
                        .sort((a, b) => a.startTime - b.startTime);

                      if (dayBlocks.length === 0) return;

                      let cursor = dayBlocks[0].startTime;
                      dayBlocks.forEach(block => {
                        const duration = block.endTime - block.startTime;
                        if (block.startTime !== cursor) {
                          updateTimeBlock(block.id, { startTime: cursor, endTime: cursor + duration });
                        }
                        cursor += duration;
                      });
                    }}>
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compact Schedule (Remove Gaps)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 overflow-y-auto relative select-none" ref={containerRef}>
            <div className="flex min-w-[800px] min-h-[1000px]">
              {/* Time Labels */}
              <div className="w-16 shrink-0 border-r bg-background sticky left-0 z-30">
                <div className="h-10 border-b bg-muted/50" /> {/* Header spacer */}
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
                    "h-10 border-b bg-muted/50 flex items-center justify-center font-medium text-sm sticky top-0 z-20 backdrop-blur",
                    dayIndex === currentDayIndex && "bg-primary/5 text-primary"
                  )}>
                    {day}
                    <div className="absolute right-1 flex gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                        copySchedule(dayIndex);
                        alert(`Copied ${day}'s schedule!`);
                      }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                        if (confirm(`Paste schedule to ${day}? This will overwrite existing blocks.`)) {
                          pasteSchedule(dayIndex);
                        }
                      }}>
                        <ClipboardPaste className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Grid Slots */}
                  <div className="relative h-[calc(100%-40px)]"
                    onPointerDown={(e) => handleGridPointerDown(e, dayIndex, 0)}>
                    {/* Background Lines */}
                    {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                      <div key={i} className="h-[60px] border-b border-dashed border-muted/50" />
                    ))}

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
                      const dayBlocks = (userData.timeBlocks || []).filter(b => b.dayOfWeek === dayIndex);
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
                          />
                        );
                      });

                      const orphanTasks = taskBlocks.filter(b => !processedTaskIds.has(b.id)).map(block => (
                        <ContainerBlock
                          key={block.id}
                          block={block}
                          category={userData.categories.find(c => c.id === block.categoryId)}
                          childBlocks={[]}
                          tasks={userData.tasks}
                          onResizeStart={handleResizeStart}
                          onClick={handleBlockClick}
                          theme={theme}
                          currentTaskId={currentTaskId}
                          isTimerRunning={pomodoroTimer.isRunning}
                        />
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
                          isTimerRunning={pomodoroTimer.isRunning}
                        />
                      ));

                      return [...renderedContainers, ...orphanTasks, ...renderedBusy];
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div className="w-64 border-l bg-card/50 backdrop-blur-sm flex flex-col">
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
            </div>
          </div>
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
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-md border shadow-xl opacity-90 cursor-grabbing bg-background",
            theme === 'retro' && "bg-card border-2 border-black dark:border-gray-600 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] dark:bg-slate-800 dark:text-white"
          )}>
            {activeDragItem.type === 'task' && (
              <span className="text-sm font-medium">{activeDragItem.data.title}</span>
            )}
            {activeDragItem.type === 'busy' && (
              <span className="text-sm font-medium">🚫 Block Time</span>
            )}
          </div>
        ) : null}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-medium">Start Time</span>
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className={theme === 'retro' ? "border-2 border-black" : ""}
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium">End Time</span>
                <Input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className={theme === 'retro' ? "border-2 border-black" : ""}
                />
              </div>
            </div>

            {/* Show Task Info if linked */}
            {editingBlock && userData.timeBlocks?.find(b => b.id === editingBlock)?.taskId && (
              <div className="p-3 bg-muted/30 rounded-md border border-dashed">
                <span className="text-xs text-muted-foreground block mb-1">Linked Task:</span>
                <div className="font-medium">
                  {userData.tasks?.find(t => t.id === userData.timeBlocks?.find(b => b.id === editingBlock)?.taskId)?.title}
                </div>
              </div>
            )}
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
    </DndContext>
  );
};

export default SchedulePage;
