export type NoteType = 'voice' | 'meeting';
export type ColumnId = 'inbox' | 'review' | 'action' | 'done';
export type ViewMode = 'kanban' | 'list';

export interface Action {
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  synopsis: string;
  takeaways: string[];  // Also serves as tags
  actions: Action[];
  transcript: string;
  date: string;
  column: ColumnId;
  duration?: number;    // Duration in seconds
  participants?: string[];  // For meetings
}

export const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'review', label: 'Review' },
  { id: 'action', label: 'Action' },
  { id: 'done', label: 'Done' },
];
