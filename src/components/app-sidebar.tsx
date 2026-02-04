'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

export type NavView = 'notes' | 'squad' | 'activity' | 'memory' | 'chat' | 'search' | 'settings';

const navItems: { id: NavView; label: string; icon: string; color: string }[] = [
  { id: 'chat', label: 'Chat', icon: '💬', color: 'bg-emerald-500' },
  { id: 'memory', label: 'Memory', icon: '🧠', color: 'bg-purple-500' },
  { id: 'activity', label: 'Activity', icon: '📊', color: 'bg-leo' },
  { id: 'search', label: 'Search', icon: '🔍', color: 'bg-mikey' },
  { id: 'notes', label: 'Notes', icon: '📝', color: 'bg-donnie' },
  { id: 'squad', label: 'Squad', icon: '🤖', color: 'bg-raph' },
  { id: 'settings', label: 'Settings', icon: '⚙️', color: 'bg-muted-foreground' },
];

interface AppSidebarProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
}

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* Header with branding */}
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground font-mono font-bold text-sm">
            CC
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold tracking-[0.15em] uppercase">
                COMMAND
              </span>
              <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
                CENTER
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    isActive={currentView === item.id}
                    tooltip={item.label}
                    className={cn(
                      'font-mono text-xs uppercase tracking-wider',
                      currentView === item.id && 'bg-sidebar-accent'
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                    {currentView === item.id && (
                      <span
                        className={cn(
                          'ml-auto size-2 rounded-full',
                          item.color
                        )}
                      />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with theme toggle */}
      <SidebarFooter className="border-t border-border">
        <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'justify-between px-2')}>
          {!isCollapsed && (
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Theme
            </span>
          )}
          <ThemeToggle />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
