import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Note } from '../../types/note';
import { NoteItemActions, NoteItemTitle, NoteItemContent, NoteItemMetadata } from './';

interface NoteItemProps {
    note: Note;
    onEdit: (note: Note) => void;
    onComplete: (note: Note) => void;
    onDelete: (note: Note) => void;
    onLabelClick?: (label: string) => void;
    isSelected?: boolean;
    onSelectionChange?: (selected: boolean) => void;
    showSelection?: boolean;
}

export const NoteItem = React.memo(function NoteItem({
    note,
    onEdit,
    onComplete,
    onDelete,
    onLabelClick,
    isSelected = false,
    onSelectionChange,
    showSelection = false
}: NoteItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: note.id?.toString() || '',
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;



    return (
        <article
            ref={setNodeRef}
            style={style}
            className={`relative bg-surface-secondary rounded-xl shadow-sm border border-monokai border-opacity-30 p-4 hover:shadow-lg hover:border-monokai-orange transition-all duration-200 group flex-1 min-w-80 max-h-80 overflow-visible ${isDragging ? 'opacity-50' : ''
                } ${isSelected ? 'ring-2 ring-monokai-blue ring-opacity-50 bg-monokai-blue bg-opacity-5' : ''}`}
            role="article"
            aria-labelledby={`note-title-${note.id}`}
            aria-describedby={`note-content-${note.id}`}
        >
            {/* Selection Checkbox */}
            {showSelection && (
                <div className="absolute top-3 left-3 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectionChange?.(e.target.checked)}
                        className="w-4 h-4 text-monokai-blue bg-surface-secondary border-monokai-comment rounded focus:ring-monokai-blue focus:ring-2"
                        aria-label={`Select note: ${note.title || 'Untitled'}`}
                    />
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
            >
                <NoteItemTitle note={note} />

                <NoteItemContent
                    note={note}
                    onLabelClick={onLabelClick}
                />

                <NoteItemMetadata note={note} />
            </div>
        </article>
    );
});
