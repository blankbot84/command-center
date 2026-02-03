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
import { type Note } from './types';

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

export interface DataSource {
  getAgents(): Promise<Agent[]>;
  getNotes(): Promise<Note[]>;
  getActivity(): Promise<Activity[]>;
  getAgentDetail(agentId: string): Promise<AgentDetail | null>;
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

// ─────────────────────────────────────────────────────────────
// MOCK DATA SOURCE
// ─────────────────────────────────────────────────────────────

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

        const agent: Agent = {
          id: folder.name,
          name: regEntry?.name || this.capitalize(folder.name),
          emoji: regEntry?.emoji || '🤖',
          role: regEntry?.role || 'Agent',
          status: this.mapStatus(state.status),
          focus: state.focus || null,
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
    // Try to fetch activity log for current month
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    try {
      const activityMd = await this.fetchRaw(`activity/${monthKey}.md`);
      return this.parseActivityLog(activityMd);
    } catch {
      // Return empty if no activity log found
      console.warn(`Activity log for ${monthKey} not found`);
      return [];
    }
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
