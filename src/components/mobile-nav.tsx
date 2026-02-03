'use client';

import { cn } from '@/lib/utils';
import { NavView } from './app-sidebar';

const navItems: { id: NavView; label: string; icon: string }[] = [
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'squad', label: 'Squad', icon: '🤖' },
  { id: 'activity', label: 'Activity', icon: '📊' },
  { id: 'memory', label: 'Memory', icon: '🧠' },
  { id: 'search', label: 'Search', icon: '🔍' },
];

interface MobileNavProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
}

export function MobileNav({ currentView, onViewChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 transition-colors',
              currentView === item.id
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-mono text-[9px] uppercase tracking-wider">
              {item.label}
            </span>
            {currentView === item.id && (
              <span className="absolute bottom-0 h-0.5 w-8 bg-primary" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
