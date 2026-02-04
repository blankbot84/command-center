import {
  FlaskConical,
  Building2,
  Terminal,
  Newspaper,
  Bot,
  User,
  type LucideIcon,
} from 'lucide-react';

/**
 * Map of icon names to Lucide icon components
 */
const iconMap: Record<string, LucideIcon> = {
  'flask-conical': FlaskConical,
  'building-2': Building2,
  'terminal': Terminal,
  'newspaper': Newspaper,
  'bot': Bot,
  'user': User,
};

/**
 * Get a Lucide icon component by name
 * Falls back to Bot icon if not found
 */
export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Bot;
}

/**
 * Agent color mapping for icon backgrounds (TMNT-inspired)
 */
export const agentColors: Record<string, { bg: string; text: string }> = {
  'murphie': { bg: 'bg-purple-500/20', text: 'text-purple-500' },
  'eight': { bg: 'bg-orange-500/20', text: 'text-orange-500' },
  'console': { bg: 'bg-red-500/20', text: 'text-red-500' },
  'daily': { bg: 'bg-blue-500/20', text: 'text-blue-500' },
  'bam': { bg: 'bg-emerald-500/20', text: 'text-emerald-500' },
  'intel': { bg: 'bg-blue-500/20', text: 'text-blue-500' },
};

/**
 * Get agent colors by ID, with fallback
 */
export function getAgentColors(agentId: string): { bg: string; text: string } {
  return agentColors[agentId] || { bg: 'bg-muted', text: 'text-muted-foreground' };
}
