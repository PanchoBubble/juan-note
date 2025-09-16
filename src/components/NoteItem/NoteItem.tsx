import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Note } from "../../types/note";
import {
  NoteItemActions,
  NoteItemTitle,
  NoteItemContent,
  NoteItemMetadata,
} from "./";

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  isSelected?: boolean;
  onItemClick?: (id: number, index: number, event: React.MouseEvent) => void;
  showSelection?: boolean;
  itemIndex?: number;
}

export const NoteItem = React.memo(function NoteItem({
  note,
  onEdit,
  onComplete,
  onDelete,
  onLabelClick,
  isSelected = false,
  onItemClick,
  showSelection = false,
  itemIndex = 0,
}: NoteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: note.id?.toString() || "",
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    if (showSelection && note.id && onItemClick) {
      onItemClick(note.id, itemIndex, e);
    }
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`relative bg-surface-secondary rounded-xl shadow-sm border border-monokai border-opacity-30 p-4 hover:shadow-lg hover:border-monokai-orange transition-all duration-200 group flex-1 min-w-80 max-h-80 overflow-visible cursor-pointer select-none ${
        isDragging ? "opacity-50" : ""
      } ${isSelected ? "ring-2 ring-monokai-blue ring-opacity-70 bg-monokai-blue bg-opacity-10 border-monokai-blue" : ""}`}
      role="article"
      aria-labelledby={`note-title-${note.id}`}
      aria-describedby={`note-content-${note.id}`}
      aria-selected={isSelected}
      data-note-id={note.id}
      data-selected={isSelected}
      tabIndex={showSelection ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={e => {
        if (showSelection && e.key === " ") {
          e.preventDefault();
          if (note.id && onItemClick) {
            // Create a mock mouse event for space key selection
            const mockEvent = {
              shiftKey: false,
              metaKey: false,
              ctrlKey: false,
              preventDefault: () => {},
              stopPropagation: () => {},
            } as React.MouseEvent;
            onItemClick(note.id, itemIndex, mockEvent);
          }
        }
      }}
    >
      {/* Selection Indicator */}
      {showSelection && isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-5 h-5 bg-monokai-blue rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      <NoteItemActions
        note={note}
        onComplete={onComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Draggable content area */}
      <div
        {...listeners}
        {...attributes}
        className="cursor-move flex-1 flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent selection when clicking draggable area
      >
        <NoteItemTitle note={note} />

        <NoteItemContent note={note} onLabelClick={onLabelClick} />

        <NoteItemMetadata note={note} />
      </div>
    </article>
  );
});
