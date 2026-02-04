'use client';

import { Agent, formatRelativeTime } from '@/lib/mission-control-data';
import { cn } from '@/lib/utils';
import { AgentIcon } from '@/components/ui/agent-icon';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

const statusColors: Record<Agent['status'], string> = {
  idle: 'bg-muted-foreground',
  working: 'bg-raph',
  blocked: 'bg-leo',
};

const statusLabels: Record<Agent['status'], string> = {
  idle: 'Idle',
  working: 'Working',
  blocked: 'Blocked',
};

const agentColors: Record<string, string> = {
  leo: 'border-l-leo',
  raph: 'border-l-raph',
  donnie: 'border-l-donnie',
  mikey: 'border-l-mikey',
};

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-card border border-border p-4 transition-all',
        'hover:border-muted-foreground cursor-pointer',
        'border-l-[3px]',
        agentColors[agent.color] || 'border-l-muted-foreground'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <AgentIcon icon={agent.icon} className="h-6 w-6" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{agent.name}</h3>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider truncate">
            {agent.role}
          </p>
        </div>
        {/* Status dot */}
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', statusColors[agent.status])} />
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {statusLabels[agent.status]}
          </span>
        </div>
      </div>

      {/* Focus area */}
      <div className="mb-2 min-h-[40px]">
        {agent.focus ? (
          <p className="text-sm text-foreground line-clamp-2 leading-snug">
            {agent.focus}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Awaiting assignment
          </p>
        )}
        
        {/* Blocker badge */}
        {agent.blockers && agent.blockers.length > 0 && (
          <div className="mt-2 flex items-start gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-leo/10 text-leo text-[9px] font-mono uppercase tracking-wider shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-leo" />
              Blocker
            </span>
            <span className="text-[11px] text-muted-foreground line-clamp-1">
              {agent.blockers[0]}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
        Active {formatRelativeTime(agent.lastActive)}
      </div>
    </button>
  );
}
