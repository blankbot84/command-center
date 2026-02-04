// Mock data for Mission Control UI
// Easy to swap for Convex later

export type AgentStatus = 'idle' | 'working' | 'blocked';
export type AgentIcon = 'bot' | 'flask-conical' | 'building2' | 'terminal' | 'newspaper' | 'search';

export interface Agent {
  id: string;
  name: string;
  icon: AgentIcon;
  role: string;
  status: AgentStatus;
  focus: string | null;
  blockers: string[] | null; // Parsed from WORKING.md
  lastActive: Date;
  color: string; // TMNT-inspired
}

export type TaskStatus = 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done' | 'blocked';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string[]; // agent ids
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityType = 
  | 'task_created'
  | 'task_assigned'
  | 'status_changed'
  | 'comment_posted'
  | 'document_created'
  | 'agent_status';

export interface Activity {
  id: string;
  type: ActivityType;
  agentId: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// MOCK AGENTS
// ─────────────────────────────────────────────────────────────

export const mockAgents: Agent[] = [
  {
    id: 'bam',
    name: 'Bam',
    icon: 'terminal',
    role: 'AI Architect',
    status: 'idle',
    focus: null,
    blockers: null,
    lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    color: 'leo', // blue
  },
  {
    id: 'eight',
    name: 'Eight',
    icon: 'building2',
    role: 'Dealership Dev',
    status: 'working',
    focus: 'GA4 integration for Sam Boswell',
    blockers: null,
    lastActive: new Date(Date.now() - 30 * 1000), // 30 sec ago
    color: 'raph', // red
  },
  {
    id: 'murphie',
    name: 'Murphie',
    icon: 'flask-conical',
    role: 'QA Specialist',
    status: 'working',
    focus: 'Visual regression test suite',
    blockers: null,
    lastActive: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
    color: 'donnie', // purple
  },
  {
    id: 'daily',
    name: 'Daily Brief',
    icon: 'newspaper',
    role: 'Strategic Synthesis',
    status: 'idle',
    focus: null,
    blockers: null,
    lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    color: 'mikey', // orange
  },
  {
    id: 'intel',
    name: 'Molt Intel',
    icon: 'search',
    role: 'Research & Analysis',
    status: 'blocked',
    focus: 'Competitor pricing analysis',
    blockers: ['Waiting on API credentials for automotive data provider'],
    lastActive: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    color: 'leo',
  },
];

// ─────────────────────────────────────────────────────────────
// MOCK TASKS
// ─────────────────────────────────────────────────────────────

const now = Date.now();

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'GA4 event tracking for VDP pages',
    description: 'Implement Google Analytics 4 event tracking for all vehicle detail pages across Sam Boswell rooftops.',
    status: 'in_progress',
    assignedTo: ['eight'],
    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now - 30 * 60 * 1000),
  },
  {
    id: 'task-2',
    title: 'Set up Murphie visual testing pipeline',
    description: 'Configure agent-browser integration for automated visual regression tests.',
    status: 'in_progress',
    assignedTo: ['murphie'],
    createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now - 2 * 60 * 1000),
  },
  {
    id: 'task-3',
    title: 'Competitor pricing scraper - blocked on access',
    description: 'Need API credentials for automotive data provider.',
    status: 'blocked',
    assignedTo: ['intel'],
    createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now - 45 * 60 * 1000),
  },
  {
    id: 'task-4',
    title: 'Review Plaud kanban mobile UX',
    description: 'Test the new mobile-optimized kanban on actual devices.',
    status: 'review',
    assignedTo: ['bam', 'murphie'],
    createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now - 10 * 60 * 1000),
  },
  {
    id: 'task-5',
    title: 'Morning briefing automation',
    description: 'Auto-generate daily briefings from calendar, emails, and project updates.',
    status: 'done',
    assignedTo: ['daily'],
    createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now - 8 * 60 * 60 * 1000),
  },
  {
    id: 'task-6',
    title: 'PDF report generator for Murphie',
    description: 'Create mobile-optimized PDF reports with screenshots and executive summaries.',
    status: 'inbox',
    assignedTo: [],
    createdAt: new Date(now - 30 * 60 * 1000),
    updatedAt: new Date(now - 30 * 60 * 1000),
  },
  {
    id: 'task-7',
    title: 'Junction table migration for Eight',
    description: 'Migrate dealership relationships to proper junction table architecture.',
    status: 'assigned',
    assignedTo: ['eight'],
    createdAt: new Date(now - 12 * 60 * 60 * 1000),
    updatedAt: new Date(now - 6 * 60 * 60 * 1000),
  },
];

// ─────────────────────────────────────────────────────────────
// MOCK ACTIVITY FEED
// ─────────────────────────────────────────────────────────────

export const mockActivity: Activity[] = [
  {
    id: 'act-1',
    type: 'status_changed',
    agentId: 'eight',
    description: 'Started working on "GA4 event tracking for VDP pages"',
    timestamp: new Date(now - 30 * 1000),
  },
  {
    id: 'act-2',
    type: 'task_created',
    agentId: 'bam',
    description: 'Created task "PDF report generator for Murphie"',
    timestamp: new Date(now - 30 * 60 * 1000),
  },
  {
    id: 'act-3',
    type: 'comment_posted',
    agentId: 'murphie',
    description: 'Commented on "Visual testing pipeline": "Playwright integration working, need screenshot diff setup"',
    timestamp: new Date(now - 45 * 60 * 1000),
  },
  {
    id: 'act-4',
    type: 'status_changed',
    agentId: 'intel',
    description: 'Marked "Competitor pricing scraper" as blocked - waiting on API access',
    timestamp: new Date(now - 1 * 60 * 60 * 1000),
  },
  {
    id: 'act-5',
    type: 'task_assigned',
    agentId: 'bam',
    description: 'Assigned "Review Plaud kanban mobile UX" to Murphie',
    timestamp: new Date(now - 2 * 60 * 60 * 1000),
  },
  {
    id: 'act-6',
    type: 'document_created',
    agentId: 'daily',
    description: 'Generated morning briefing for Feb 2',
    timestamp: new Date(now - 8 * 60 * 60 * 1000),
  },
  {
    id: 'act-7',
    type: 'status_changed',
    agentId: 'daily',
    description: 'Went idle after completing briefing',
    timestamp: new Date(now - 8 * 60 * 60 * 1000),
  },
  {
    id: 'act-8',
    type: 'task_created',
    agentId: 'eight',
    description: 'Created task "Junction table migration"',
    timestamp: new Date(now - 12 * 60 * 60 * 1000),
  },
  {
    id: 'act-9',
    type: 'status_changed',
    agentId: 'murphie',
    description: 'Started working on "Visual regression test suite"',
    timestamp: new Date(now - 14 * 60 * 60 * 1000),
  },
  {
    id: 'act-10',
    type: 'task_assigned',
    agentId: 'bam',
    description: 'Assigned "GA4 event tracking" to Eight',
    timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'act-11',
    type: 'comment_posted',
    agentId: 'intel',
    description: 'Commented on pricing analysis: "Found 3 competitors with similar feature sets"',
    timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'act-12',
    type: 'status_changed',
    agentId: 'eight',
    description: 'Completed "Rooftop selector component"',
    timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'act-13',
    type: 'agent_status',
    agentId: 'bam',
    description: 'Session started - reviewing agent architecture',
    timestamp: new Date(now - 5 * 60 * 1000),
  },
  {
    id: 'act-14',
    type: 'document_created',
    agentId: 'murphie',
    description: 'Created QA checklist for mobile testing',
    timestamp: new Date(now - 4 * 60 * 60 * 1000),
  },
  {
    id: 'act-15',
    type: 'task_created',
    agentId: 'intel',
    description: 'Created research brief "AI coding assistants market analysis"',
    timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000),
  },
];

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function getAgent(id: string): Agent | undefined {
  return mockAgents.find(a => a.id === id);
}

export function getAgentsByStatus(status: AgentStatus): Agent[] {
  return mockAgents.filter(a => a.status === status);
}

export function getTasksByStatus(status: TaskStatus): Task[] {
  return mockTasks.filter(t => t.status === status);
}

export function getTasksForAgent(agentId: string): Task[] {
  return mockTasks.filter(t => t.assignedTo.includes(agentId));
}

export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
