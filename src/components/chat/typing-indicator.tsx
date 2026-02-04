'use client';

import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 p-4 rounded-lg bg-background">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 pt-3">
        <span className="sr-only">AI is typing</span>
        <span 
          className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" 
          style={{ animationDelay: '0ms' }}
        />
        <span 
          className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" 
          style={{ animationDelay: '150ms' }}
        />
        <span 
          className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" 
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
