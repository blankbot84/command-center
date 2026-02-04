'use client';

import { FileText, Bot, Calendar, Brain, Mic, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroupedResults, SearchResult } from '@/lib/search';
import { AgentIcon } from '@/components/ui/agent-icon';
import type { AgentIcon as AgentIconType } from '@/lib/mission-control-data';

interface SearchResultsProps {
  groupedResults: GroupedResults;
  onResultClick: (result: SearchResult) => void;
}

export function SearchResults({ groupedResults, onResultClick }: SearchResultsProps) {
  const { notes, agents, dailyNotes, memory } = groupedResults;

  const hasNotes = notes.length > 0;
  const hasAgents = agents.length > 0;
  const hasDailyNotes = dailyNotes.length > 0;
  const hasMemory = memory.length > 0;

  return (
    <div className="divide-y divide-border">
      {/* Notes section */}
      {hasNotes && (
        <ResultSection
          title="Notes"
          icon={<FileText className="w-3.5 h-3.5 text-purple-500" />}
          color="donnie"
          results={notes}
          onResultClick={onResultClick}
          renderIcon={(result) => (
            result.metadata.noteType === 'voice' 
              ? <Mic className="w-3.5 h-3.5 text-pink-500" />
              : <Users className="w-3.5 h-3.5 text-orange-500" />
          )}
        />
      )}

      {/* Agents section */}
      {hasAgents && (
        <ResultSection
          title="Agents"
          icon={<Bot className="w-3.5 h-3.5 text-emerald-500" />}
          color="leo"
          results={agents}
          onResultClick={onResultClick}
          renderIcon={(result) => (
            result.metadata.agentIcon 
              ? <AgentIcon icon={result.metadata.agentIcon as AgentIconType} className="w-3.5 h-3.5" agentId={result.metadata.agentId as string} />
              : <Bot className="w-3.5 h-3.5 text-emerald-500" />
          )}
        />
      )}

      {/* Daily Notes section */}
      {hasDailyNotes && (
        <ResultSection
          title="Daily Notes"
          icon={<Calendar className="w-3.5 h-3.5 text-blue-500" />}
          color="mikey"
          results={dailyNotes}
          onResultClick={onResultClick}
          renderIcon={(result) => (
            result.metadata.agentIcon 
              ? <AgentIcon icon={result.metadata.agentIcon as AgentIconType} className="w-3.5 h-3.5" agentId={result.metadata.agentId as string} />
              : <Calendar className="w-3.5 h-3.5 text-blue-500" />
          )}
        />
      )}

      {/* Memory section */}
      {hasMemory && (
        <ResultSection
          title="Memory"
          icon={<Brain className="w-3.5 h-3.5 text-purple-500" />}
          color="raph"
          results={memory}
          onResultClick={onResultClick}
          renderIcon={() => <Brain className="w-3.5 h-3.5 text-purple-500" />}
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
      <div className={cn('flex items-center gap-2 px-4 py-1.5', colorClass)}>
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {title}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          ({results.length})
        </span>
      </div>

      {/* Results */}
      <div className="space-y-0.5">
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
        'w-full text-left px-4 py-2 hover:bg-secondary/50 transition-colors',
        'border-l-2 border-l-transparent hover:border-l-2',
        colorClass
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="font-mono text-xs font-medium truncate">
            {result.title}
          </div>

          {/* Snippet with highlights */}
          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            <HighlightedSnippet text={result.snippet} />
          </div>

          {/* Metadata */}
          {result.metadata.date && (
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              {result.metadata.date}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Render snippet with **highlights** as styled spans
 */
function HighlightedSnippet({ text }: { text: string }) {
  // Split by **..** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // This is a highlighted match
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
