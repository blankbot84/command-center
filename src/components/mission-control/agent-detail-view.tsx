'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Agent, formatRelativeTime } from '@/lib/mission-control-data';
import { AgentDetail, DailyNote } from '@/lib/data-source';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, RefreshCw, X } from 'lucide-react';

interface AgentDetailViewProps {
  agent: Agent;
  detail: AgentDetail | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onClose?: () => void;
}

const statusColors: Record<Agent['status'], string> = {
  idle: 'bg-muted-foreground',
  working: 'bg-raph',
  blocked: 'bg-leo',
};

const statusLabels: Record<Agent['status'], string> = {
  idle: 'idle',
  working: 'working',
  blocked: 'blocked',
};

const agentColors: Record<string, string> = {
  leo: 'border-t-leo',
  raph: 'border-t-raph',
  donnie: 'border-t-donnie',
  mikey: 'border-t-mikey',
};

export function AgentDetailView({
  agent,
  detail,
  isLoading,
  onRefresh,
  onClose,
}: AgentDetailViewProps) {
  const [soulExpanded, setSoulExpanded] = useState(false);
  const [selectedDailyNote, setSelectedDailyNote] = useState<DailyNote | null>(null);

  // Extract body content from markdown (strip frontmatter)
  const extractContent = (markdown: string | null): string => {
    if (!markdown) return '';
    // Remove YAML frontmatter
    const stripped = markdown.replace(/^---[\s\S]*?---\n*/m, '');
    return stripped.trim();
  };

  const workingContent = extractContent(detail?.workingMd ?? null);
  const soulContent = extractContent(detail?.soulMd ?? null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={cn(
          'p-4 border-b border-border border-t-[3px]',
          agentColors[agent.color] || 'border-t-muted-foreground'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-3xl flex-shrink-0">{agent.emoji}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium truncate">{agent.name}</h2>
                {/* Status badge */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider',
                    agent.status === 'working' && 'bg-raph/20 text-raph',
                    agent.status === 'idle' && 'bg-muted text-muted-foreground',
                    agent.status === 'blocked' && 'bg-leo/20 text-leo'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', statusColors[agent.status])} />
                  {statusLabels[agent.status]}
                </span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                {agent.role}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className={cn(
                  'p-2 hover:bg-muted rounded transition-colors',
                  isLoading && 'animate-spin'
                )}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Last active timestamp */}
        <div className="mt-2 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
          Active {formatRelativeTime(agent.lastActive)}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* WORKING.md Section */}
            <div className="p-4 border-b border-border">
              {workingContent ? (
                <div className="prose prose-sm dark:prose-invert prose-headings:font-mono prose-headings:text-xs prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-muted-foreground prose-headings:font-normal prose-h2:mt-4 prose-h2:mb-2 prose-p:text-sm prose-p:leading-relaxed prose-ul:text-sm prose-li:text-sm max-w-none">
                  <ReactMarkdown>{workingContent}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No WORKING.md found</p>
              )}
            </div>

            {/* SOUL.md Section (Collapsible) */}
            <div className="border-b border-border">
              <button
                onClick={() => setSoulExpanded(!soulExpanded)}
                className="w-full p-4 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
              >
                {soulExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  SOUL.md
                </span>
                {!soulContent && (
                  <span className="text-[10px] text-muted-foreground italic ml-2">(not found)</span>
                )}
              </button>

              {soulExpanded && soulContent && (
                <div className="px-4 pb-4">
                  <div className="prose prose-sm dark:prose-invert prose-headings:font-mono prose-headings:text-xs prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-muted-foreground prose-headings:font-normal prose-h2:mt-4 prose-h2:mb-2 prose-p:text-sm prose-p:leading-relaxed prose-ul:text-sm prose-li:text-sm max-w-none">
                    <ReactMarkdown>{soulContent}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Notes Section */}
            <div className="p-4">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                Daily Notes
              </h3>

              {detail?.dailyNotes && detail.dailyNotes.length > 0 ? (
                <>
                  {/* Date pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {detail.dailyNotes.map((note) => (
                      <button
                        key={note.date}
                        onClick={() =>
                          setSelectedDailyNote(
                            selectedDailyNote?.date === note.date ? null : note
                          )
                        }
                        className={cn(
                          'px-3 py-1.5 rounded font-mono text-[11px] transition-colors',
                          selectedDailyNote?.date === note.date
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        )}
                      >
                        {formatDate(note.date)}
                      </button>
                    ))}
                  </div>

                  {/* Selected note content */}
                  {selectedDailyNote && (
                    <div className="bg-muted/30 rounded p-4">
                      <div className="prose prose-sm dark:prose-invert prose-headings:font-mono prose-headings:text-xs prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-muted-foreground prose-headings:font-normal prose-h2:mt-4 prose-h2:mb-2 prose-p:text-sm prose-p:leading-relaxed prose-ul:text-sm prose-li:text-sm max-w-none">
                        <ReactMarkdown>
                          {extractContent(selectedDailyNote.content)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">No daily notes found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper to format date as "Feb 2"
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
