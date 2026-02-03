'use client';

import { useState } from 'react';
import { KanbanBoard } from './kanban-board';
import { SquadDashboard } from './mission-control/squad-dashboard';
import { AppSidebar, NavView } from './app-sidebar';
import { MobileNav } from './mobile-nav';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

// Placeholder components for upcoming views
function ActivityView() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <span className="text-6xl mb-4 block">📊</span>
        <h2 className="font-mono text-lg font-bold tracking-wider uppercase mb-2">Activity</h2>
        <p className="text-muted-foreground font-mono text-sm">Coming soon...</p>
      </div>
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
