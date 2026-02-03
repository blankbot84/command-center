'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavView } from './app-sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

const navItems: { id: NavView; label: string; icon: string; color: string }[] = [
  { id: 'notes', label: 'Notes', icon: '📝', color: 'text-donnie' },
  { id: 'squad', label: 'Squad', icon: '🤖', color: 'text-raph' },
  { id: 'activity', label: 'Activity', icon: '📊', color: 'text-leo' },
  { id: 'memory', label: 'Memory', icon: '🧠', color: 'text-purple-400' },
  { id: 'search', label: 'Search', icon: '🔍', color: 'text-mikey' },
  { id: 'settings', label: 'Settings', icon: '⚙️', color: 'text-muted-foreground' },
];

interface MobileSheetNavProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
}

export function MobileSheetNav({ currentView, onViewChange }: MobileSheetNavProps) {
  const [open, setOpen] = useState(false);

  const handleNavigation = (view: NavView) => {
    onViewChange(view);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Hamburger trigger - only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 -ml-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl pb-8">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Navigation
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <SheetClose asChild key={item.id}>
              <button
                onClick={() => handleNavigation(item.id)}
                className={cn(
                  'flex items-center gap-4 w-full px-4 py-4 rounded-lg transition-colors text-left',
                  'hover:bg-accent active:bg-accent/80',
                  currentView === item.id && 'bg-accent'
                )}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <span className={cn(
                    'font-mono text-sm font-medium uppercase tracking-wider',
                    currentView === item.id ? item.color : 'text-foreground'
                  )}>
                    {item.label}
                  </span>
                </div>
                {currentView === item.id && (
                  <span className={cn('w-2 h-2 rounded-full', item.color.replace('text-', 'bg-'))} />
                )}
              </button>
            </SheetClose>
          ))}
        </nav>

        {/* Safe area for home indicator on iOS */}
        <div className="h-4" />
      </SheetContent>
    </Sheet>
  );
}
