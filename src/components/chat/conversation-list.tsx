'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getIcon, getAgentColors } from '@/lib/icons';

export interface ConversationItem {
  id: string;
  agentId: string;
  agentIcon: string;
  agentName: string;
  lastMessage: string;
  timestamp: string; // Formatted timestamp like "2m", "1h", "3d"
  unreadCount?: number;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  activeId?: string;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  open,
  onOpenChange,
}: ConversationListProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl" showCloseButton={false}>
        <SheetHeader className="flex flex-row items-center justify-between pb-2">
          <SheetTitle className="text-lg">Conversations</SheetTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onNewChat();
            }}
            className="gap-1"
          >
            <Plus className="h-4 w-4 text-emerald-500" />
            New Chat
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-4 px-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No conversations yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onNewChat();
                }}
                className="mt-2"
              >
                Start a new chat
              </Button>
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {conversations.map((conversation) => {
                const Icon = getIcon(conversation.agentIcon);
                const colors = getAgentColors(conversation.agentId);
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      onSelect(conversation.id);
                      onOpenChange(false);
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg',
                      'hover:bg-muted/50 transition-colors',
                      'min-h-[56px] touch-manipulation text-left',
                      activeId === conversation.id && 'bg-muted'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      colors.bg
                    )}>
                      <Icon className={cn('h-5 w-5', colors.text)} aria-label={conversation.agentName} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground truncate">
                          {conversation.agentName}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {conversation.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <span className="shrink-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
