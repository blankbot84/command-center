'use client';

import { useState, useCallback } from 'react';
import { mockAgents, mockTasks, mockActivity, Agent } from '@/lib/mission-control-data';
import { AgentDetail, MockDataSource, GitHubDataSource, DataSource } from '@/lib/data-source';
import { AgentCard } from './agent-card';
import { AgentDetailView } from './agent-detail-view';
import { ActivityFeed } from './activity-feed';
import { TaskList } from './task-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Initialize data source based on environment
function getDataSource(): DataSource {
  const source = process.env.NEXT_PUBLIC_DATA_SOURCE || 'mock';
  if (source === 'github') {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    return new GitHubDataSource(token);
  }
  return new MockDataSource();
}

export function SquadDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentDetail, setAgentDetail] = useState<AgentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Fetch agent detail when an agent is selected
  const fetchAgentDetail = useCallback(async (agent: Agent) => {
    setIsLoadingDetail(true);
    try {
      const dataSource = getDataSource();
      const detail = await dataSource.getAgentDetail(agent.id);
      setAgentDetail(detail);
    } catch (error) {
      console.error('Failed to fetch agent detail:', error);
      setAgentDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const handleAgentClick = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setAgentDetail(null); // Clear previous detail
    fetchAgentDetail(agent);
  }, [fetchAgentDetail]);

  const handleRefresh = useCallback(() => {
    if (selectedAgent) {
      fetchAgentDetail(selectedAgent);
    }
  }, [selectedAgent, fetchAgentDetail]);

  const handleClose = useCallback(() => {
    setSelectedAgent(null);
    setAgentDetail(null);
  }, []);

  // Stats
  const workingCount = mockAgents.filter(a => a.status === 'working').length;
  const blockedCount = mockAgents.filter(a => a.status === 'blocked').length;
  const inProgressTasks = mockTasks.filter(t => t.status === 'in_progress').length;
  const blockedTasks = mockTasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="min-h-full">
      {/* Quick Stats Bar */}
      <div className="border-b border-border px-4 py-3 flex gap-6 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-raph" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {workingCount} Working
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {mockAgents.length - workingCount - blockedCount} Idle
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-leo" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {blockedCount} Blocked
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {inProgressTasks} in progress
          </span>
          {blockedTasks > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-destructive">
                {blockedTasks} blocked
              </span>
            </>
          )}
        </div>
      </div>

      {/* Mobile Layout: Tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue="squad" className="h-full">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-11 p-0">
            <TabsTrigger
              value="squad"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-raph data-[state=active]:bg-transparent font-mono text-[10px] uppercase tracking-widest h-full"
            >
              Squad
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-mikey data-[state=active]:bg-transparent font-mono text-[10px] uppercase tracking-widest h-full"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-donnie data-[state=active]:bg-transparent font-mono text-[10px] uppercase tracking-widest h-full"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="squad" className="mt-0 p-4">
            <div className="grid grid-cols-1 gap-3">
              {mockAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => handleAgentClick(agent)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <TaskList tasks={mockTasks} />
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <ActivityFeed activities={mockActivity} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout: Three columns */}
      <div className="hidden lg:flex h-[calc(100vh-120px)]">
        {/* Left: Agent Cards */}
        <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto">
          <div className="sticky top-0 bg-background z-10 px-4 py-3 border-b border-border">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Squad
            </span>
            <span className="font-mono text-[10px] text-muted-foreground ml-2">
              {mockAgents.length}
            </span>
          </div>
          <div className="p-3 space-y-3">
            {mockAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => handleAgentClick(agent)}
              />
            ))}
          </div>
        </div>

        {/* Center: Tasks */}
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-background z-10 px-4 py-3 border-b border-border">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tasks
            </span>
            <span className="font-mono text-[10px] text-muted-foreground ml-2">
              {mockTasks.length}
            </span>
          </div>
          <TaskList tasks={mockTasks} />
        </div>

        {/* Right: Activity Feed */}
        <div className="w-80 flex-shrink-0 border-l border-border overflow-y-auto">
          <div className="sticky top-0 bg-background z-10 px-4 py-3 border-b border-border">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Activity
            </span>
          </div>
          <ActivityFeed activities={mockActivity} />
        </div>
      </div>

      {/* Agent Detail Sheet */}
      <Sheet open={!!selectedAgent} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-xl">
          {selectedAgent && (
            <AgentDetailView
              agent={selectedAgent}
              detail={agentDetail}
              isLoading={isLoadingDetail}
              onRefresh={handleRefresh}
              onClose={handleClose}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
