import React, { useState } from 'react';
import type { Note } from '../types/note';

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
}

export function NoteItem({ note, onEdit, onDelete }: NoteItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-orange-600 bg-orange-100';
      case 3: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      default: return 'Normal';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
          {note.title || 'Untitled Note'}
        </h3>
        <div className="flex items-center space-x-2">
          {note.priority > 0 && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.priority)}`}>
              {getPriorityLabel(note.priority)}
            </span>
          )}
          <button
            onClick={() => onEdit(note)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit note"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(note.id!)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete note"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="text-gray-600 text-sm mb-2">
        {note.content && (
          <p className={`mb-2 ${!isExpanded && note.content.length > 150 ? 'line-clamp-3' : ''}`}>
            {isExpanded || note.content.length <= 150
              ? note.content
              : `${note.content.substring(0, 150)}...`
            }
          </p>
        )}
        {note.content && note.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {note.labels && note.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.labels.map((label, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500">
        {note.updated_at && (
          <span>Updated: {formatDate(note.updated_at)}</span>
        )}
        {note.created_at && note.created_at !== note.updated_at && (
          <span className="ml-4">Created: {formatDate(note.created_at)}</span>
        )}
      </div>
    </div>
  );
}