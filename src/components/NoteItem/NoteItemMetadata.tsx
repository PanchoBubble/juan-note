import React from 'react';
import type { Note } from '../../types/note';

interface NoteItemMetadataProps {
    note: Note;
}

export const NoteItemMetadata = React.memo(function NoteItemMetadata({ note }: NoteItemMetadataProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center space-x-1">
                {note.updated_at && (
                    <span className="flex items-center space-x-1">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">{formatDate(note.updated_at)}</span>
                    </span>
                )}
            </div>
            <div className="text-gray-500 text-xs">
                {note.id}
            </div>
        </div>
    );
});