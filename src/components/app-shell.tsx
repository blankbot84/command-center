'use client';

import { useState, useEffect } from 'react';
import { NotesView } from './notes-view';
import { SquadDashboard } from './mission-control/squad-dashboard';
import { ActivityFeed } from './mission-control/activity-feed';
import { SearchBar, InlineSearch } from './search';
import { ThemeToggle } from './theme-toggle';
import { SettingsView } from './settings-view';
import { cn } from '@/lib/utils';
import { getDataSourceInstance } from '@/lib/data';
import { AppSidebar, NavView } from './app-sidebar';
import { MobileNav } from './mobile-nav';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import type { Activity } from '@/lib/mission-control-data';
import type { Note } from '@/lib/types';
import type { Agent } from '@/lib/mission-control-data';
import type { AgentDetail } from '@/lib/data-source';

// ActivityView - standalone view showing full activity feed
function ActivityView() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const dataSource = getDataSourceInstance();
      const data = await dataSource.getActivity();
      setActivities(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="font-mono text-sm font-bold tracking-wider uppercase">Activity Log</h2>
          <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
            Recent agent activity
          </p>
        </div>
        <button
          onClick={fetchActivities}
          disabled={isLoading}
          className={cn(
            'px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider',
            'border border-border hover:bg-accent transition-colors',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto">
        <ActivityFeed
          activities={activities}
          isLoading={isLoading}
          onRefresh={fetchActivities}
          lastRefresh={lastRefresh}
        />
      </div>
    </div>
  );
}

// SearchView - inline search for mobile, with ⌘K hint on desktop
function SearchView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentDetails, setAgentDetails] = useState<Map<string, AgentDetail>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const dataSource = getDataSourceInstance();
        const [notesData, agentsData] = await Promise.all([
          dataSource.getNotes(),
          dataSource.getAgents(),
        ]);
        setNotes(notesData);
        setAgents(agentsData);
        
        // Fetch agent details
        const details = new Map<string, AgentDetail>();
        for (const agent of agentsData) {
          const detail = await dataSource.getAgentDetail(agent.id);
          if (detail) {
            details.set(agent.id, detail);
          }
        }
        setAgentDetails(details);
      } catch (error) {
        console.error('Failed to fetch search data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-mono text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Inline search - works great on mobile, also good on desktop */}
      <InlineSearch
        notes={notes}
        agents={agents}
        agentDetails={agentDetails}
        autoFocus={true}
        className="flex-1"
      />
      
      {/* Desktop hint for ⌘K - hidden on mobile */}
      <div className="hidden md:flex items-center justify-center py-2 border-t border-border bg-secondary/30">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          Tip: Press ⌘K anywhere for quick search
        </span>
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

  // Global ⌘K shortcut to jump to search from anywhere
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setView('search');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderView = () => {
    switch (view) {
      case 'notes':
        return <NotesView />;
      case 'squad':
        return <SquadDashboard />;
      case 'activity':
        return <ActivityView />;
      case 'search':
        return <SearchView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <NotesView />;
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
