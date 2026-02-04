/**
 * Client-side search engine for Command Center
 * 
 * Indexes notes, agents, daily notes, and memory content
 * Provides full-text search with highlighting
 */

import type { Note } from './types';
import type { Agent, Activity } from './mission-control-data';
import type { DailyNote, AgentDetail } from './data-source';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type SearchResultType = 'note' | 'agent' | 'daily-note' | 'memory';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet: string;        // Matched text with highlights
  score: number;          // Relevance score
  metadata: {
    agentId?: string;
    date?: string;
    noteType?: 'voice' | 'meeting';
    agentName?: string;
    agentIcon?: string;
  };
}

export interface SearchableItem {
  id: string;
  type: SearchResultType;
  title: string;
  content: string;        // Full searchable text
  metadata: SearchResult['metadata'];
}

export interface SearchIndex {
  items: SearchableItem[];
  lastUpdated: Date;
}

// ─────────────────────────────────────────────────────────────
// INDEXING
// ─────────────────────────────────────────────────────────────

/**
 * Build a search index from all available content
 */
export function buildSearchIndex(data: {
  notes: Note[];
  agents: Agent[];
  agentDetails: Map<string, AgentDetail>;
  memoryContent?: string;
}): SearchIndex {
  const items: SearchableItem[] = [];

  // Index notes
  for (const note of data.notes) {
    items.push({
      id: `note-${note.id}`,
      type: 'note',
      title: note.title,
      content: [
        note.title,
        note.synopsis,
        note.takeaways.join(' '),
        note.actions.map(a => a.text).join(' '),
        note.transcript,
      ].join(' ').toLowerCase(),
      metadata: {
        date: note.date,
        noteType: note.type,
      },
    });
  }

  // Index agents (basic info + SOUL.md + WORKING.md)
  for (const agent of data.agents) {
    const detail = data.agentDetails.get(agent.id);
    
    items.push({
      id: `agent-${agent.id}`,
      type: 'agent',
      title: agent.name,
      content: [
        agent.name,
        agent.role,
        agent.focus || '',
        detail?.soulMd || '',
        detail?.workingMd || '',
      ].join(' ').toLowerCase(),
      metadata: {
        agentId: agent.id,
        agentName: agent.name,
        agentIcon: agent.icon,
      },
    });

    // Index daily notes for each agent
    if (detail?.dailyNotes) {
      for (const daily of detail.dailyNotes) {
        items.push({
          id: `daily-${agent.id}-${daily.date}`,
          type: 'daily-note',
          title: `${agent.name} - ${daily.date}`,
          content: daily.content.toLowerCase(),
          metadata: {
            agentId: agent.id,
            agentName: agent.name,
            agentIcon: agent.icon,
            date: daily.date,
          },
        });
      }
    }
  }

  // Index MEMORY.md if provided
  if (data.memoryContent) {
    items.push({
      id: 'memory-main',
      type: 'memory',
      title: 'MEMORY.md',
      content: data.memoryContent.toLowerCase(),
      metadata: {},
    });
  }

  return {
    items,
    lastUpdated: new Date(),
  };
}

// ─────────────────────────────────────────────────────────────
// SEARCHING
// ─────────────────────────────────────────────────────────────

/**
 * Search the index for matching items
 */
export function search(
  index: SearchIndex,
  query: string,
  options: {
    maxResults?: number;
    types?: SearchResultType[];
  } = {}
): SearchResult[] {
  const { maxResults = 20, types } = options;
  
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 1);
  
  if (queryTerms.length === 0) {
    return [];
  }

  const results: SearchResult[] = [];

  for (const item of index.items) {
    // Filter by type if specified
    if (types && !types.includes(item.type)) {
      continue;
    }

    // Calculate match score
    const { score, matchedText } = calculateScore(item, queryTerms, normalizedQuery);
    
    if (score > 0) {
      results.push({
        id: item.id,
        type: item.type,
        title: item.title,
        snippet: highlightMatches(matchedText, queryTerms),
        score,
        metadata: item.metadata,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * Calculate relevance score for an item
 */
function calculateScore(
  item: SearchableItem,
  queryTerms: string[],
  fullQuery: string
): { score: number; matchedText: string } {
  let score = 0;
  let matchedText = '';
  
  const titleLower = item.title.toLowerCase();
  const contentLower = item.content;

  // Exact phrase match in title (highest priority)
  if (titleLower.includes(fullQuery)) {
    score += 100;
  }

  // Exact phrase match in content
  if (contentLower.includes(fullQuery)) {
    score += 50;
  }

  // Individual term matches
  for (const term of queryTerms) {
    // Title matches are worth more
    if (titleLower.includes(term)) {
      score += 20;
    }
    
    // Content matches
    const termCount = (contentLower.match(new RegExp(escapeRegex(term), 'g')) || []).length;
    score += Math.min(termCount * 2, 30); // Cap at 30 points per term
  }

  // Find best matching snippet
  if (score > 0) {
    matchedText = findBestSnippet(item.content, queryTerms, fullQuery);
  }

  return { score, matchedText };
}

/**
 * Find the best snippet containing query matches
 */
function findBestSnippet(
  content: string,
  queryTerms: string[],
  fullQuery: string,
  snippetLength: number = 150
): string {
  // Try to find exact phrase first
  let bestIndex = content.indexOf(fullQuery);
  
  // Otherwise find first term
  if (bestIndex === -1) {
    for (const term of queryTerms) {
      const idx = content.indexOf(term);
      if (idx !== -1) {
        bestIndex = idx;
        break;
      }
    }
  }

  if (bestIndex === -1) {
    return content.slice(0, snippetLength) + '...';
  }

  // Extract snippet around the match
  const start = Math.max(0, bestIndex - 40);
  const end = Math.min(content.length, bestIndex + snippetLength - 40);
  
  let snippet = content.slice(start, end);
  
  // Clean up snippet
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Highlight matched terms in text
 */
function highlightMatches(text: string, queryTerms: string[]): string {
  let highlighted = text;
  
  for (const term of queryTerms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    highlighted = highlighted.replace(regex, '**$1**');
  }
  
  return highlighted;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────
// GROUPING
// ─────────────────────────────────────────────────────────────

export interface GroupedResults {
  notes: SearchResult[];
  agents: SearchResult[];
  dailyNotes: SearchResult[];
  memory: SearchResult[];
}

/**
 * Group search results by type
 */
export function groupResults(results: SearchResult[]): GroupedResults {
  return {
    notes: results.filter(r => r.type === 'note'),
    agents: results.filter(r => r.type === 'agent'),
    dailyNotes: results.filter(r => r.type === 'daily-note'),
    memory: results.filter(r => r.type === 'memory'),
  };
}
