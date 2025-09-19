import React, { useCallback, useState, useRef } from "react";
import type { Note, UpdateNoteRequest } from "../../types/note";
import { NoteService } from "../../services/noteService";
import { NoteItemActions } from "./NoteItemActions";
import { NoteItemTitle } from "./NoteItemTitle";
import { NoteItemContent } from "./NoteItemContent";
import { NoteItemMetadata } from "./NoteItemMetadata";
import { InlineNoteEditor } from "./InlineNoteEditor";

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
  onUpdate?: (note: Note) => void;
  isDragOverlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  dragAttributes?: Record<string, any>;
  dragListeners?: Record<string, any>;
  forwardedRef?: (element: HTMLElement | null) => void;
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
  onUpdate,
  isDragOverlay = false,
  className = "",
  style,
  dragAttributes = {},
  dragListeners = {},
  forwardedRef,
}: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent selection when clicking on interactive elements
      const target = e.target as HTMLElement;
      const isInteractive = target.closest(
        '.interactive-element, button, input, textarea, select, a, [role="button"]'
      );

      // But allow shift+click and cmd+click even on interactive elements for selection
      if (isInteractive && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        return;
      }

      // Don't handle cmd/ctrl+click here - it's handled in onPointerDown to prevent double triggering
      if (e.metaKey || e.ctrlKey) {
        return;
      }

      if (showSelection && note.id && onItemClick) {
        onItemClick(note.id, itemIndex, e);
      }
    },
    [showSelection, note.id, onItemClick, itemIndex]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't handle selection keys when editing
      if (isEditing) return;

      if (showSelection && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        if (note.id && onItemClick) {
          // Create a mock mouse event for keyboard selection
          const mockEvent = {
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            ctrlKey: e.ctrlKey,
            preventDefault: () => {},
            stopPropagation: () => {},
          } as React.MouseEvent;
          onItemClick(note.id, itemIndex, mockEvent);
        }
      }
    },
    [showSelection, note.id, onItemClick, itemIndex, isEditing]
  );

  const handleNoteSave = useCallback(
    async (newTitle: string, newContent: string) => {
      if (note.id) {
        const updateRequest: UpdateNoteRequest = {
          id: note.id,
          title: newTitle,
          content: newContent,
        };
        const response = await NoteService.updateNote(updateRequest);
        if (response.success && response.data) {
          onUpdate?.(response.data);
        }
      }
      setIsEditing(false);
    },
    [note.id, onUpdate]
  );

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <article
      ref={el => {
        if (forwardedRef) forwardedRef(el);
        (cardRef as any).current = el;
      }}
      style={style}
      {...dragAttributes}
      {...dragListeners}
      className={`relative bg-surface-secondary rounded-xl shadow-sm border border-monokai border-opacity-30 p-4 hover:shadow-lg hover:border-monokai-orange group flex-1 overflow-visible select-none ${className} ${
        isDragOverlay ? "shadow-2xl z-50 rotate-3" : ""
      } ${isSelected ? "ring-2 ring-monokai-blue ring-opacity-70 bg-monokai-blue bg-opacity-10 border-monokai-blue" : ""}`}
      role={showSelection ? "button" : "article"}
      aria-labelledby={`note-title-${note.id}`}
      aria-describedby={`note-content-${note.id}`}
      aria-selected={isSelected}
      data-note-id={note.id}
      data-selected={isSelected}
      tabIndex={showSelection ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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
        isEditing={isEditing}
        onComplete={onComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Content area */}
      <div
        className="flex-1 flex flex-col"
        onDoubleClick={e => {
          e.stopPropagation();
          e.preventDefault();
          if (!isEditing) {
            setIsEditing(true);
          }
        }}
        onPointerDown={e => {
          // Handle cmd/ctrl+click for selection before drag system takes over
          if (
            (e.metaKey || e.ctrlKey) &&
            showSelection &&
            note.id &&
            onItemClick
          ) {
            e.preventDefault();
            onItemClick(note.id, itemIndex, e as any);
          }
        }}
        onKeyDown={handleKeyDown}
      >
        {isEditing ? (
          <div className="mb-3">
            <InlineNoteEditor
              title={note.title || ""}
              content={note.content || ""}
              onSave={handleNoteSave}
              onCancel={handleEditCancel}
            />
          </div>
        ) : (
          <>
            <NoteItemTitle note={note} />
            <NoteItemContent note={note} onLabelClick={onLabelClick} />
          </>
        )}

        <NoteItemMetadata note={note} />
      </div>
    </article>
  );
});
