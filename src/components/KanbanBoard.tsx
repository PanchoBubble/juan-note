import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { useKanbanView } from "../hooks/useKanbanView";
import type { Note, State } from "../types/note";

interface KanbanBoardProps {
  notes: Note[];
  states: State[];
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onUpdate?: (note: Note) => void;
  onLabelClick?: (label: string) => void;
}

export function KanbanBoard({
  notes,
  states,
  onEdit,
  onComplete,
  onDelete,
  onUpdate,
  onLabelClick,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const {
    handleDrop,
    handleDragStart,
    handleDragEnd,
    getNotesByState,
    getNotesWithoutState,
  } = useKanbanView(notes, states);

  const handleDragStartEvent = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const noteId = parseInt(event.active.id as string);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      handleDragStart({
        ...note,
        stateId: note.state_id,
      });
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEndEvent = (event: DragEndEvent) => {
    setActiveId(null);
    handleDragEnd();

    const { active, over } = event;
    if (!over) return;

    const noteId = parseInt(active.id as string);
    const targetStateId = parseInt(over.id as string);

    if (!isNaN(noteId) && !isNaN(targetStateId)) {
      handleDrop(targetStateId);
    }
  };

  // Create columns from states
  const columns = states.map(state => ({
    id: state.id!,
    title: state.name,
    colorClass: state.color
      ? `bg-[${state.color}]`
      : "bg-gray-100 border-gray-200",
    notes: getNotesByState(state.id!),
  }));

  // Add a column for notes without states
  if (getNotesWithoutState().length > 0) {
    columns.unshift({
      id: -1,
      title: "Unassigned",
      colorClass: "bg-gray-100 border-gray-200",
      notes: getNotesWithoutState(),
    });
  }

  return (
    <DndContext
      onDragStart={handleDragStartEvent}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEndEvent}
    >
      <div className="flex gap-6 overflow-x-auto pb-6">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            notes={column.notes}
            colorClass={column.colorClass}
            onEdit={onEdit}
            onComplete={onComplete}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onLabelClick={onLabelClick}
            isDragOver={activeId !== null}
          />
        ))}
      </div>
    </DndContext>
  );
}
