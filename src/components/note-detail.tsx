'use client';

import { Note, ColumnId, COLUMNS } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NoteDetailProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onMove: (noteId: string, column: ColumnId) => void;
  onToggleAction: (noteId: string, actionIndex: number) => void;
}

export function NoteDetail({ note, open, onClose, onMove, onToggleAction }: NoteDetailProps) {
  if (!note) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] p-0 flex flex-col rounded-t-xl"
      >
        {/* Fixed Header */}
        <SheetHeader className="p-4 md:p-6 pb-4 flex-shrink-0 border-b border-border">
          <div className="space-y-2">
            <Badge
              className={cn(
                'font-mono text-[9px] uppercase tracking-widest rounded-none px-2.5 py-1',
                note.type === 'voice'
                  ? 'bg-donnie text-white hover:bg-donnie'
                  : 'bg-mikey text-white hover:bg-mikey'
              )}
            >
              {note.type}
            </Badge>
            <SheetTitle className="text-lg md:text-xl font-semibold leading-tight text-left">
              {note.title}
            </SheetTitle>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {note.date}
            </p>
          </div>
        </SheetHeader>

        {/* Scrollable Content - using native scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y">
          <div className="p-4 md:p-6 space-y-6">
            {/* Synopsis */}
            <section>
              <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                Synopsis
              </h4>
              <p className="text-sm md:text-[15px] leading-relaxed">{note.synopsis}</p>
            </section>

            {/* Takeaways */}
            {note.takeaways.length > 0 && (
              <section>
                <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                  Takeaways
                </h4>
                <ul className="space-y-0">
                  {note.takeaways.map((t, i) => (
                    <li key={i} className="py-3 border-b border-border text-sm leading-snug">
                      <span className="text-muted-foreground mr-2">—</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Actions */}
            {note.actions.length > 0 && (
              <section>
                <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                  Actions
                </h4>
                <ul className="space-y-0">
                  {note.actions.map((action, i) => (
                    <label 
                      key={i} 
                      className="py-3 border-b border-border flex items-start gap-3 cursor-pointer active:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={action.done}
                        onCheckedChange={() => onToggleAction(note.id, i)}
                        className="mt-0.5 h-5 w-5"
                      />
                      <span className={cn(
                        'text-sm leading-snug flex-1',
                        action.done && 'line-through text-muted-foreground'
                      )}>
                        {action.text}
                      </span>
                    </label>
                  ))}
                </ul>
              </section>
            )}

            {/* Transcript */}
            <section>
              <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                Transcript
              </h4>
              <div className="bg-background border border-border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {note.transcript.split(/(\d{2}:\d{2}:\d{2})/g).map((part, i) => (
                  part.match(/^\d{2}:\d{2}:\d{2}$/) ? (
                    <span key={i} className="block mt-3 first:mt-0 mb-1 font-mono text-[10px] text-leo tracking-wider">
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                ))}
              </div>
            </section>
            
            {/* Bottom padding for buttons */}
            <div className="h-4" />
          </div>
        </div>

        {/* Fixed Footer - Move buttons */}
        <div className="p-4 border-t border-border flex gap-2 flex-shrink-0 bg-card">
          {COLUMNS.filter(c => c.id !== note.column).map(col => (
            <Button
              key={col.id}
              variant={col.id === 'done' ? 'default' : 'outline'}
              size="lg"
              className="flex-1 font-mono text-[10px] uppercase tracking-wider rounded-none h-12"
              onClick={() => {
                onMove(note.id, col.id);
                onClose();
              }}
            >
              {col.label}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
