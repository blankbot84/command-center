'use client';

import { Agent, formatRelativeTime } from '@/lib/mission-control-data';
import { cn } from '@/lib/utils';
import { AgentIcon } from '@/components/ui/agent-icon';

interface SquadOverviewProps {
  agents: Agent[];
  onAgentClick?: (agent: Agent) => void;
}

const statusColors: Record<Agent['status'], string> = {
  idle: 'bg-muted-foreground',
  working: 'bg-raph',
  blocked: 'bg-leo',
};

const statusTextColors: Record<Agent['status'], string> = {
  idle: 'text-muted-foreground',
  working: 'text-raph',
  blocked: 'text-leo',
};

const agentBorderColors: Record<string, string> = {
  leo: 'border-l-leo',
  raph: 'border-l-raph',
  donnie: 'border-l-donnie',
  mikey: 'border-l-mikey',
};

export function SquadOverview({ agents, onAgentClick }: SquadOverviewProps) {
  const workingAgents = agents.filter(a => a.status === 'working');
  const blockedAgents = agents.filter(a => a.status === 'blocked');
  const idleAgents = agents.filter(a => a.status === 'idle');

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Squad Overview
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-raph" />
              <span className="font-mono text-[9px] text-muted-foreground">
                {workingAgents.length}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-leo" />
              <span className="font-mono text-[9px] text-muted-foreground">
                {blockedAgents.length}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="font-mono text-[9px] text-muted-foreground">
                {idleAgents.length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Agent rows */}
      <div className="divide-y divide-border">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick?.(agent)}
            className={cn(
              'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
              'border-l-[3px]',
              agentBorderColors[agent.color] || 'border-l-muted-foreground'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Agent info */}
              <div className="flex items-center gap-2 min-w-[120px]">
                <AgentIcon icon={agent.icon} className="h-5 w-5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{agent.name}</span>
                    <span className={cn('w-1.5 h-1.5 rounded-full', statusColors[agent.status])} />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {formatRelativeTime(agent.lastActive)}
                  </span>
                </div>
              </div>

              {/* Focus */}
              <div className="flex-1 min-w-0">
                {agent.focus ? (
                  <p className="text-sm text-foreground truncate">
                    {agent.focus}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Awaiting assignment
                  </p>
                )}
                
                {/* Blocker badge */}
                {agent.blockers && agent.blockers.length > 0 && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-leo/10 text-leo text-[10px] font-mono uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-leo" />
                      Blocked
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {agent.blockers[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Status label (mobile hidden) */}
              <div className="hidden sm:flex items-center">
                <span className={cn(
                  'font-mono text-[9px] uppercase tracking-wider',
                  statusTextColors[agent.status]
                )}>
                  {agent.status}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
