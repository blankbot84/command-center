'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Note } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
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

export function NoteCard({ note, onClick }: NoteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pendingTasks = note.actions.filter(a => !a.done).length;
  const duration = formatDuration(note.duration);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-background border border-border p-4 cursor-grab active:cursor-grabbing',
        'hover:border-muted-foreground transition-all duration-150',
        'border-l-[3px] touch-manipulation',
        note.type === 'voice' ? 'border-l-donnie' : 'border-l-mikey',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <h3 className="text-sm font-medium mb-2 line-clamp-2 leading-snug">
        {note.title}
      </h3>
      
      {/* Tags preview */}
      {note.takeaways.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.takeaways.slice(0, 2).map((tag, i) => (
            <span 
              key={i}
              className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider bg-accent/50 px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
          {note.takeaways.length > 2 && (
            <span className="font-mono text-[9px] text-muted-foreground">
              +{note.takeaways.length - 2}
            </span>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span>{note.date}</span>
          {duration && (
            <>
              <span className="text-border">•</span>
              <span>{duration}</span>
            </>
          )}
        </div>
        {pendingTasks > 0 && (
          <span className="bg-raph text-white px-2 py-1 font-bold">
            {pendingTasks}
          </span>
        )}
      </div>
    </div>
  );
}
