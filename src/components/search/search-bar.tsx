'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchResults } from './search-results';
import { useSearch } from '@/hooks/use-search';
import type { Note } from '@/lib/types';
import type { Agent } from '@/lib/mission-control-data';
import type { AgentDetail } from '@/lib/data-source';
import type { SearchResult } from '@/lib/search';

interface SearchBarProps {
  notes: Note[];
  agents: Agent[];
  agentDetails: Map<string, AgentDetail>;
  memoryContent?: string;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

export function SearchBar({
  notes,
  agents,
  agentDetails,
  memoryContent,
  onResultClick,
  className,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    results,
    groupedResults,
    isSearching,
    resultCount,
    clearSearch,
  } = useSearch({ notes, agents, agentDetails, memoryContent });

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        clearSearch();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, clearSearch]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    setIsOpen(false);
    clearSearch();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search trigger button (collapsed state) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5',
            'bg-secondary/50 border border-border rounded-none',
            'font-mono text-xs text-muted-foreground',
            'hover:bg-secondary hover:text-foreground transition-colors'
          )}
        >
          <Search className="w-3.5 h-3.5 text-orange-500" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-background/50 border border-border text-[10px]">
            <Command className="w-2.5 h-2.5 text-blue-400" />
            <span>K</span>
          </kbd>
        </button>
      )}

      {/* Expanded search input + results */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/50">
          <div className="w-full max-w-2xl bg-background border border-border shadow-lg">
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, agents, daily notes..."
                className={cn(
                  'flex-1 bg-transparent outline-none',
                  'font-mono text-sm placeholder:text-muted-foreground'
                )}
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="p-1 hover:bg-secondary rounded-none"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center px-1.5 py-0.5 bg-secondary border border-border text-[10px] text-muted-foreground font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-8 text-center">
                  <span className="font-mono text-xs text-muted-foreground">
                    Searching...
                  </span>
                </div>
              ) : query && resultCount === 0 ? (
                <div className="px-4 py-8 text-center">
                  <span className="font-mono text-xs text-muted-foreground">
                    No results for "{query}"
                  </span>
                </div>
              ) : query ? (
                <SearchResults
                  groupedResults={groupedResults}
                  onResultClick={handleResultClick}
                />
              ) : (
                <div className="px-4 py-8 text-center">
                  <span className="font-mono text-xs text-muted-foreground">
                    Start typing to search...
                  </span>
                </div>
              )}
            </div>

            {/* Footer with result count */}
            {query && resultCount > 0 && (
              <div className="px-4 py-2 border-t border-border">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  {resultCount} result{resultCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
