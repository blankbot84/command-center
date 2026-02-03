'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

// localStorage keys
const STORAGE_KEYS = {
  dataSource: 'command-center-data-source',
  cacheTTL: 'command-center-cache-ttl',
};

// Defaults
const DEFAULT_DATA_SOURCE = 'mock';
const DEFAULT_CACHE_TTL = 60000; // 1 minute

interface SettingsState {
  dataSource: 'mock' | 'github';
  cacheTTL: number;
}

function loadSettings(): SettingsState {
  if (typeof window === 'undefined') {
    return { dataSource: DEFAULT_DATA_SOURCE, cacheTTL: DEFAULT_CACHE_TTL };
  }
  
  const dataSource = localStorage.getItem(STORAGE_KEYS.dataSource) as 'mock' | 'github' | null;
  const cacheTTLStr = localStorage.getItem(STORAGE_KEYS.cacheTTL);
  
  return {
    dataSource: dataSource === 'github' ? 'github' : 'mock',
    cacheTTL: cacheTTLStr ? parseInt(cacheTTLStr, 10) : DEFAULT_CACHE_TTL,
  };
}

function saveSettings(settings: SettingsState): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEYS.dataSource, settings.dataSource);
  localStorage.setItem(STORAGE_KEYS.cacheTTL, String(settings.cacheTTL));
}

// Helper to get current data source (exported for use in data.ts)
export function getClientDataSource(): 'mock' | 'github' {
  if (typeof window === 'undefined') return DEFAULT_DATA_SOURCE;
  const stored = localStorage.getItem(STORAGE_KEYS.dataSource);
  return stored === 'github' ? 'github' : 'mock';
}

export function getClientCacheTTL(): number {
  if (typeof window === 'undefined') return DEFAULT_CACHE_TTL;
  const stored = localStorage.getItem(STORAGE_KEYS.cacheTTL);
  return stored ? parseInt(stored, 10) : DEFAULT_CACHE_TTL;
}

// Section component for consistent styling
function SettingsSection({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description?: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border p-4 space-y-3">
      <div>
        <h3 className="font-mono text-xs font-bold tracking-wider uppercase">{title}</h3>
        {description && (
          <p className="font-mono text-[10px] text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// Toggle button component
function ToggleButton({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex border border-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
            value === opt.value
              ? 'bg-foreground text-background'
              : 'bg-background text-foreground hover:bg-accent'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsView() {
  const [settings, setSettings] = useState<SettingsState>({
    dataSource: DEFAULT_DATA_SOURCE,
    cacheTTL: DEFAULT_CACHE_TTL,
  });
  const [mounted, setMounted] = useState(false);
  const [showReloadNotice, setShowReloadNotice] = useState(false);

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  // Save settings when they change
  const updateSettings = (updates: Partial<SettingsState>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
    setShowReloadNotice(true);
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <span className="font-mono text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h2 className="font-mono text-lg font-bold tracking-wider uppercase">Settings</h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            Configure Command Center preferences
          </p>
        </div>

        {/* Reload notice */}
        {showReloadNotice && (
          <div className="flex items-center justify-between bg-accent/50 border border-border p-3">
            <span className="font-mono text-xs">
              Settings updated. Reload to apply changes.
            </span>
            <button
              onClick={handleReload}
              className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider border border-border hover:bg-foreground hover:text-background transition-colors"
            >
              Reload
            </button>
          </div>
        )}

        {/* Data Source */}
        <SettingsSection
          title="Data Source"
          description="Choose where Command Center fetches data from"
        >
          <ToggleButton
            options={[
              { value: 'mock', label: '📦 Mock Data' },
              { value: 'github', label: '🐙 GitHub' },
            ]}
            value={settings.dataSource}
            onChange={(v) => updateSettings({ dataSource: v as 'mock' | 'github' })}
          />
          <div className="font-mono text-[10px] text-muted-foreground">
            {settings.dataSource === 'mock' ? (
              <span>Using built-in sample data for development/demo</span>
            ) : (
              <span>Fetching live data from GitHub repository</span>
            )}
          </div>
        </SettingsSection>

        {/* GitHub Repository */}
        <SettingsSection
          title="GitHub Repository"
          description="Source repository for live data"
        >
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 border border-border">
            <span className="text-lg">📂</span>
            <code className="font-mono text-sm">blankbot84/life-data</code>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            Contains agent state, notes, and activity logs
          </p>
        </SettingsSection>

        {/* Theme */}
        <SettingsSection
          title="Theme"
          description="Toggle between light and dark mode"
        >
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="font-mono text-xs text-muted-foreground">
              Click to toggle theme
            </span>
          </div>
        </SettingsSection>

        {/* Cache TTL */}
        <SettingsSection
          title="Cache TTL"
          description="How long to cache GitHub API responses (in seconds)"
        >
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={10}
              max={600}
              step={10}
              value={Math.round(settings.cacheTTL / 1000)}
              onChange={(e) => {
                const seconds = parseInt(e.target.value, 10);
                if (!isNaN(seconds) && seconds >= 10 && seconds <= 600) {
                  updateSettings({ cacheTTL: seconds * 1000 });
                }
              }}
              className="w-24 px-3 py-2 font-mono text-sm bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <span className="font-mono text-xs text-muted-foreground">
              seconds (10-600)
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            Current: {Math.round(settings.cacheTTL / 1000)}s • Lower = fresher data, more API calls
          </p>
        </SettingsSection>

        {/* Manual Sync */}
        <SettingsSection
          title="Manual Sync"
          description="Push local data to GitHub repository"
        >
          <div className="space-y-2">
            <p className="font-mono text-[10px] text-muted-foreground">
              Run this command to sync agent state and daily notes:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-secondary/50 px-3 py-2 border border-border overflow-x-auto">
                ~/scripts/sync-life-data.sh
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('~/scripts/sync-life-data.sh');
                }}
                className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider border border-border hover:bg-accent transition-colors"
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              This pushes WORKING.md and daily notes to the life-data repo for Command Center to display.
            </p>
          </div>
        </SettingsSection>

        {/* About */}
        <SettingsSection
          title="About"
          description="Command Center v1.0"
        >
          <div className="space-y-2 font-mono text-[10px] text-muted-foreground">
            <p>Unified dashboard for Plaud notes + agent squad management.</p>
            <p>Built with Next.js, Tailwind CSS, and shadcn/ui.</p>
            <div className="flex items-center gap-4 pt-2">
              <a 
                href="https://github.com/blankbot84/command-center" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                GitHub Repo
              </a>
              <a 
                href="https://blank-command-center.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Live Site
              </a>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
