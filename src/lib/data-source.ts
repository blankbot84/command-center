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

export interface DataSource {
  getAgents(): Promise<Agent[]>;
  getNotes(): Promise<Note[]>;
  getActivity(): Promise<Activity[]>;
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
