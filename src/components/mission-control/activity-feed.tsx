'use client';

import { Activity, getAgent, formatRelativeTime, mockAgents } from '@/lib/mission-control-data';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  lastRefresh?: Date | null;
}

const activityIcons: Record<Activity['type'], string> = {
  task_created: '📝',
  task_assigned: '👤',
  status_changed: '🔄',
  comment_posted: '💬',
  document_created: '📄',
  agent_status: '⚡',
};

// Fallback agent lookup for activities from daily notes
function getAgentFallback(agentId: string) {
  const agent = getAgent(agentId);
  if (agent) return agent;
  
  // Create a fallback for unknown agents
  return {
    id: agentId,
    name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
    emoji: '🤖',
    role: 'Agent',
    status: 'idle' as const,
    focus: null,
    lastActive: new Date(),
    color: 'leo',
  };
}

export function ActivityFeed({ activities, maxItems, isLoading, onRefresh, lastRefresh }: ActivityFeedProps) {
  const items = maxItems ? activities.slice(0, maxItems) : activities;

  return (
    <div className="space-y-0">
      {/* Loading indicator */}
      {isLoading && (
        <div className="py-4 px-4 border-b border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-xs">Loading activities...</span>
          </div>
        </div>
      )}
      
      {/* Last refresh indicator */}
      {lastRefresh && !isLoading && (
        <div className="py-2 px-4 border-b border-border bg-muted/30">
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
            Updated {formatRelativeTime(lastRefresh)}
          </p>
        </div>
      )}
      
      {items.map((activity) => {
        const agent = getAgentFallback(activity.agentId);

        return (
          <div
            key={activity.id}
            className={cn(
              'py-3 px-4 flex gap-3 items-start border-b border-border last:border-b-0',
              'hover:bg-accent/30 transition-colors'
            )}
          >
            {/* Agent emoji */}
            <span className="text-lg flex-shrink-0" title={agent.name}>
              {agent.emoji}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-medium">{agent.name}</span>
                <span className="text-muted-foreground mx-1.5">·</span>
                <span>{activity.description}</span>
              </p>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>

            {/* Activity type icon */}
            <span className="text-sm flex-shrink-0 opacity-50" title={activity.type}>
              {activityIcons[activity.type]}
            </span>
          </div>
        );
      })}
      
      {items.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-2">
            No recent activity
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}
