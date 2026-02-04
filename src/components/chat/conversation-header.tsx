'use client';

import { ChevronDown, Menu, PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIcon, getAgentColors } from '@/lib/icons';

export interface ConversationHeaderAgent {
  id: string;
  icon: string;
  name: string;
  role: string;
}

interface ConversationHeaderProps {
  agent: ConversationHeaderAgent | null;
  onTap: () => void;
  onNewChat?: () => void;
  className?: string;
}

/**
 * ChatGPT-style header - clean, minimal, centered agent selector
 */
export function ConversationHeader({ agent, onTap, onNewChat, className }: ConversationHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      {/* Left spacer for balance */}
      <div className="w-10" />
      
      {/* Center - Agent selector (tappable) */}
      <button
        onClick={onTap}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors',
          'touch-manipulation active:scale-[0.98]'
        )}
      >
        {agent ? (
          <>
            <span className="font-medium text-sm text-foreground">
              {agent.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">Select agent</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </>
        )}
      </button>
      
      {/* Right - New chat button */}
      {onNewChat && (
        <button
          onClick={onNewChat}
          className={cn(
            'h-10 w-10 flex items-center justify-center rounded-full',
            'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors',
            'touch-manipulation active:scale-[0.98]'
          )}
          aria-label="New chat"
        >
          <PenSquare className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
      {!onNewChat && <div className="w-10" />}
    </div>
  );
}
