import { useState, useEffect } from 'react';
import type { Note } from '../types/note';

export type KanbanStatus = 'todo' | 'in-progress' | 'done';

export interface KanbanNote extends Note {
  status: KanbanStatus;
}

const STATUS_LABELS: Record<KanbanStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done'
};

const STATUS_COLORS: Record<KanbanStatus, string> = {
  'todo': 'bg-gray-100 border-gray-200',
  'in-progress': 'bg-blue-100 border-blue-200',
  'done': 'bg-green-100 border-green-200'
};

export function useKanbanView(notes: Note[]) {
  const [kanbanNotes, setKanbanNotes] = useState<KanbanNote[]>([]);
  const [draggedNote, setDraggedNote] = useState<KanbanNote | null>(null);

  // Convert notes to kanban format
  useEffect(() => {
    const converted = notes.map(note => ({
      ...note,
      status: (note.done ? 'done' :
               note.labels?.includes('in-progress') || note.labels?.includes('progress') ? 'in-progress' :
               'todo') as KanbanStatus
    }));
    setKanbanNotes(converted);
  }, [notes]);

  const moveNote = (noteId: number, newStatus: KanbanStatus) => {
    setKanbanNotes(prev =>
      prev.map(note =>
        note.id === noteId
          ? { ...note, status: newStatus }
          : note
      )
    );
  };

  const handleDragStart = (note: KanbanNote) => {
    setDraggedNote(note);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const handleDrop = (status: KanbanStatus) => {
    if (draggedNote && draggedNote.status !== status) {
      moveNote(draggedNote.id!, status);
    }
    setDraggedNote(null);
  };

  const getNotesByStatus = (status: KanbanStatus) => {
    return kanbanNotes.filter(note => note.status === status);
  };

  return {
    kanbanNotes,
    draggedNote,
    moveNote,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    getNotesByStatus,
    STATUS_LABELS,
    STATUS_COLORS
  };
}