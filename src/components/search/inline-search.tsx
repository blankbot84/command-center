'use client';

import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/hooks/use-search';
import type { Note } from '@/lib/types';
import type { Agent } from '@/lib/mission-control-data';
import type { AgentDetail } from '@/lib/data-source';
import type { SearchResult, GroupedResults } from '@/lib/search';
import { FileText, Bot, Calendar, Brain, Mic, Users } from 'lucide-react';

interface InlineSearchProps {
  notes: Note[];
  agents: Agent[];
  agentDetails: Map<string, AgentDetail>;
  memoryContent?: string;
  onResultClick?: (result: SearchResult) => void;
  autoFocus?: boolean;
  className?: string;
}

export function InlineSearch({
  notes,
  agents,
  agentDetails,
  memoryContent,
  onResultClick,
  autoFocus = true,
  className,
}: InlineSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    groupedResults,
    isSearching,
    resultCount,
    clearSearch,
  } = useSearch({ notes, agents, agentDetails, memoryContent });

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      // Small delay to ensure the view has transitioned
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Sticky search input */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, agents, logs..."
            className={cn(
              'flex-1 bg-transparent outline-none',
              'font-mono text-base placeholder:text-muted-foreground',
              // Larger text for mobile
              'text-[16px]' // Prevents iOS zoom on focus
            )}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 -mr-2 hover:bg-secondary active:bg-secondary/80 rounded-none"
              aria-label="Clear search"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="px-4 py-12 text-center">
            <span className="font-mono text-sm text-muted-foreground">
              Searching...
            </span>
          </div>
        ) : query && resultCount === 0 ? (
          <div className="px-4 py-12 text-center">
            <span className="text-4xl block mb-3">🔍</span>
            <span className="font-mono text-sm text-muted-foreground">
              No results for "{query}"
            </span>
          </div>
        ) : query ? (
          <InlineResults
            groupedResults={groupedResults}
            onResultClick={handleResultClick}
          />
        ) : (
          <div className="px-4 py-12 text-center">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="font-mono text-sm text-muted-foreground mb-2">
              Search across everything
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              Notes • Agents • Daily logs
            </p>
          </div>
        )}
      </div>

      {/* Result count footer */}
      {query && resultCount > 0 && (
        <div className="sticky bottom-0 px-4 py-2 border-t border-border bg-background">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

// Inline results with larger tap targets
interface InlineResultsProps {
  groupedResults: GroupedResults;
  onResultClick: (result: SearchResult) => void;
}

function InlineResults({ groupedResults, onResultClick }: InlineResultsProps) {
  const { notes, agents, dailyNotes, memory } = groupedResults;

  return (
    <div className="divide-y divide-border">
      {notes.length > 0 && (
        <ResultSection
          title="Notes"
          icon={<FileText className="w-4 h-4" />}
          color="donnie"
          results={notes}
          onResultClick={onResultClick}
          renderIcon={(result) => (
            result.metadata.noteType === 'voice' 
              ? <Mic className="w-4 h-4 text-donnie" />
              : <Users className="w-4 h-4 text-mikey" />
          )}
        />
      )}

      {agents.length > 0 && (
        <ResultSection
          title="Agents"
          icon={<Bot className="w-4 h-4" />}
          color="leo"
          results={agents}
          onResultClick={onResultClick}
          renderIcon={(result) => (
            <span className="text-base">{result.metadata.agentEmoji}</span>
          )}
        />
      )}

      {dailyNotes.length > 0 && (
        <ResultSection
          title="Daily Notes"
          icon={<Calendar className="w-4 h-4" />}
          color="mikey"
          results={dailyNotes}
          onResultClick={onResultClick}
          renderIcon={(result) => (
            <span className="text-sm">{result.metadata.agentEmoji}</span>
          )}
        />
      )}

      {memory.length > 0 && (
        <ResultSection
          title="Memory"
          icon={<Brain className="w-4 h-4" />}
          color="raph"
          results={memory}
          onResultClick={onResultClick}
          renderIcon={() => <Brain className="w-4 h-4 text-raph" />}
        />
      )}
    </div>
  );
}

interface ResultSectionProps {
  title: string;
  icon: React.ReactNode;
  color: 'leo' | 'raph' | 'donnie' | 'mikey';
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  renderIcon: (result: SearchResult) => React.ReactNode;
}

function ResultSection({
  title,
  icon,
  color,
  results,
  onResultClick,
  renderIcon,
}: ResultSectionProps) {
  const colorClass = {
    leo: 'text-leo border-l-leo',
    raph: 'text-raph border-l-raph',
    donnie: 'text-donnie border-l-donnie',
    mikey: 'text-mikey border-l-mikey',
  }[color];

  return (
    <div className="py-2">
      {/* Section header */}
      <div className={cn('flex items-center gap-2 px-4 py-2', colorClass)}>
        {icon}
        <span className="font-mono text-xs uppercase tracking-wider font-medium">
          {title}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          ({results.length})
        </span>
      </div>

      {/* Results - larger tap targets for mobile */}
      <div>
        {results.map((result) => (
          <ResultItem
            key={result.id}
            result={result}
            onClick={() => onResultClick(result)}
            icon={renderIcon(result)}
            colorClass={colorClass}
          />
        ))}
      </div>
    </div>
  );
}

interface ResultItemProps {
  result: SearchResult;
  onClick: () => void;
  icon: React.ReactNode;
  colorClass: string;
}

function ResultItem({ result, onClick, icon, colorClass }: ResultItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 hover:bg-secondary/50 active:bg-secondary transition-colors',
        'border-l-2 border-l-transparent',
        // Larger minimum height for thumb-friendly tapping
        'min-h-[56px]',
        colorClass
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="font-mono text-sm font-medium truncate">
            {result.title}
          </div>

          {/* Snippet with highlights */}
          <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
            <HighlightedSnippet text={result.snippet} />
          </div>

          {/* Metadata */}
          {result.metadata.date && (
            <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">
              {result.metadata.date}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function HighlightedSnippet({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return (
            <span key={i} className="bg-mikey/20 text-foreground font-medium px-0.5">
              {content}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
