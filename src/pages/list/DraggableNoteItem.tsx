import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NoteItem } from "../../components/NoteItem";
import type { Note } from "../../types/note";

interface DraggableNoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  isSelected?: boolean;
  onItemClick?: (id: number, index: number, event: React.MouseEvent) => void;
  showSelection?: boolean;
  itemIndex?: number;
  onUpdate?: (note: Note) => void;
  isDragOverlay?: boolean;
}

export const DraggableNoteItem = React.memo(function DraggableNoteItem({
  note,
  onEdit,
  onComplete,
  onDelete,
  onLabelClick,
  isSelected = false,
  onItemClick,
  showSelection = false,
  itemIndex = 0,
  onUpdate,
  isDragOverlay = false,
}: DraggableNoteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: note.id?.toString() || `note-${Math.random()}`,
      disabled: isDragOverlay, // Disable drag for overlay
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        transition: "none", // Disable transitions during transform
      }
    : undefined;

  const dragClassName =
    !isDragOverlay && isDragging
      ? "opacity-50 shadow-2xl z-50"
      : !isDragOverlay
        ? "cursor-grab active:cursor-grabbing"
        : "";

  return (
    <NoteItem
      note={note}
      onEdit={onEdit}
      onComplete={onComplete}
      onDelete={onDelete}
      onLabelClick={onLabelClick}
      isSelected={isSelected}
      onItemClick={onItemClick}
      showSelection={showSelection}
      itemIndex={itemIndex}
      onUpdate={onUpdate}
      isDragOverlay={isDragOverlay}
      className={dragClassName}
      style={style}
      dragAttributes={!isDragOverlay ? attributes : {}}
      dragListeners={!isDragOverlay ? listeners : {}}
      forwardedRef={setNodeRef}
    />
  );
});
