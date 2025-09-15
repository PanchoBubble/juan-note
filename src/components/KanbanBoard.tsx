import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { useKanbanView } from '../hooks/useKanbanView';
import type { Note } from '../types/note';

interface KanbanBoardProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onLabelClick?: (label: string) => void;
}

export function KanbanBoard({ notes, onEdit, onDelete, onLabelClick }: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const {
    handleDrop,
    getNotesByStatus,
    STATUS_LABELS,
    STATUS_COLORS
  } = useKanbanView(notes);

  const columns = [
    { status: 'todo' as const, title: STATUS_LABELS['todo'], colorClass: STATUS_COLORS['todo'] },
    { status: 'in-progress' as const, title: STATUS_LABELS['in-progress'], colorClass: STATUS_COLORS['in-progress'] },
    { status: 'done' as const, title: STATUS_LABELS['done'], colorClass: STATUS_COLORS['done'] }
  ];

  const handleColumnDrop = (status: string) => {
    if (dragOverColumn === status) {
      handleDrop(status as any);
    }
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          status={column.status}
          title={column.title}
          notes={getNotesByStatus(column.status)}
          colorClass={column.colorClass}
          onEdit={onEdit}
          onDelete={onDelete}
          onLabelClick={onLabelClick}
          onDrop={handleColumnDrop}
          onDragOver={(e) => handleColumnDragOver(e, column.status)}
          isDragOver={dragOverColumn === column.status}
        />
      ))}
    </div>
  );
}