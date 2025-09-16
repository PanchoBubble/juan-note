import React from 'react';
import type { Note } from '../../types/note';

interface NoteItemContentProps {
    note: Note;
    onLabelClick?: (label: string) => void;
}

export const NoteItemContent = React.memo(function NoteItemContent({
    note,
    onLabelClick
}: NoteItemContentProps) {
    return (
        <div className="text-yellow-300 text-sm leading-relaxed flex-1 min-h-0 flex flex-col">
            <div className="grid grid-cols-[1fr_auto] gap-3 flex-1">
                {note.content ? (
                    <div
                        id={`note-content-${note.id}`}
                        className="bg-surface-tertiary rounded-lg p-2 border-l-4 border-monokai-comment border-opacity-50 flex flex-col overflow-hidden"
                    >
                        <p
                            className="overflow-hidden text-ellipsis flex-1"
                            aria-expanded={false}
                            title={note.content}
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: note.labels && note.labels.length > 0 ? 8 : 6,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: '1.4',
                                maxHeight: note.labels && note.labels.length > 0 ? '11.2em' : '5.6em'
                            }}
                        >
                            {note.content}
                        </p>
                    </div>
                ) : (
                    <div
                        id={`note-content-${note.id}`}
                        className="text-monokai-comment italic bg-surface-tertiary rounded-lg p-2 border-l-4 border-monokai-comment border-opacity-50"
                    >
                        No content
                    </div>
                )}
                {note.labels && note.labels.length > 0 && (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                        {note.labels.map((label: string, index: number) => (
                            <button
                                key={index}
                                onClick={() => onLabelClick?.(label)}
                                className="px-2 py-0.5 text-xs font-medium rounded border border-green-400 text-green-400 transition-all duration-200 cursor-pointer hover:bg-green-400 hover:bg-opacity-20 truncate max-w-32"
                                title={`Click to filter by "${label}"`}
                            >
                                <span className="flex items-center space-x-1">
                                    <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0"></span>
                                    <span className="truncate">{label}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});
