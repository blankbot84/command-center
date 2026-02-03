'use client';

import { useState } from 'react';
import { NotesView } from './notes-view';
import { SquadDashboard } from './mission-control/squad-dashboard';
import { AppSidebar, NavView } from './app-sidebar';
import { MobileNav } from './mobile-nav';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { sampleNotes } from '@/lib/data';
import { mockAgents } from '@/lib/mission-control-data';
import { MockDataSource } from '@/lib/data-source';
import type { AgentDetail } from '@/lib/data-source';
import type { SearchResult } from '@/lib/search';

type View = 'notes' | 'mission-control';

export function AppShell() {
  const [view, setView] = useState<View>('notes');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with nav */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        {/* Title bar */}
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-mono text-sm font-bold tracking-[0.25em] uppercase">
              {view === 'notes' ? 'PLAUD' : 'MISSION'}
            </h1>
            <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
              {view === 'notes' ? 'NOTES' : 'CONTROL'}
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* View switcher */}
        <div className="flex border-t border-border">
          <button
            onClick={() => setView('notes')}
            className={cn(
              'flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors',
              'border-b-2',
              view === 'notes'
                ? 'border-b-donnie text-foreground'
                : 'border-b-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <span className={cn('w-2 h-2 inline-block mr-2', view === 'notes' ? 'bg-donnie' : 'bg-muted-foreground')} />
            Notes
          </button>
          <button
            onClick={() => setView('mission-control')}
            className={cn(
              'flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors',
              'border-b-2',
              view === 'mission-control'
                ? 'border-b-raph text-foreground'
                : 'border-b-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <span className={cn('w-2 h-2 inline-block mr-2', view === 'mission-control' ? 'bg-raph' : 'bg-muted-foreground')} />
            Mission Control
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === 'notes' ? (
          <NotesView embedded />
        ) : (
          <SquadDashboard />
        )}
      </main>
    </div>
  );
}

function SearchView() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <span className="text-6xl mb-4 block">🔍</span>
        <h2 className="font-mono text-lg font-bold tracking-wider uppercase mb-2">Search</h2>
        <p className="text-muted-foreground font-mono text-sm">Coming soon...</p>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <span className="text-6xl mb-4 block">⚙️</span>
        <h2 className="font-mono text-lg font-bold tracking-wider uppercase mb-2">Settings</h2>
        <p className="text-muted-foreground font-mono text-sm">Coming soon...</p>
      </div>
    </div>
  );
}

// View title mapping
const viewTitles: Record<NavView, { title: string; subtitle: string; color: string }> = {
  notes: { title: 'PLAUD', subtitle: 'NOTES', color: 'text-donnie' },
  squad: { title: 'MISSION', subtitle: 'CONTROL', color: 'text-raph' },
  activity: { title: 'ACTIVITY', subtitle: 'LOG', color: 'text-leo' },
  search: { title: 'SEARCH', subtitle: 'ALL', color: 'text-mikey' },
  settings: { title: 'SETTINGS', subtitle: 'CONFIG', color: 'text-muted-foreground' },
};

export function AppShell() {
  const [view, setView] = useState<NavView>('notes');
  const currentTitle = viewTitles[view];

  const renderView = () => {
    switch (view) {
      case 'notes':
        return <KanbanBoard embedded />;
      case 'squad':
        return <SquadDashboard />;
      case 'activity':
        return <ActivityView />;
      case 'search':
        return <SearchView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <KanbanBoard embedded />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar currentView={view} onViewChange={setView} />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background px-4">
            <SidebarTrigger className="-ml-1 hidden md:flex" />
            <div className="flex items-center gap-3">
              <div>
                <h1 className={cn('font-mono text-sm font-bold tracking-[0.25em] uppercase', currentTitle.color)}>
                  {currentTitle.title}
                </h1>
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
                  {currentTitle.subtitle}
                </span>
              </div>
            </div>
          </header>

          {/* Main content - add bottom padding on mobile for nav */}
          <main className="flex-1 overflow-hidden pb-16 md:pb-0">
            {renderView()}
          </main>
        </div>
      </SidebarInset>

      {/* Mobile bottom navigation */}
      <MobileNav currentView={view} onViewChange={setView} />
    </SidebarProvider>
  );
}
