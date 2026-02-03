/**
 * Data Source Abstraction Layer
 * 
 * Provides a unified interface for fetching Command Center data from:
 * - MockDataSource: In-memory mock data for development/testing
 * - GitHubDataSource: Live data from blankbot84/life-data repo
 */

import matter from 'gray-matter';
import {
  mockAgents,
  mockActivity,
  type Agent,
  type Activity,
} from './mission-control-data';
import { sampleNotes } from './data';
import { type Note, type Task, type TaskStatus, type TaskPriority } from './types';

// ─────────────────────────────────────────────────────────────
// WORKING.MD PARSING UTILITIES
// ─────────────────────────────────────────────────────────────

export interface ParsedWorkingMd {
  focus: string | null;
  blockers: string[] | null;
  activeTasks: string[];
  status: 'active' | 'idle' | 'blocked' | null;
}

/**
 * Parse WORKING.md content to extract focus, blockers, and tasks
 */
export function parseWorkingMd(content: string): ParsedWorkingMd {
  const result: ParsedWorkingMd = {
    focus: null,
    blockers: null,
    activeTasks: [],
    status: null,
  };

  if (!content) return result;

  // Extract "## Current Focus" section
  const focusMatch = content.match(/##\s*Current\s*Focus\s*\n([\s\S]*?)(?=\n##|\n---|\z)/i);
  if (focusMatch) {
    const focusContent = focusMatch[1].trim();
    // Remove bullet points and get clean text
    const lines = focusContent.split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line && !line.startsWith('_') && line !== 'None' && line !== 'Awaiting assignment');
    result.focus = lines.length > 0 ? lines[0] : null;
  }

  // Extract "## Blockers" section
  const blockersMatch = content.match(/##\s*Blockers?\s*\n([\s\S]*?)(?=\n##|\n---|\z)/i);
  if (blockersMatch) {
    const blockersContent = blockersMatch[1].trim();
    if (!blockersContent.includes('_None') && !blockersContent.includes('No blockers')) {
      const blockers = blockersContent.split('\n')
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(line => line && !line.startsWith('_'));
      if (blockers.length > 0) {
        result.blockers = blockers;
      }
    }
  }

  // Extract active tasks (unchecked items from "## Active Tasks")
  const tasksMatch = content.match(/##\s*Active\s*Tasks?\s*\n([\s\S]*?)(?=\n##|\n---|\z)/i);
  if (tasksMatch) {
    const tasksContent = tasksMatch[1].trim();
    const tasks = tasksContent.split('\n')
      .filter(line => line.match(/^-\s*\[\s*\]/)) // Unchecked items
      .map(line => line.replace(/^-\s*\[\s*\]\s*/, '').trim())
      .filter(line => line);
    result.activeTasks = tasks;
  }

  // Extract status from frontmatter or content
  const statusMatch = content.match(/status:\s*(active|idle|blocked|working|busy|offline)/i);
  if (statusMatch) {
    const rawStatus = statusMatch[1].toLowerCase();
    if (rawStatus === 'active' || rawStatus === 'working' || rawStatus === 'busy') {
      result.status = 'active';
    } else if (rawStatus === 'blocked' || rawStatus === 'offline') {
      result.status = 'blocked';
    } else {
      result.status = 'idle';
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────

export interface AgentDetail {
  agent: Agent;
  workingMd: string | null;    // Raw markdown content
  soulMd: string | null;       // Raw markdown content  
  dailyNotes: DailyNote[];     // Recent daily notes
}

export interface DailyNote {
  date: string;        // YYYY-MM-DD
  content: string;     // Raw markdown
}

export interface SquadOverview {
  agents: Agent[];
  lastUpdated: Date;
}

export interface MemoryData {
  memoryMd: string;
  dailyNotes: Array<{ date: string; content: string }>;
}

export interface DataSource {
  getAgents(): Promise<Agent[]>;
  getNotes(): Promise<Note[]>;
  getActivity(): Promise<Activity[]>;
  getAgentDetail(agentId: string): Promise<AgentDetail | null>;
  getTasks(): Promise<Task[]>;
  getMemory(): Promise<MemoryData>;
}

// Agent state from WORKING.md frontmatter
interface AgentWorkingState {
  id: string;
  status: 'active' | 'idle' | 'busy' | 'offline';
  focus?: string;
  lastActive: string;
}

// Agent registry from _registry.yaml
interface AgentRegistryEntry {
  name: string;
  emoji: string;
  role: string;
  color: string;
  model?: string;
  workspace?: string;
  channels?: string[];
}

// Note frontmatter from markdown files
interface NoteFrontmatter {
  id: string;
  type: 'voice' | 'meeting';
  status: 'processing' | 'ready' | 'archived';
  created: string;
  title: string;
  tags?: string[];
  duration?: number;
  source?: 'plaud' | 'manual' | 'import';
  summary?: string;
  actionItems?: string[];
  participants?: string[];
}

// Task frontmatter from markdown files
interface TaskFrontmatter {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees?: string[];
  created?: string;
  updated?: string;
  due?: string;
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA SOURCE
// ─────────────────────────────────────────────────────────────

// Sample mock tasks for development
const mockTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Build task system for Command Center',
    status: 'active',
    priority: 'high',
    assignees: ['murphie'],
    description: 'Implement file-based task storage with markdown + frontmatter format. Create Kanban view for task management.',
    created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated: new Date().toISOString(),
    tags: ['command-center', 'feature'],
  },
  {
    id: 'task-002',
    title: 'GA4 integration for Sam Boswell',
    status: 'active',
    priority: 'high',
    assignees: ['eight'],
    description: 'Implement Google Analytics 4 event tracking for all vehicle detail pages across Sam Boswell rooftops.',
    created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['dealership', 'analytics'],
  },
  {
    id: 'task-003',
    title: 'Visual regression test suite',
    status: 'active',
    priority: 'medium',
    assignees: ['murphie'],
    description: 'Configure Playwright for automated visual regression tests with screenshot comparison.',
    created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['testing', 'qa'],
  },
  {
    id: 'task-004',
    title: 'Research competitor pricing tools',
    status: 'inbox',
    priority: 'medium',
    assignees: ['intel'],
    description: 'Analyze competitor pricing strategies and identify opportunities for differentiation.',
    created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['research', 'market'],
  },
  {
    id: 'task-005',
    title: 'Morning briefing automation',
    status: 'done',
    priority: 'medium',
    assignees: ['daily'],
    description: 'Auto-generate daily briefings from calendar, emails, and project updates.',
    created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['automation', 'daily'],
  },
  {
    id: 'task-006',
    title: 'Review mobile kanban UX',
    status: 'inbox',
    priority: 'low',
    assignees: [],
    description: 'Test the mobile kanban experience on various devices and gather feedback.',
    created: new Date().toISOString(),
    tags: ['ux', 'mobile'],
  },
  {
    id: 'task-007',
    title: 'Set up life-data sync script',
    status: 'done',
    priority: 'high',
    assignees: ['murphie', 'bam'],
    description: 'Create sync-life-data.sh script to push agent state to GitHub repo.',
    created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['infrastructure', 'sync'],
  },
];

export class MockDataSource implements DataSource {
  async getAgents(): Promise<Agent[]> {
    return mockAgents;
  }

  async getNotes(): Promise<Note[]> {
    return sampleNotes;
  }

  async getActivity(): Promise<Activity[]> {
    return mockActivity;
  }

  async getTasks(): Promise<Task[]> {
    return mockTasks;
  }

  async getAgentDetail(agentId: string): Promise<AgentDetail | null> {
    const agent = mockAgents.find(a => a.id === agentId);
    if (!agent) return null;

    // Mock WORKING.md content
    const workingMd = `---
id: ${agentId}
status: ${agent.status}
focus: ${agent.focus || 'None'}
lastActive: ${agent.lastActive.toISOString()}
---

# WORKING.md - Current State

## Status: ${agent.status === 'working' ? '🟢 Active' : agent.status === 'blocked' ? '🔴 Blocked' : '⚪ Idle'}

## Current Focus
${agent.focus || 'Awaiting assignment'}

## Active Tasks
- [ ] Primary task in progress
- [ ] Secondary follow-up item
- [x] Previously completed item

## Blockers
${agent.status === 'blocked' ? '- Waiting on external dependency' : '_None currently_'}

## Recent Completions
- Completed initial setup (yesterday)
- Reviewed project requirements (2 days ago)
`;

    // Mock SOUL.md content
    const soulMd = `---
id: ${agentId}
name: ${agent.name}
emoji: "${agent.emoji}"
role: ${agent.role}
version: 1.0.0
---

# SOUL.md - ${agent.name}

You're the **${agent.name}** ${agent.emoji}

## Mission
${getMockMission(agentId)}

## Personality
${getMockPersonality(agentId)}

## Expertise Areas
${getMockExpertise(agentId)}

## Communication Style
- Evidence-based approach
- Clear and concise updates
- Proactive problem identification

## Values
- Quality over speed
- Continuous improvement
- Team collaboration
`;

    // Mock daily notes
    const today = new Date();
    const dailyNotes: DailyNote[] = [];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dailyNotes.push({
        date: dateStr,
        content: `# Daily Notes - ${dateStr}

## Morning
- Started work on ${agent.focus || 'project tasks'}
- Reviewed overnight updates

## Progress
- Made progress on primary objectives
- Addressed blocking issues

## Notes
- Context for tomorrow: continue current focus
`,
      });
    }

    return {
      agent,
      workingMd,
      soulMd,
      dailyNotes,
    };
  }

  async getMemory(): Promise<MemoryData> {
    const today = new Date();
    const dailyNotes: Array<{ date: string; content: string }> = [];

    // Generate mock daily notes for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      dailyNotes.push({
        date: dateStr,
        content: `# ${dateStr}

## Morning Session
- Started day reviewing overnight messages
- Checked calendar for upcoming meetings
- Brief sync with the squad

## Work Items
- [x] Reviewed PR #${Math.floor(Math.random() * 100 + 1)}
- [x] Updated documentation for new feature
- [ ] Follow up on pending feedback

## Notes
- Key insight: ${['Need to improve test coverage', 'Good progress on main objective', 'Waiting on dependencies'][i % 3]}
- Tomorrow: Continue with current focus

## Reflections
${i === 0 ? 'Productive day overall. Made good progress on the main project.' : 'Wrapped up pending items from yesterday.'}
`,
      });
    }

    const memoryMd = `# 🧠 MEMORY.md - Long-Term Memory

## Who I Am
I'm **Murphie** 🐢 — Quality assurance specialist and testing automation expert for the agent squad.

## Key Context

### Bam (Human)
- Works on dealership web projects
- Uses Plaud for voice notes and meeting recordings
- Prefers concise, actionable summaries
- Night owl - often works late

### The Squad
- **Eight** 🎱 - Dealership integrations specialist
- **Daily** ☀️ - Morning briefings and daily digests
- **Intel** 🔍 - Research and competitive analysis

## Important Lessons Learned
1. Always run visual regression tests before PR reviews
2. Mobile-first design is critical for Command Center
3. Keep WORKING.md updated for context continuity

## Preferences & Patterns
- Bam likes dark mode in all apps
- Quick responses are preferred over perfect ones
- Use emoji sparingly but meaningfully

## Active Projects
- **Command Center** - Unified dashboard for agent squad and Plaud notes
- **Life Data Sync** - GitHub-based state management

## Milestones
- 2025-02-01: Command Center MVP launched
- 2025-02-02: Added activity feed and search

---
*Last updated: ${today.toISOString().split('T')[0]}*
`;

    return {
      memoryMd,
      dailyNotes,
    };
  }
}

// Helper functions for mock data
function getMockMission(agentId: string): string {
  const missions: Record<string, string> = {
    bam: 'Architect and guide the AI agent ecosystem, ensuring seamless collaboration between agents.',
    eight: 'Build and maintain dealership integrations with pixel-perfect attention to detail.',
    murphie: 'Ensure quality through comprehensive testing, visual regression, and automated QA.',
    daily: 'Synthesize information from multiple sources into actionable daily briefings.',
    intel: 'Research, analyze, and provide strategic intelligence on competitors and markets.',
  };
  return missions[agentId] || 'Support the team with specialized capabilities.';
}

function getMockPersonality(agentId: string): string {
  const personalities: Record<string, string> = {
    bam: '- Strategic thinker\\n- Systems architect\\n- Collaborative leader',
    eight: '- Detail-oriented\\n- Dealership domain expert\\n- Integration specialist',
    murphie: '- Quality obsessed\\n- Visual-first mindset\\n- Thorough and methodical',
    daily: '- Information synthesizer\\n- Clear communicator\\n- Early riser',
    intel: '- Analytical mind\\n- Research-driven\\n- Pattern recognition',
  };
  return personalities[agentId] || '- Dedicated team member\\n- Problem solver\\n- Continuous learner';
}

function getMockExpertise(agentId: string): string {
  const expertise: Record<string, string> = {
    bam: '- AI Architecture\\n- Agent Coordination\\n- System Design',
    eight: '- GA4 Integration\\n- Dealership Systems\\n- Web Development',
    murphie: '- Visual Testing\\n- Playwright/Puppeteer\\n- QA Automation',
    daily: '- Information Synthesis\\n- Report Generation\\n- Calendar Integration',
    intel: '- Market Research\\n- Competitive Analysis\\n- Data Mining',
  };
  return expertise[agentId] || '- General Development\\n- Problem Solving\\n- Documentation';
}

// ─────────────────────────────────────────────────────────────
// GITHUB DATA SOURCE
// ─────────────────────────────────────────────────────────────

const GITHUB_REPO = 'blankbot84/life-data';
const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubDataSource implements DataSource {
  private token?: string;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL: number = 60 * 1000; // 1 minute default

  constructor(token?: string, cacheTTL?: number) {
    this.token = token;
    if (cacheTTL) this.cacheTTL = cacheTTL;
  }

  private async fetchRaw(path: string): Promise<string> {
    const cacheKey = `raw:${path}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as string;
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.raw',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${path}`;
    const res = await fetch(url, { headers, next: { revalidate: 60 } });
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`File not found: ${path}`);
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    this.cache.set(cacheKey, { data: text, timestamp: Date.now() });
    return text;
  }

  private async fetchDirectory(path: string): Promise<{ name: string; type: string; path: string }[]> {
    const cacheKey = `dir:${path}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as { name: string; type: string; path: string }[];
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${path}`;
    const res = await fetch(url, { headers, next: { revalidate: 60 } });
    
    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const items = await res.json();
    this.cache.set(cacheKey, { data: items, timestamp: Date.now() });
    return items;
  }

  async getAgents(): Promise<Agent[]> {
    const agents: Agent[] = [];

    // Get list of agent directories
    const agentDirs = await this.fetchDirectory('agents');
    const agentFolders = agentDirs.filter(
      (item) => item.type === 'dir' && !item.name.startsWith('_')
    );

    // Try to fetch registry for metadata
    let registry: Record<string, AgentRegistryEntry> = {};
    try {
      const registryYaml = await this.fetchRaw('agents/_registry.yaml');
      // Simple YAML parsing (for nested structure like agents: {...})
      registry = this.parseSimpleYamlRegistry(registryYaml);
    } catch {
      // Registry not found, will use defaults
      console.warn('Agent registry not found, using defaults');
    }

    // Fetch WORKING.md for each agent
    for (const folder of agentFolders) {
      try {
        const workingMd = await this.fetchRaw(`agents/${folder.name}/WORKING.md`);
        const { data } = matter(workingMd);
        const state = data as AgentWorkingState;
        const regEntry = registry[folder.name];

        // Parse WORKING.md for focus and blockers
        const parsed = parseWorkingMd(workingMd);

        const agent: Agent = {
          id: folder.name,
          name: regEntry?.name || this.capitalize(folder.name),
          emoji: regEntry?.emoji || '🤖',
          role: regEntry?.role || 'Agent',
          status: this.mapStatus(state.status),
          focus: parsed.focus || state.focus || null,
          blockers: parsed.blockers,
          lastActive: new Date(state.lastActive || Date.now()),
          color: regEntry?.color || 'leo',
        };

        agents.push(agent);
      } catch (err) {
        // Skip agents without WORKING.md
        console.warn(`Could not load agent ${folder.name}:`, err);
      }
    }

    return agents;
  }

  async getNotes(): Promise<Note[]> {
    const notes: Note[] = [];

    // Fetch voice notes
    const voiceNotes = await this.fetchNotesFromDir('notes/voice', 'voice');
    notes.push(...voiceNotes);

    // Fetch meeting notes
    const meetingNotes = await this.fetchNotesFromDir('notes/meetings', 'meeting');
    notes.push(...meetingNotes);

    // Sort by date descending
    return notes.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  private async fetchNotesFromDir(dirPath: string, type: 'voice' | 'meeting'): Promise<Note[]> {
    const notes: Note[] = [];

    try {
      const files = await this.fetchDirectory(dirPath);
      const mdFiles = files.filter((f) => f.name.endsWith('.md'));

      for (const file of mdFiles) {
        try {
          const content = await this.fetchRaw(file.path);
          const { data, content: body } = matter(content);
          const fm = data as NoteFrontmatter;

          const note: Note = {
            id: fm.id || file.name.replace('.md', ''),
            type: type,
            title: fm.title || file.name.replace('.md', ''),
            synopsis: fm.summary || '',
            takeaways: fm.tags || [],
            actions: (fm.actionItems || []).map((text) => ({
              text,
              done: false,
            })),
            transcript: body.trim(),
            date: fm.created ? fm.created.split('T')[0] : this.extractDateFromFilename(file.name),
            column: this.mapStatusToColumn(fm.status),
          };

          notes.push(note);
        } catch (err) {
          console.warn(`Could not load note ${file.name}:`, err);
        }
      }
    } catch (err) {
      console.warn(`Could not load notes from ${dirPath}:`, err);
    }

    return notes;
  }

  async getActivity(): Promise<Activity[]> {
    const activities: Activity[] = [];

    try {
      // Fetch daily notes from memory/daily/
      const memoryFiles = await this.fetchDirectory('memory/daily');
      
      // Filter for date-formatted files (YYYY-MM-DD.md)
      const dailyFiles = memoryFiles
        .filter(f => f.name.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort((a, b) => b.name.localeCompare(a.name)) // newest first
        .slice(0, 7); // Last 7 days

      for (const file of dailyFiles) {
        try {
          const content = await this.fetchRaw(file.path);
          const date = file.name.replace('.md', '');
          const parsed = this.parseDailyNoteActivities(content, date);
          activities.push(...parsed);
        } catch (err) {
          console.warn(`Could not load daily note ${file.name}:`, err);
        }
      }
    } catch (err) {
      console.warn('Could not load daily notes for activity:', err);
    }

    // Sort by timestamp descending
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Parse activities from a daily note's markdown content.
   * 
   * Supports multiple formats:
   * 1. Timestamped entries: ## 14:32 followed by content
   * 2. Tagged entries: - [type] Description
   * 3. Section headers with status indicators: ## Section Title
   * 4. Checkboxes: - [x] Completed item or - ✅ Item
   */
  private parseDailyNoteActivities(content: string, date: string): Activity[] {
    const activities: Activity[] = [];
    const lines = content.split('\n');
    
    let currentTime = '12:00'; // Default to noon if no time specified
    let sectionTitle = '';
    let hourCounter = 9; // For spacing out activities without timestamps
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines and the title line
      if (!trimmed || trimmed.match(/^# \d{4}-\d{2}-\d{2}/)) continue;
      
      // Check for timestamped section header: ## 14:32 or ## 14:32 - Description
      const timestampMatch = trimmed.match(/^##\s+(\d{1,2}:\d{2})(?:\s*[-–]\s*(.+))?$/);
      if (timestampMatch) {
        currentTime = timestampMatch[1].padStart(5, '0');
        if (timestampMatch[2]) {
          sectionTitle = timestampMatch[2];
          activities.push(this.createActivityFromLine(
            `Started: ${sectionTitle}`,
            date,
            currentTime,
            'status_changed'
          ));
        }
        continue;
      }
      
      // Check for regular section header: ## Section Title
      const sectionMatch = trimmed.match(/^##\s+(.+)$/);
      if (sectionMatch) {
        sectionTitle = sectionMatch[1];
        // Increment hour for spacing
        currentTime = `${String(hourCounter++).padStart(2, '0')}:00`;
        if (hourCounter > 23) hourCounter = 9;
        continue;
      }
      
      // Check for tagged entries: - [status_change] Description
      const taggedMatch = trimmed.match(/^[-*]\s+\[([^\]]+)\]\s+(.+)$/);
      if (taggedMatch) {
        const [, tag, description] = taggedMatch;
        const type = this.mapTagToActivityType(tag);
        activities.push(this.createActivityFromLine(description, date, currentTime, type));
        continue;
      }
      
      // Check for completed items: - [x] Item or - ✅ Item
      const completedMatch = trimmed.match(/^[-*]\s+(?:\[x\]|✅)\s+(.+)$/i);
      if (completedMatch) {
        activities.push(this.createActivityFromLine(
          `Completed: ${completedMatch[1]}`,
          date,
          currentTime,
          'status_changed'
        ));
        continue;
      }
      
      // Check for bullet items with keywords
      const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (bulletMatch) {
        const text = bulletMatch[1];
        
        // Skip items that are just references or links
        if (text.match(/^https?:\/\//)) continue;
        
        // Detect activity type from content
        let type: Activity['type'] = 'status_changed';
        
        if (text.match(/\b(created?|built?|implemented?|added?)\b/i)) {
          type = 'document_created';
        } else if (text.match(/\b(assigned?|delegated?)\b/i)) {
          type = 'task_assigned';
        } else if (text.match(/\b(started?|working|began|progress)\b/i)) {
          type = 'status_changed';
        } else if (text.match(/\b(comment|noted?|feedback)\b/i)) {
          type = 'comment_posted';
        } else if (text.match(/\b(merged?|PR|pull request|commit)\b/i)) {
          type = 'document_created';
        }
        
        // Only include meaningful activities (filter out very short items)
        if (text.length > 15 && !text.match(/^(TODO|FIXME|NOTE):/i)) {
          activities.push(this.createActivityFromLine(text, date, currentTime, type));
        }
      }
    }
    
    return activities;
  }

  private createActivityFromLine(
    description: string,
    date: string,
    time: string,
    type: Activity['type']
  ): Activity {
    // Try to detect agent from description
    const agentId = this.detectAgentFromText(description);
    
    const timestamp = new Date(`${date}T${time}:00`);
    const id = `daily-${date}-${time.replace(':', '')}-${Math.random().toString(36).slice(2, 6)}`;
    
    return {
      id,
      type,
      agentId,
      description: this.cleanDescription(description),
      timestamp,
    };
  }

  private detectAgentFromText(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('murphie') || lowerText.includes('testing') || lowerText.includes('qa')) {
      return 'murphie';
    }
    if (lowerText.includes('eight') || lowerText.includes('dealership') || lowerText.includes('ga4')) {
      return 'eight';
    }
    if (lowerText.includes('daily') || lowerText.includes('briefing') || lowerText.includes('morning brief')) {
      return 'daily';
    }
    if (lowerText.includes('intel') || lowerText.includes('research') || lowerText.includes('competitor')) {
      return 'intel';
    }
    
    // Default to bam for general/unknown activities
    return 'bam';
  }

  private mapTagToActivityType(tag: string): Activity['type'] {
    const lowerTag = tag.toLowerCase();
    
    if (lowerTag.includes('status') || lowerTag.includes('change')) return 'status_changed';
    if (lowerTag.includes('task') && lowerTag.includes('create')) return 'task_created';
    if (lowerTag.includes('assign')) return 'task_assigned';
    if (lowerTag.includes('comment') || lowerTag.includes('note')) return 'comment_posted';
    if (lowerTag.includes('document') || lowerTag.includes('create')) return 'document_created';
    if (lowerTag.includes('agent')) return 'agent_status';
    
    return 'status_changed';
  }

  private cleanDescription(text: string): string {
    return text
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/`([^`]+)`/g, '$1') // Remove code ticks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
      .trim();
  }

  async getAgentDetail(agentId: string): Promise<AgentDetail | null> {
    // First get the basic agent info
    const agents = await this.getAgents();
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return null;

    // Fetch WORKING.md
    let workingMd: string | null = null;
    try {
      workingMd = await this.fetchRaw(`agents/${agentId}/WORKING.md`);
    } catch {
      console.warn(`WORKING.md not found for agent ${agentId}`);
    }

    // Fetch SOUL.md
    let soulMd: string | null = null;
    try {
      soulMd = await this.fetchRaw(`agents/${agentId}/SOUL.md`);
    } catch {
      console.warn(`SOUL.md not found for agent ${agentId}`);
    }

    // Fetch daily notes from shared/memory/
    const dailyNotes: DailyNote[] = [];
    try {
      const memoryFiles = await this.fetchDirectory('shared/memory');
      const mdFiles = memoryFiles
        .filter(f => f.name.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort((a, b) => b.name.localeCompare(a.name))
        .slice(0, 7); // Last 7 days

      for (const file of mdFiles) {
        try {
          const content = await this.fetchRaw(file.path);
          const date = file.name.replace('.md', '');
          dailyNotes.push({ date, content });
        } catch {
          console.warn(`Could not load daily note ${file.name}`);
        }
      }
    } catch {
      console.warn('Could not load daily notes');
    }

    return {
      agent,
      workingMd,
      soulMd,
      dailyNotes,
    };
  }

  async getTasks(): Promise<Task[]> {
    const tasks: Task[] = [];

    try {
      const files = await this.fetchDirectory('tasks');
      const mdFiles = files.filter((f) => f.name.endsWith('.md'));

      for (const file of mdFiles) {
        try {
          const content = await this.fetchRaw(file.path);
          const { data, content: body } = matter(content);
          const fm = data as TaskFrontmatter;

          const task: Task = {
            id: fm.id || file.name.replace('.md', ''),
            title: fm.title || file.name.replace('.md', ''),
            status: fm.status || 'inbox',
            priority: fm.priority || 'medium',
            assignees: fm.assignees || [],
            description: body.trim(),
            created: fm.created || new Date().toISOString(),
            updated: fm.updated,
            due: fm.due,
            tags: fm.tags,
          };

          tasks.push(task);
        } catch (err) {
          console.warn(`Could not load task ${file.name}:`, err);
        }
      }
    } catch (err) {
      console.warn('Could not load tasks directory:', err);
    }

    // Sort by priority (high first) then by created date
    const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });
  }

  async getMemory(): Promise<MemoryData> {
    let memoryMd = '';
    const dailyNotes: Array<{ date: string; content: string }> = [];

    // Fetch MEMORY.md from memory/MEMORY.md
    try {
      memoryMd = await this.fetchRaw('memory/MEMORY.md');
    } catch (err) {
      console.warn('Could not load MEMORY.md:', err);
      memoryMd = '# Memory\n\n_No MEMORY.md found in repository._';
    }

    // Fetch daily notes from memory/daily/
    try {
      const memoryFiles = await this.fetchDirectory('memory/daily');
      const mdFiles = memoryFiles
        .filter(f => f.name.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort((a, b) => b.name.localeCompare(a.name)) // newest first
        .slice(0, 30); // Last 30 days

      for (const file of mdFiles) {
        try {
          const content = await this.fetchRaw(file.path);
          const date = file.name.replace('.md', '');
          dailyNotes.push({ date, content });
        } catch {
          console.warn(`Could not load daily note ${file.name}`);
        }
      }
    } catch (err) {
      console.warn('Could not load daily notes directory:', err);
    }

    return {
      memoryMd,
      dailyNotes,
    };
  }

  // ───────────────────────────────────────────────────────────
  // HELPER METHODS
  // ───────────────────────────────────────────────────────────

  private parseSimpleYamlRegistry(yaml: string): Record<string, AgentRegistryEntry> {
    // Simple YAML parser for the agents registry structure
    // This is a basic parser - for production, consider using js-yaml
    const result: Record<string, AgentRegistryEntry> = {};
    const lines = yaml.split('\n');
    
    let currentAgent: string | null = null;
    let inAgentsBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === 'agents:') {
        inAgentsBlock = true;
        continue;
      }

      if (!inAgentsBlock) continue;

      // Detect agent key (2 spaces indentation, ends with :)
      const agentMatch = line.match(/^  ([a-z-]+):$/);
      if (agentMatch) {
        currentAgent = agentMatch[1];
        result[currentAgent] = {
          name: '',
          emoji: '',
          role: '',
          color: '',
        };
        continue;
      }

      // Parse properties (4 spaces indentation)
      if (currentAgent && line.startsWith('    ')) {
        const propMatch = trimmed.match(/^([a-z]+):\s*(.+)$/);
        if (propMatch) {
          const [, key, rawValue] = propMatch;
          // Remove quotes from value
          const value = rawValue.replace(/^["']|["']$/g, '');
          
          if (key === 'name') result[currentAgent].name = value;
          else if (key === 'emoji') result[currentAgent].emoji = value;
          else if (key === 'role') result[currentAgent].role = value;
          else if (key === 'color') result[currentAgent].color = value;
          else if (key === 'model') result[currentAgent].model = value;
          else if (key === 'workspace') result[currentAgent].workspace = value;
        }
      }
    }

    return result;
  }

  private parseActivityLog(markdown: string): Activity[] {
    // Parse activity log from markdown format
    const activities: Activity[] = [];
    const lines = markdown.split('\n');
    
    let currentDate = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Parse date headers (## 2026-02-02)
      const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        continue;
      }

      // Parse activity entries (### HH:MM:SS - type)
      const activityMatch = line.match(/^### (\d{2}:\d{2}:\d{2}) - (\w+)/);
      if (activityMatch && currentDate) {
        const [, time, type] = activityMatch;
        const timestamp = new Date(`${currentDate}T${time}`);
        
        // Parse following lines for details
        let agentId = '';
        let description = '';
        let id = '';

        for (let j = i + 1; j < lines.length && !lines[j].startsWith('###'); j++) {
          const detailLine = lines[j].trim();
          
          const agentMatch = detailLine.match(/^\*\*Agent:\*\* (.+)/);
          if (agentMatch) agentId = agentMatch[1];
          
          const descMatch = detailLine.match(/^\*\*Description:\*\* (.+)/);
          if (descMatch) description = descMatch[1];
          
          const idMatch = detailLine.match(/^\*\*ID:\*\* (.+)/);
          if (idMatch) id = idMatch[1];
        }

        if (description) {
          activities.push({
            id: id || `act-${currentDate}-${time.replace(/:/g, '')}`,
            type: this.mapActivityType(type),
            agentId: agentId || 'system',
            description,
            timestamp,
          });
        }
      }
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private mapStatus(status?: string): 'idle' | 'working' | 'blocked' {
    switch (status) {
      case 'active':
      case 'busy':
        return 'working';
      case 'offline':
        return 'blocked';
      default:
        return 'idle';
    }
  }

  private mapActivityType(type: string): Activity['type'] {
    switch (type) {
      case 'agent':
        return 'agent_status';
      case 'note':
        return 'document_created';
      case 'task':
        return 'task_created';
      case 'commit':
        return 'document_created';
      default:
        return 'status_changed';
    }
  }

  private mapStatusToColumn(status?: string): 'inbox' | 'action' | 'review' | 'done' {
    switch (status) {
      case 'processing':
        return 'inbox';
      case 'ready':
        return 'action';
      case 'archived':
        return 'done';
      default:
        return 'inbox';
    }
  }

  private extractDateFromFilename(filename: string): string {
    // Try to extract YYYY-MM-DD from filename
    const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : new Date().toISOString().split('T')[0];
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
