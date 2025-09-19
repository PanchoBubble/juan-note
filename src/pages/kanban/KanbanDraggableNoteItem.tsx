import React, { useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NoteItem } from "../../components/NoteItem";
import type { Note } from "../../types/note";

interface KanbanDraggableNoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  onUpdate?: (note: Note) => void;
  isDragOverlay?: boolean;
}

export const KanbanDraggableNoteItem = React.memo(
  function KanbanDraggableNoteItem({
    note,
    onEdit,
    onComplete,
    onDelete,
    onLabelClick,
    onUpdate,
    isDragOverlay = false,
  }: KanbanDraggableNoteItemProps) {
    // Use sortable for within-column reordering
    const {
      attributes: sortableAttributes,
      listeners: sortableListeners,
      setNodeRef: setSortableRef,
      transform: sortableTransform,
      isDragging: isSortableDragging,
    } = useSortable({
      id: note.id?.toString() || "",
      disabled: isDragOverlay,
    });

    // Use draggable for cross-column moves
    const {
      setNodeRef: setDraggableRef,
      transform: draggableTransform,
      isDragging: isDraggableDragging,
    } = useDraggable({
      id: note.id?.toString() || "",
      disabled: isDragOverlay,
      data: {
        type: "note",
        note: note,
        sourceColumn: note.state_id,
      },
    });

    // Combine both ref setters for kanban mode
    const combineRefs = useCallback(
      (element: HTMLElement | null) => {
        setSortableRef(element);
        setDraggableRef(element);
      },
      [setSortableRef, setDraggableRef]
    );

    // In kanban mode, we use both systems active
    // The collision detection will determine which operation to perform
    const isDragging = isSortableDragging || isDraggableDragging;
    const activeTransform = sortableTransform || draggableTransform;

    const style = activeTransform
      ? {
          transform: CSS.Translate.toString(activeTransform),
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
        onUpdate={onUpdate}
        isDragOverlay={isDragOverlay}
        className={dragClassName}
        style={style}
        dragAttributes={!isDragOverlay ? sortableAttributes : {}}
        dragListeners={!isDragOverlay ? sortableListeners : {}}
        forwardedRef={combineRefs}
      />
    );
  }
);
