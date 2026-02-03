'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { getDataSourceInstance } from '@/lib/data';
import type { MemoryData } from '@/lib/data-source';

interface DailyNoteEntryProps {
  date: string;
  content: string;
  defaultExpanded?: boolean;
}

function DailyNoteEntry({ date, content, defaultExpanded = false }: DailyNoteEntryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Format date for display
  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Check if it's today or yesterday
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isToday = date === today;
  const isYesterday = date === yesterday;

  return (
    <div className="border border-border bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 transition-colors',
          'hover:bg-accent/50 active:bg-accent',
          'touch-manipulation' // Better mobile touch response
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📅</span>
          <div className="text-left">
            <div className="font-mono text-sm font-medium">
              {isToday ? 'Today' : isYesterday ? 'Yesterday' : date}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {displayDate}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(isToday || isYesterday) && (
            <span className={cn(
              'px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest',
              isToday ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
            )}>
              {isToday ? 'Today' : 'Yesterday'}
            </span>
          )}
          <span
            className={cn(
              'text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Collapsible content with animation */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-4 border-t border-border bg-background/50">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="font-mono text-lg font-bold tracking-wider mb-3 text-foreground">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-mono text-sm font-bold tracking-wider uppercase mt-4 mb-2 text-muted-foreground border-b border-border pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-mono text-xs font-bold tracking-wider uppercase mt-3 mb-1 text-muted-foreground">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-foreground/90 mb-2 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1 mb-3 ml-1">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-foreground/90 flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>{children}</span>
                  </li>
                ),
                code: ({ children }) => (
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-foreground">
                    {children}
                  </code>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MemoryView() {
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMemory = async () => {
    setIsLoading(true);
    try {
      const dataSource = getDataSourceInstance();
      const data = await dataSource.getMemory();
      setMemoryData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch memory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  if (isLoading && !memoryData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="text-4xl mb-3 block animate-pulse">🧠</span>
          <span className="font-mono text-sm text-muted-foreground">Loading memory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div>
          <h2 className="font-mono text-sm font-bold tracking-wider uppercase">
            Long-Term Memory
          </h2>
          <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {memoryData?.dailyNotes.length || 0} daily notes
            {lastRefresh && (
              <span className="ml-2">
                • Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchMemory}
          disabled={isLoading}
          className={cn(
            'px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider',
            'border border-border hover:bg-accent transition-colors',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* MEMORY.md Section */}
        {memoryData?.memoryMd && (
          <section className="border-b border-border">
            <div className="px-4 py-3 bg-purple-500/10 border-b border-border flex items-center gap-3">
              <div className="w-1 h-6 bg-purple-500" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-purple-400">
                MEMORY.md
              </span>
              <span className="font-mono text-[10px] text-muted-foreground ml-auto">
                Core memory
              </span>
            </div>
            <div className="p-4 md:p-6">
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="font-mono text-xl font-bold tracking-wider mb-4 text-foreground flex items-center gap-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="font-mono text-sm font-bold tracking-wider uppercase mt-6 mb-3 text-muted-foreground border-b border-border pb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-mono text-xs font-bold tracking-wider uppercase mt-4 mb-2 text-purple-400">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm text-foreground/90 mb-3 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-1.5 mb-4 ml-4 list-decimal">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm text-foreground/90 flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{children}</span>
                      </li>
                    ),
                    code: ({ children }) => (
                      <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                        {children}
                      </code>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    hr: () => (
                      <hr className="border-border my-6" />
                    ),
                    em: ({ children }) => (
                      <em className="text-muted-foreground italic">{children}</em>
                    ),
                  }}
                >
                  {memoryData.memoryMd}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {/* Daily Notes Section */}
        <section className="pb-20 md:pb-4">
          <div className="px-4 py-3 bg-blue-500/10 border-b border-border flex items-center gap-3 sticky top-0 z-10">
            <div className="w-1 h-6 bg-blue-500" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-blue-400">
              Daily Notes
            </span>
            <span className="font-mono text-[10px] text-muted-foreground ml-auto">
              {memoryData?.dailyNotes.length || 0} entries
            </span>
          </div>

          {memoryData?.dailyNotes && memoryData.dailyNotes.length > 0 ? (
            <div className="divide-y divide-border">
              {memoryData.dailyNotes.map((note, index) => (
                <DailyNoteEntry
                  key={note.date}
                  date={note.date}
                  content={note.content}
                  defaultExpanded={index === 0} // Expand most recent by default
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <span className="text-4xl mb-3 block">📭</span>
                <span className="font-mono text-sm text-muted-foreground">
                  No daily notes found
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
