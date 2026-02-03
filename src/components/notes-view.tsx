'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Note, NoteType, ColumnId, ViewMode, COLUMNS } from '@/lib/types';
import { sampleNotes } from '@/lib/data';
import { KanbanColumn } from './kanban-column';
import { NoteList } from './note-list';
import { NoteDetail } from './note-detail';
import { TaskSidebar } from './task-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Icons for view toggle
function KanbanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="8" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

interface NotesViewProps {
  embedded?: boolean;
}

export function NotesView({ embedded }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>(sampleNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [typeFilter, setTypeFilter] = useState<NoteType | 'all'>('all');
  const [columnFilter, setColumnFilter] = useState<ColumnId | 'all'>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  const pendingTaskCount = notes.reduce(
    (sum, n) => sum + n.actions.filter(a => !a.done).length,
    0
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeNote = notes.find(n => n.id === active.id);
    if (!activeNote) return;

    const overColumn = COLUMNS.find(c => c.id === over.id);
    if (overColumn && activeNote.column !== overColumn.id) {
      setNotes(prev =>
        prev.map(n =>
          n.id === active.id ? { ...n, column: overColumn.id } : n
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeNote = notes.find(n => n.id === active.id);
    if (!activeNote) return;

    const overColumn = COLUMNS.find(c => c.id === over.id);
    if (overColumn) {
      setNotes(prev =>
        prev.map(n =>
          n.id === active.id ? { ...n, column: overColumn.id } : n
        )
      );
    }
  };

  const handleMove = (noteId: string, column: ColumnId) => {
    setNotes(prev =>
      prev.map(n => (n.id === noteId ? { ...n, column } : n))
    );
  };

  const handleToggleAction = (noteId: string, actionIndex: number) => {
    setNotes(prev =>
      prev.map(n => {
        if (n.id !== noteId) return n;
        const newActions = [...n.actions];
        newActions[actionIndex] = {
          ...newActions[actionIndex],
          done: !newActions[actionIndex].done,
        };
        return { ...n, actions: newActions };
      })
    );
  };

  const activeNote = activeId ? notes.find(n => n.id === activeId) : null;

  const renderKanbanRow = (type: NoteType) => {
    const typeNotes = notes.filter(n => n.type === type);
    return (
      <div className="flex gap-3 md:gap-4 p-3 md:p-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-20 md:pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={`${type}-${col.id}`}
            id={col.id}
            label={col.label}
            notes={typeNotes.filter(n => n.column === col.id)}
            onNoteClick={setSelectedNote}
          />
        ))}
      </div>
    );
  };

  const renderKanbanContent = () => (
    <>
      {/* Mobile: Tabs layout */}
      <div className="lg:hidden h-full flex flex-col">
        <Tabs defaultValue="voice" className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-12 p-0">
            <TabsTrigger 
              value="voice" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-donnie data-[state=active]:bg-transparent font-mono text-xs uppercase tracking-widest h-full"
            >
              <span className="w-2 h-2 bg-donnie mr-2" />
              Voice
              <span className="ml-2 text-muted-foreground">
                {notes.filter(n => n.type === 'voice').length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="meetings"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-mikey data-[state=active]:bg-transparent font-mono text-xs uppercase tracking-widest h-full"
            >
              <span className="w-2 h-2 bg-mikey mr-2" />
              Meetings
              <span className="ml-2 text-muted-foreground">
                {notes.filter(n => n.type === 'meeting').length}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="voice" className="flex-1 overflow-auto mt-0">
            {renderKanbanRow('voice')}
          </TabsContent>
          <TabsContent value="meetings" className="flex-1 overflow-auto mt-0">
            {renderKanbanRow('meeting')}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: Stacked sections */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col overflow-y-auto">
        <section className="py-4">
          <div className="sticky top-0 bg-background z-40 border-b border-border px-5 py-3 flex items-center gap-3">
            <div className="w-1 h-6 bg-donnie" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Voice
            </span>
            <span className="font-mono text-[11px] text-muted-foreground ml-auto">
              {notes.filter(n => n.type === 'voice').length}
            </span>
          </div>
          {renderKanbanRow('voice')}
        </section>
        <div className="h-px bg-border mx-5" />
        <section className="py-4">
          <div className="sticky top-0 bg-background z-40 border-b border-border px-5 py-3 flex items-center gap-3">
            <div className="w-1 h-6 bg-mikey" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Meetings
            </span>
            <span className="font-mono text-[11px] text-muted-foreground ml-auto">
              {notes.filter(n => n.type === 'meeting').length}
            </span>
          </div>
          {renderKanbanRow('meeting')}
        </section>
      </div>
    </>
  );

  const renderListContent = () => (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="border-b border-border p-3 flex flex-wrap gap-2 items-center">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mr-2">
          Filter:
        </span>
        
        {/* Type filter */}
        <div className="flex border border-border rounded-none overflow-hidden">
          <button
            onClick={() => setTypeFilter('all')}
            className={cn(
              'px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors',
              typeFilter === 'all' 
                ? 'bg-foreground text-background' 
                : 'hover:bg-accent'
            )}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('voice')}
            className={cn(
              'px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors border-l border-border',
              typeFilter === 'voice' 
                ? 'bg-donnie text-white' 
                : 'hover:bg-accent'
            )}
          >
            Voice
          </button>
          <button
            onClick={() => setTypeFilter('meeting')}
            className={cn(
              'px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors border-l border-border',
              typeFilter === 'meeting' 
                ? 'bg-mikey text-white' 
                : 'hover:bg-accent'
            )}
          >
            Meetings
          </button>
        </div>

        {/* Column filter */}
        <div className="flex border border-border rounded-none overflow-hidden ml-2">
          <button
            onClick={() => setColumnFilter('all')}
            className={cn(
              'px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors',
              columnFilter === 'all' 
                ? 'bg-foreground text-background' 
                : 'hover:bg-accent'
            )}
          >
            All
          </button>
          {COLUMNS.map(col => (
            <button
              key={col.id}
              onClick={() => setColumnFilter(col.id)}
              className={cn(
                'px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors border-l border-border',
                columnFilter === col.id 
                  ? 'bg-foreground text-background' 
                  : 'hover:bg-accent'
              )}
            >
              {col.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <NoteList
          notes={notes}
          onNoteClick={setSelectedNote}
          typeFilter={typeFilter}
          columnFilter={columnFilter}
        />
      </div>
    </div>
  );

  const content = (
    <>
      {/* View Toggle - Fixed position */}
      <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-card/50">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          {notes.length} notes
        </span>
        <div className="flex border border-border rounded-none overflow-hidden">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'kanban' 
                ? 'bg-foreground text-background' 
                : 'hover:bg-accent'
            )}
            title="Kanban view"
          >
            <KanbanIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 transition-colors border-l border-border',
              viewMode === 'list' 
                ? 'bg-foreground text-background' 
                : 'hover:bg-accent'
            )}
            title="List view"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          {viewMode === 'kanban' ? renderKanbanContent() : renderListContent()}
        </main>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <TaskSidebar notes={notes} onToggleAction={handleToggleAction} />
        </div>
      </div>

      {/* Mobile: Floating task button + sheet */}
      <div className="lg:hidden">
        <Sheet open={taskSheetOpen} onOpenChange={setTaskSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-none bg-raph hover:bg-raph/90 text-white font-mono text-sm font-bold shadow-lg z-50"
            >
              {pendingTaskCount}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Tasks ({pendingTaskCount})
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(70vh-60px)]">
              <TaskSidebar notes={notes} onToggleAction={handleToggleAction} embedded />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Drag overlay (only for kanban) */}
      {viewMode === 'kanban' && (
        <DragOverlay>
          {activeNote && (
            <div className={cn(
              'bg-card border border-border p-3 w-[280px] shadow-xl',
              'border-l-[3px]',
              activeNote.type === 'voice' ? 'border-l-donnie' : 'border-l-mikey'
            )}>
              <h3 className="text-sm font-medium line-clamp-2">{activeNote.title}</h3>
            </div>
          )}
        </DragOverlay>
      )}

      {/* Note detail modal */}
      <NoteDetail
        note={selectedNote}
        open={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        onMove={handleMove}
        onToggleAction={handleToggleAction}
      />
    </>
  );

  if (embedded) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col bg-background">
          {content}
        </div>
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen flex flex-col bg-background">
        {content}
      </div>
    </DndContext>
  );
}
