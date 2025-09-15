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
      case 1: return 'text-warning-700 dark:text-warning-400 bg-warning-light dark:bg-warning-950 border-warning-200 dark:border-warning-700';
      case 2: return 'text-warning-800 dark:text-warning-300 bg-warning-light dark:bg-warning-950 border-warning-300 dark:border-warning-600';
      case 3: return 'text-danger-700 dark:text-danger-400 bg-danger-light dark:bg-danger-950 border-danger-200 dark:border-danger-700';
      default: return 'text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-800 border-primary-300 dark:border-primary-600';
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
    // Professional color assignment for consistent labels
    const colors = [
      'bg-accent-50 dark:bg-accent-950 text-accent-700 dark:text-accent-400 border-accent-200 dark:border-accent-700 hover:bg-accent-100 dark:hover:bg-accent-900',
      'bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-400 border-success-200 dark:border-success-700 hover:bg-success-100 dark:hover:bg-success-900',
      'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900',
      'bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-700 hover:bg-pink-100 dark:hover:bg-pink-900',
      'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900',
      'bg-warning-50 dark:bg-warning-950 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-700 hover:bg-warning-100 dark:hover:bg-warning-900',
      'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900',
      'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900'
    ];
    const hash = label.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <article
      className="bg-white dark:bg-primary-900 rounded-xl shadow-sm border border-primary-200 dark:border-primary-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 hover:-translate-y-0.5 group"
      role="article"
      aria-labelledby={`note-title-${note.id}`}
      aria-describedby={`note-content-${note.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3
          id={`note-title-${note.id}`}
          className="text-lg font-semibold text-primary-900 dark:text-primary-50 flex-1 mr-4"
        >
          {note.title || 'Untitled Note'}
        </h3>
        <div className="flex items-center space-x-2">
          {note.priority > 0 && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${getPriorityColor(note.priority)}`}>
              <span className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${
                  note.priority === 1 ? 'bg-warning-500' :
                  note.priority === 2 ? 'bg-warning-600' : 'bg-danger-500'
                }`}></span>
                <span>{getPriorityLabel(note.priority)}</span>
              </span>
            </span>
          )}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(note)}
              className="p-2 text-primary-500 dark:text-primary-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent-200 dark:focus:ring-accent-800"
              title="Edit note"
              aria-label={`Edit note: ${note.title || 'Untitled'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(note)}
              className="p-2 text-primary-500 dark:text-primary-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-danger-200 dark:focus:ring-danger-800"
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

      <div className="text-primary-700 dark:text-primary-200 text-sm leading-relaxed mb-3">
        {note.content ? (
          <div
            id={`note-content-${note.id}`}
            className="bg-primary-50 dark:bg-primary-800 rounded-lg p-3 border-l-4 border-primary-200 dark:border-primary-600"
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
                className="mt-2 text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 text-xs font-medium hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-accent-light rounded"
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
            className="text-primary-500 dark:text-primary-400 italic bg-primary-50 dark:bg-primary-800 rounded-lg p-3 border-l-4 border-primary-200 dark:border-primary-600"
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

      <div className="flex items-center justify-between text-xs text-primary-500 dark:text-primary-400 border-t border-primary-200 dark:border-primary-700 pt-3">
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
          <span className="text-primary-500 dark:text-primary-400">ID: {note.id}</span>
        </div>
      </div>
    </article>
  );
});