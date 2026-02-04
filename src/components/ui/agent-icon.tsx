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
}

const iconMap = {
  bot: Bot,
  'flask-conical': FlaskConical,
  building2: Building2,
  terminal: Terminal,
  newspaper: Newspaper,
  search: Search,
};

export function AgentIcon({ icon, className }: AgentIconProps) {
  const IconComponent = iconMap[icon] || Bot;
  return <IconComponent className={cn('h-5 w-5', className)} />;
}
