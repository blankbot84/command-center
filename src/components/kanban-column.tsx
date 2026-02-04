'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ColumnId, Note } from '@/lib/types';
import { NoteCard } from './note-card';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: ColumnId;
  label: string;
  notes: Note[];
  onNoteClick: (note: Note) => void;
}

const columnColors: Record<ColumnId, string> = {
  inbox: 'bg-leo',
  review: 'bg-mikey',
  action: 'bg-raph',
  done: 'bg-donnie',
};

export function KanbanColumn({ id, label, notes, onNoteClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={cn(
        'flex-shrink-0 w-[280px] md:w-60 bg-card flex flex-col min-h-[200px] max-h-[400px] md:max-h-[280px]'
      )}
    >
      <div className="p-3 border-b border-border flex justify-between items-center">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className={cn('w-2 h-2 md:w-1.5 md:h-1.5', columnColors[id])} />
          {label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {notes.length}
        </span>
      </div>
      
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 overflow-y-auto space-y-2',
          isOver && 'bg-accent/50'
        )}
      >
        <SortableContext items={notes.map(n => n.id)} strategy={verticalListSortingStrategy}>
          {notes.length === 0 ? (
            <p className="text-center py-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Empty
            </p>
          ) : (
            notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onNoteClick(note)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
