'use client';

import { Task, getAgent, formatRelativeTime, TaskStatus, mockAgents } from '@/lib/mission-control-data';
import { cn } from '@/lib/utils';
import { AgentIcon } from '@/components/ui/agent-icon';

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const statusColors: Record<TaskStatus, string> = {
  inbox: 'bg-muted-foreground',
  assigned: 'bg-leo',
  in_progress: 'bg-raph',
  review: 'bg-mikey',
  done: 'bg-donnie',
  blocked: 'bg-destructive',
};

const statusLabels: Record<TaskStatus, string> = {
  inbox: 'Inbox',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  blocked: 'Blocked',
};

export function TaskList({ tasks, onTaskClick }: TaskListProps) {
  // Sort: blocked first, then in_progress, then rest
  const sortedTasks = [...tasks].sort((a, b) => {
    const priority: Record<TaskStatus, number> = {
      blocked: 0,
      in_progress: 1,
      review: 2,
      assigned: 3,
      inbox: 4,
      done: 5,
    };
    return priority[a.status] - priority[b.status];
  });

  return (
    <div className="space-y-0">
      {sortedTasks.map(task => {
        const assignees = task.assignedTo.map(id => getAgent(id)).filter(Boolean);

        return (
          <button
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className={cn(
              'w-full text-left py-3 px-4 flex gap-3 items-start border-b border-border last:border-b-0',
              'hover:bg-accent/30 transition-colors'
            )}
          >
            {/* Status indicator */}
            <div className="flex-shrink-0 pt-1">
              <span 
                className={cn('block w-2 h-2 rounded-full', statusColors[task.status])}
                title={statusLabels[task.status]}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'text-sm font-medium leading-snug',
                task.status === 'done' && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {task.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  'font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5',
                  statusColors[task.status],
                  'text-white'
                )}>
                  {statusLabels[task.status]}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                  {formatRelativeTime(task.updatedAt)}
                </span>
              </div>
            </div>

            {/* Assignees */}
            <div className="flex-shrink-0 flex -space-x-1">
              {assignees.length > 0 ? (
                assignees.map(agent => (
                  <span
                    key={agent!.id}
                    className="w-7 h-7 rounded-full bg-card border-2 border-background flex items-center justify-center"
                    title={agent!.name}
                  >
                    <AgentIcon icon={agent!.icon} className="h-4 w-4" />
                  </span>
                ))
              ) : (
                <span className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                  ?
                </span>
              )}
            </div>
          </button>
        );
      })}

      {tasks.length === 0 && (
        <p className="text-center py-8 text-sm text-muted-foreground">
          No tasks
        </p>
      )}
    </div>
  );
}
