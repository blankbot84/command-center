'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConversationHeaderAgent {
  emoji: string;
  name: string;
  role: string;
}

interface ConversationHeaderProps {
  agent: ConversationHeaderAgent | null;
  onTap: () => void;
  className?: string;
}

export function ConversationHeader({ agent, onTap, className }: ConversationHeaderProps) {
  if (!agent) {
    return (
      <button
        onClick={onTap}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'hover:bg-muted/50 transition-colors',
          'min-h-[48px] touch-manipulation',
          className
        )}
      >
        <span className="text-muted-foreground text-sm">Select an agent...</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <button
      onClick={onTap}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg',
        'hover:bg-muted/50 transition-colors',
        'min-h-[48px] touch-manipulation',
        className
      )}
    >
      <span className="text-2xl" role="img" aria-label={agent.name}>
        {agent.emoji}
      </span>
      <div className="flex flex-col items-start">
        <span className="font-semibold text-foreground leading-tight">
          {agent.name}
        </span>
        <span className="text-xs text-muted-foreground leading-tight">
          {agent.role}
        </span>
      </div>
      <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
    </button>
  );
}
