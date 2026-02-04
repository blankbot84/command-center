'use client';

import {
  MessageSquare,
  Brain,
  Activity,
  Search,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
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
import type { LucideIcon } from 'lucide-react';

export type NavView = 'notes' | 'squad' | 'activity' | 'memory' | 'chat' | 'search' | 'settings';

const navItems: { id: NavView; label: string; icon: LucideIcon; color: string; iconColor: string }[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'bg-emerald-500', iconColor: 'text-emerald-500' },
  { id: 'memory', label: 'Memory', icon: Brain, color: 'bg-purple-500', iconColor: 'text-purple-500' },
  { id: 'activity', label: 'Activity', icon: Activity, color: 'bg-blue-500', iconColor: 'text-blue-500' },
  { id: 'search', label: 'Search', icon: Search, color: 'bg-orange-500', iconColor: 'text-orange-500' },
  { id: 'notes', label: 'Notes', icon: FileText, color: 'bg-purple-500', iconColor: 'text-purple-400' },
  { id: 'squad', label: 'Squad', icon: Users, color: 'bg-red-500', iconColor: 'text-red-500' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'bg-zinc-500', iconColor: 'text-zinc-400' },
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
                    <item.icon className={cn('h-5 w-5 transition-colors', item.iconColor)} />
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
