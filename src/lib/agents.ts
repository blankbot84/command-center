import type { ChatAgent } from '@/types/chat';

/**
 * Registry of agents available for chat
 */
export const chatAgents: ChatAgent[] = [
  {
    id: 'murphie',
    name: 'Murphie',
    emoji: '🧪',
    role: 'QA Specialist',
    available: true,
  },
  {
    id: 'eight',
    name: 'Eight',
    emoji: '🏢',
    role: 'Dealership Dev',
    available: true,
  },
  {
    id: 'console',
    name: 'Console',
    emoji: '💥',
    role: 'DevOps',
    available: true,
  },
  {
    id: 'daily',
    name: 'Daily Brief',
    emoji: '📰',
    role: 'Strategic Synthesis',
    available: true,
  },
];

/**
 * Get agent by ID
 */
export function getAgentById(id: string): ChatAgent | undefined {
  return chatAgents.find((agent) => agent.id === id);
}

/**
 * Get available agents only
 */
export function getAvailableAgents(): ChatAgent[] {
  return chatAgents.filter((agent) => agent.available);
}
