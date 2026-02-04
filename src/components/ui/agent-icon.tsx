'use client';

import {
  Bot,
  FlaskConical,
  Building2,
  Terminal,
  Newspaper,
  Search,
} from 'lucide-react';
import type { AgentIcon as AgentIconType } from '@/lib/mission-control-data';
import { cn } from '@/lib/utils';

interface AgentIconProps {
  icon: AgentIconType;
  className?: string;
  agentId?: string;
}

const iconMap = {
  bot: Bot,
  'flask-conical': FlaskConical,
  building2: Building2,
  terminal: Terminal,
  newspaper: Newspaper,
  search: Search,
};

// Agent-specific icon colors (TMNT-inspired)
const agentIconColors: Record<string, string> = {
  'murphie': 'text-purple-500',
  'eight': 'text-orange-500',
  'console': 'text-red-500',
  'daily': 'text-blue-500',
  'bam': 'text-emerald-500',
  'intel': 'text-blue-400',
};

// Icon-based fallback colors
const iconColors: Record<string, string> = {
  'flask-conical': 'text-purple-500',  // Murphie (QA)
  'building2': 'text-orange-500',      // Eight (Dealership)
  'terminal': 'text-emerald-500',      // Bam (Architect)
  'newspaper': 'text-blue-500',        // Daily Brief
  'search': 'text-blue-400',           // Intel
  'bot': 'text-zinc-400',              // Default
};

export function AgentIcon({ icon, className, agentId }: AgentIconProps) {
  const IconComponent = iconMap[icon] || Bot;
  
  // Use agent-specific color if agentId provided, otherwise icon-based color
  const colorClass = agentId 
    ? agentIconColors[agentId] || iconColors[icon] || 'text-zinc-400'
    : iconColors[icon] || 'text-zinc-400';
  
  return <IconComponent className={cn('h-5 w-5', colorClass, className)} />;
}
