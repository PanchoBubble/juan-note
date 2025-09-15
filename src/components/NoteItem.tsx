import React, { useState } from 'react';
import type { Note } from '../types/note';

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onLabelClick?: (label: string) => void;
}

export const NoteItem = React.memo(function NoteItem({ note, onEdit, onDelete, onLabelClick }: NoteItemProps) {
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
      case 1: return 'text-amber-700 bg-amber-50 border-amber-200';
      case 2: return 'text-orange-700 bg-orange-50 border-orange-200';
      case 3: return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const getLabelColor = (label: string) => {
    // Simple hash-based color assignment for consistent colors
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
      'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
      'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
    ];
    const hash = label.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <article
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 hover:-translate-y-0.5 group"
      role="article"
      aria-labelledby={`note-title-${note.id}`}
      aria-describedby={`note-content-${note.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3
          id={`note-title-${note.id}`}
          className="text-lg font-semibold text-gray-900 flex-1 mr-4"
        >
          {note.title || 'Untitled Note'}
        </h3>
        <div className="flex items-center space-x-2">
          {note.priority > 0 && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${getPriorityColor(note.priority)}`}>
              <span className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${
                  note.priority === 1 ? 'bg-amber-500' :
                  note.priority === 2 ? 'bg-orange-500' : 'bg-red-500'
                }`}></span>
                <span>{getPriorityLabel(note.priority)}</span>
              </span>
            </span>
          )}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(note)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Edit note"
              aria-label={`Edit note: ${note.title || 'Untitled'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(note)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Delete note"
              aria-label={`Delete note: ${note.title || 'Untitled'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="text-gray-700 text-sm leading-relaxed mb-3">
        {note.content ? (
          <div
            id={`note-content-${note.id}`}
            className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-200"
          >
            <p
              className={`${!isExpanded && note.content.length > 200 ? 'line-clamp-4' : ''}`}
              aria-expanded={isExpanded}
            >
              {isExpanded || note.content.length <= 200
                ? note.content
                : `${note.content.substring(0, 200)}...`
              }
            </p>
            {note.content.length > 200 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-expanded={isExpanded}
                aria-controls={`note-content-${note.id}`}
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        ) : (
          <div
            id={`note-content-${note.id}`}
            className="text-gray-400 italic bg-gray-50 rounded-lg p-3 border-l-4 border-gray-200"
          >
            No content
          </div>
        )}
      </div>

      {note.labels && note.labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {note.labels.map((label, index) => (
            <button
              key={index}
              onClick={() => onLabelClick?.(label)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-sm ${getLabelColor(label)}`}
              title={`Click to filter by "${label}"`}
            >
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                <span>{label}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
        <div className="flex items-center space-x-4">
          {note.updated_at && (
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated {formatDate(note.updated_at)}</span>
            </span>
          )}
          {note.created_at && note.created_at !== note.updated_at && (
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Created {formatDate(note.created_at)}</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">ID: {note.id}</span>
        </div>
      </div>
    </article>
  );
});