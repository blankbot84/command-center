'use client';

import { useState, useEffect } from 'react';
import { NotesView } from './notes-view';
import { SquadDashboard } from './mission-control/squad-dashboard';
import { ActivityFeed } from './mission-control/activity-feed';
import { SearchBar } from './search';
import { ThemeToggle } from './theme-toggle';
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

// SearchView - opens the search modal
function SearchView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentDetails, setAgentDetails] = useState<Map<string, AgentDetail>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
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
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">🔍</span>
        <h2 className="font-mono text-lg font-bold tracking-wider uppercase mb-2">Search</h2>
        <p className="text-muted-foreground font-mono text-sm mb-6">
          Search across notes, agents, and daily logs
        </p>
        
        {/* Search bar that triggers the modal */}
        <div className="flex justify-center">
          <SearchBar
            notes={notes}
            agents={agents}
            agentDetails={agentDetails}
            className="w-full max-w-sm"
          />
        </div>
        
        <p className="text-muted-foreground font-mono text-[10px] mt-4 uppercase tracking-wider">
          Tip: Press ⌘K anywhere to search
        </p>
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
