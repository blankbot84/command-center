'use client';

import { Note, NoteType, ColumnId } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NoteListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  typeFilter: NoteType | 'all';
  columnFilter: ColumnId | 'all';
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
}

function getColumnColor(column: ColumnId): string {
  switch (column) {
    case 'inbox': return 'bg-muted-foreground';
    case 'review': return 'bg-leo';
    case 'action': return 'bg-raph';
    case 'done': return 'bg-green-500';
    default: return 'bg-muted-foreground';
  }
}

export function NoteList({ notes, onNoteClick, typeFilter, columnFilter }: NoteListProps) {
  const filteredNotes = notes.filter(note => {
    if (typeFilter !== 'all' && note.type !== typeFilter) return false;
    if (columnFilter !== 'all' && note.column !== columnFilter) return false;
    return true;
  });

  // Sort by date descending
  const sortedNotes = [...filteredNotes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sortedNotes.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="font-mono text-sm">No notes found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {sortedNotes.map(note => {
        const pendingTasks = note.actions.filter(a => !a.done).length;
        
        return (
          <div
            key={note.id}
            onClick={() => onNoteClick(note)}
            className={cn(
              'p-4 cursor-pointer hover:bg-accent/50 transition-colors',
              'border-l-[3px]',
              note.type === 'voice' ? 'border-l-donnie' : 'border-l-mikey'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="text-sm font-medium leading-snug mb-1 line-clamp-2">
                  {note.title}
                </h3>
                
                {/* Synopsis */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {note.synopsis}
                </p>
                
                {/* Tags */}
                {note.takeaways.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.takeaways.slice(0, 3).map((tag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0 h-5"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {note.takeaways.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{note.takeaways.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Meta row */}
                <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span>{note.date}</span>
                  {note.duration && (
                    <>
                      <span className="text-border">•</span>
                      <span>{formatDuration(note.duration)}</span>
                    </>
                  )}
                  {note.participants && note.participants.length > 0 && (
                    <>
                      <span className="text-border">•</span>
                      <span>{note.participants.length} participants</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Right side badges */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Status badge */}
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  getColumnColor(note.column)
                )} />
                
                {/* Task count */}
                {pendingTasks > 0 && (
                  <span className="bg-raph text-white text-[10px] px-2 py-0.5 font-mono font-bold">
                    {pendingTasks}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
