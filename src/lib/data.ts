import { Note } from './types';
import { DataSource, MockDataSource, GitHubDataSource } from './data-source';

// ─────────────────────────────────────────────────────────────
// CONFIGURED DATA SOURCE
// ─────────────────────────────────────────────────────────────

/**
 * Get the configured data source based on environment variables.
 * 
 * Environment variables:
 * - DATA_SOURCE: 'mock' | 'github' (default: 'mock')
 * - GITHUB_TOKEN: GitHub personal access token for API auth
 * - DATA_CACHE_TTL: Cache TTL in milliseconds (default: 60000)
 */
export function getDataSource(): DataSource {
  const sourceType = process.env.DATA_SOURCE || 'mock';
  
  if (sourceType === 'github') {
    const token = process.env.GITHUB_TOKEN;
    const cacheTTL = process.env.DATA_CACHE_TTL 
      ? parseInt(process.env.DATA_CACHE_TTL, 10) 
      : undefined;
    
    return new GitHubDataSource(token, cacheTTL);
  }
  
  return new MockDataSource();
}

// Singleton instance for server-side use
let dataSourceInstance: DataSource | null = null;

export function getDataSourceInstance(): DataSource {
  if (!dataSourceInstance) {
    dataSourceInstance = getDataSource();
  }
  return dataSourceInstance;
}

// Re-export types and classes for convenience
export type { DataSource };
export { MockDataSource, GitHubDataSource };

// ─────────────────────────────────────────────────────────────
// LEGACY SAMPLE DATA (for backward compatibility)
// ─────────────────────────────────────────────────────────────

export const sampleNotes: Note[] = [
  {
    id: '1',
    type: 'voice',
    title: 'Testing the New Recording Device Functionality',
    synopsis: 'An exploration of a new recording device to determine if it captures audio continuously or only generates summaries.',
    takeaways: [
      'The speaker is unsure about the functionality of a new recording device',
      'The primary question is whether the device records everything continuously or only creates summaries',
      'A test is being conducted to understand the device behavior'
    ],
    actions: [
      { text: 'Test the mark feature by pushing the button and reviewing the output', done: false },
      { text: 'Verify if the device records all words or only creates summaries', done: true }
    ],
    transcript: '00:00:28\nSo this is my new recording device that I\'m using right now. And I\'m trying to see if it\'s recording me.\n\n00:00:55\nSo it\'s not going to record every word, I guess. It\'s just going to record highlights about the things that I\'m saying.',
    date: '2026-02-01',
    column: 'inbox'
  },
  {
    id: '2',
    type: 'voice',
    title: 'Quick idea: Dealership dashboard redesign',
    synopsis: 'Thoughts on simplifying the main dashboard view for dealership managers.',
    takeaways: [
      'Current dashboard is too cluttered',
      'Need KPI widgets front and center',
      'Mobile view needs complete rethink'
    ],
    actions: [],
    transcript: '00:00:05\nJust had a thought about the dashboard...',
    date: '2026-01-31',
    column: 'review'
  },
  {
    id: '3',
    type: 'voice',
    title: 'Reminder: Call Brad about data export',
    synopsis: 'Need to follow up with Brad on the GA4 data format.',
    takeaways: ['Brad prefers CSV over JSON', 'Weekly exports on Mondays'],
    actions: [{ text: 'Schedule call with Brad', done: false }],
    transcript: '00:00:02\nDon\'t forget to call Brad...',
    date: '2026-02-02',
    column: 'action'
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Sam Boswell Q1 Planning Discussion',
    synopsis: 'Quarterly planning meeting with O\'Neil and Brad to discuss marketing strategy and GA4 integration timeline.',
    takeaways: [
      'GA4 integration is priority for Q1',
      'Brad will provide historical data by Feb 15',
      'O\'Neil approved budget for additional rooftop rollout'
    ],
    actions: [
      { text: 'Schedule follow-up with Brad on data format', done: false },
      { text: 'Draft integration timeline document', done: false },
      { text: 'Send O\'Neil the revised proposal', done: false }
    ],
    transcript: '00:01:12\nAlright, so let\'s talk about Q1 priorities for Sam Boswell...',
    date: '2026-02-01',
    column: 'inbox'
  },
  {
    id: '5',
    type: 'meeting',
    title: 'Vendor call with Analytics provider',
    synopsis: 'Discussion about API limits and pricing tiers for scaled usage.',
    takeaways: [
      'Current tier allows 10k calls per day',
      'Enterprise tier needed for multi-rooftop',
      'They offered 20% discount for annual commit'
    ],
    actions: [
      { text: 'Compare pricing with alternatives', done: false },
      { text: 'Get approval from O\'Neil for annual commit', done: false }
    ],
    transcript: '00:00:30\nThanks for hopping on this call...',
    date: '2026-01-30',
    column: 'action'
  },
  {
    id: '6',
    type: 'meeting',
    title: 'Shawn sync: Next Automotive roadmap',
    synopsis: 'Weekly sync with Shawn on consulting pipeline and deliverables.',
    takeaways: [
      'Two new leads in pipeline',
      'Sam Boswell expansion on track',
      'Need to hire contractor for frontend'
    ],
    actions: [
      { text: 'Review contractor candidates', done: true },
      { text: 'Prep deck for new lead pitch', done: false }
    ],
    transcript: '00:00:15\nHey, let\'s go through the week...',
    date: '2026-01-29',
    column: 'review'
  }
];
