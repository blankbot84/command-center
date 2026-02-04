'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface PickerAgent {
  id: string;
  emoji: string;
  name: string;
  role: string;
  available?: boolean;
}

interface AgentPickerProps {
  agents: PickerAgent[];
  onSelect: (agentId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentPicker({
  agents,
  onSelect,
  open,
  onOpenChange,
}: AgentPickerProps) {
  const availableAgents = agents.filter(a => a.available !== false);
  const unavailableAgents = agents.filter(a => a.available === false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">New Conversation</SheetTitle>
          <SheetDescription>Choose an agent to chat with</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-1 pb-4">
            {availableAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  onSelect(agent.id);
                  onOpenChange(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-lg',
                  'hover:bg-muted/50 transition-colors',
                  'min-h-[56px] touch-manipulation text-left',
                  'border border-transparent hover:border-border'
                )}
              >
                <span className="text-3xl" role="img" aria-label={agent.name}>
                  {agent.emoji}
                </span>
                <div className="flex-1">
                  <span className="font-medium text-foreground block">
                    {agent.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {agent.role}
                  </span>
                </div>
              </button>
            ))}

            {unavailableAgents.length > 0 && (
              <>
                <div className="px-2 py-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Unavailable
                  </span>
                </div>
                {unavailableAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-lg',
                      'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-3xl grayscale" role="img" aria-label={agent.name}>
                      {agent.emoji}
                    </span>
                    <div className="flex-1">
                      <span className="font-medium text-foreground block">
                        {agent.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {agent.role}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
