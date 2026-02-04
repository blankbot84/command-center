'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, TASK_COLUMNS } from '@/lib/types';
import { getDataSourceInstance } from '@/lib/data';
import { mockAgents, getAgent } from '@/lib/mission-control-data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentIcon } from '@/components/ui/agent-icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─────────────────────────────────────────────────────────────
// TASK CARD
// ─────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  high: 'bg-raph text-white',
  medium: 'bg-leo text-white',
  low: 'bg-muted-foreground text-white',
};

const priorityLabels: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

function TaskCard({ task, onClick }: TaskCardProps) {
  const assignees = task.assignees.map(id => getAgent(id)).filter(Boolean);

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-3 cursor-pointer hover:bg-accent/50 transition-colors',
        'border-l-[3px]',
        task.priority === 'high' && 'border-l-raph',
        task.priority === 'medium' && 'border-l-leo',
        task.priority === 'low' && 'border-l-muted-foreground',
        task.status === 'done' && 'opacity-60'
      )}
    >
      <h4 className={cn(
        'text-sm font-medium leading-snug mb-2',
        task.status === 'done' && 'line-through text-muted-foreground'
      )}>
        {task.title}
      </h4>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className={cn(
              'font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5',
              priorityColors[task.priority]
            )}
          >
            {priorityLabels[task.priority]}
          </Badge>
          {task.tags && task.tags.length > 0 && (
            <span className="font-mono text-[9px] text-muted-foreground">
              #{task.tags[0]}
            </span>
          )}
        </div>

        <div className="flex -space-x-1">
          {assignees.length > 0 ? (
            assignees.slice(0, 3).map(agent => (
              <span
                key={agent!.id}
                className="w-6 h-6 rounded-full bg-card border-2 border-background flex items-center justify-center"
                title={agent!.name}
              >
                <AgentIcon icon={agent!.icon} className="h-3.5 w-3.5" />
              </span>
            ))
          ) : (
            <span className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground">
              ?
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// TASK COLUMN
// ─────────────────────────────────────────────────────────────

interface TaskColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function TaskColumn({ status, label, color, tasks, onTaskClick }: TaskColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1 snap-center">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border sticky top-0 bg-background z-10">
        <div className={cn('w-2 h-2 rounded-full', color)} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground ml-auto">
          {tasks.length}
        </span>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-center py-8 text-xs text-muted-foreground">
              No tasks
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TASK DETAIL DIALOG
// ─────────────────────────────────────────────────────────────

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

function TaskDetail({ task, open, onClose }: TaskDetailProps) {
  if (!task) return null;

  const assignees = task.assignees.map(id => getAgent(id)).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-1 h-12 flex-shrink-0',
              task.priority === 'high' && 'bg-raph',
              task.priority === 'medium' && 'bg-leo',
              task.priority === 'low' && 'bg-muted-foreground'
            )} />
            <div className="flex-1">
              <DialogTitle className="text-lg leading-snug">
                {task.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {task.status}
                </Badge>
                <Badge
                  className={cn(
                    'font-mono text-[10px] uppercase',
                    priorityColors[task.priority]
                  )}
                >
                  {task.priority}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Assignees */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Assignees
            </h4>
            <div className="flex items-center gap-2">
              {assignees.length > 0 ? (
                assignees.map(agent => (
                  <div
                    key={agent!.id}
                    className="flex items-center gap-2 px-2 py-1 bg-accent rounded"
                  >
                    <AgentIcon icon={agent!.icon} className="h-4 w-4" />
                    <span className="text-sm">{agent!.name}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Description
              </h4>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {task.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>ID: {task.id}</span>
              <span>Created: {new Date(task.created).toLocaleDateString()}</span>
            </div>
            {task.due && (
              <div className="text-xs text-muted-foreground mt-1">
                Due: {new Date(task.due).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// FILTER CONTROLS
// ─────────────────────────────────────────────────────────────

interface FilterControlsProps {
  assigneeFilter: string | null;
  onAssigneeChange: (id: string | null) => void;
  priorityFilter: TaskPriority | null;
  onPriorityChange: (priority: TaskPriority | null) => void;
}

function FilterControls({
  assigneeFilter,
  onAssigneeChange,
  priorityFilter,
  onPriorityChange,
}: FilterControlsProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border overflow-x-auto">
      {/* Assignee filter */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Assignee:
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onAssigneeChange(null)}
            className={cn(
              'px-2 py-1 text-xs rounded',
              assigneeFilter === null ? 'bg-accent' : 'hover:bg-accent/50'
            )}
          >
            All
          </button>
          {mockAgents.slice(0, 5).map(agent => (
            <button
              key={agent.id}
              onClick={() => onAssigneeChange(agent.id)}
              className={cn(
                'w-7 h-7 rounded flex items-center justify-center',
                assigneeFilter === agent.id ? 'bg-accent ring-2 ring-primary' : 'hover:bg-accent/50'
              )}
              title={agent.name}
            >
              <AgentIcon icon={agent.icon} className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Priority:
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onPriorityChange(null)}
            className={cn(
              'px-2 py-1 text-xs rounded',
              priorityFilter === null ? 'bg-accent' : 'hover:bg-accent/50'
            )}
          >
            All
          </button>
          {(['high', 'medium', 'low'] as TaskPriority[]).map(p => (
            <button
              key={p}
              onClick={() => onPriorityChange(p)}
              className={cn(
                'px-2 py-1 text-xs rounded capitalize',
                priorityFilter === p ? cn('text-white', priorityColors[p]) : 'hover:bg-accent/50'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function TasksKanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null);

  useEffect(() => {
    async function loadTasks() {
      try {
        const dataSource = getDataSourceInstance();
        const data = await dataSource.getTasks();
        setTasks(data);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    if (assigneeFilter && !task.assignees.includes(assigneeFilter)) {
      return false;
    }
    if (priorityFilter && task.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  // Group by status
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    inbox: filteredTasks.filter(t => t.status === 'inbox'),
    active: filteredTasks.filter(t => t.status === 'active'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted-foreground">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <FilterControls
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      {/* Mobile: Tabs layout */}
      <div className="flex-1 overflow-hidden lg:hidden">
        <Tabs defaultValue="active" className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-12 p-0">
            {TASK_COLUMNS.map(col => (
              <TabsTrigger
                key={col.id}
                value={col.id}
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-mono text-xs uppercase tracking-widest h-full"
              >
                <span className={cn('w-2 h-2 mr-2', col.color)} />
                {col.label}
                <span className="ml-2 text-muted-foreground">
                  {tasksByStatus[col.id].length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {TASK_COLUMNS.map(col => (
            <TabsContent
              key={col.id}
              value={col.id}
              className="flex-1 overflow-auto mt-0 p-3"
            >
              <div className="space-y-2">
                {tasksByStatus[col.id].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
                {tasksByStatus[col.id].length === 0 && (
                  <p className="text-center py-8 text-xs text-muted-foreground">
                    No tasks in {col.label.toLowerCase()}
                  </p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Desktop: Kanban columns */}
      <div className="hidden lg:flex flex-1 overflow-x-auto p-4 gap-4">
        {TASK_COLUMNS.map(col => (
          <TaskColumn
            key={col.id}
            status={col.id}
            label={col.label}
            color={col.color}
            tasks={tasksByStatus[col.id]}
            onTaskClick={setSelectedTask}
          />
        ))}
      </div>

      {/* Task detail dialog */}
      <TaskDetail
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
