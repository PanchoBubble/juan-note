import { useState } from 'react';
import type { CreateNoteRequest } from '../types/note';

interface InlineCreateProps {
  onSave: (request: CreateNoteRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  defaultLabels?: string[];
  defaultPriority?: number;
}

export function InlineCreate({ onSave, onCancel, loading, defaultLabels = [], defaultPriority = 0 }: InlineCreateProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() && !content.trim()) {
      return;
    }

    const request: CreateNoteRequest = {
      title: title.trim(),
      content: content.trim(),
      priority: defaultPriority,
      labels: defaultLabels,
    };

    await onSave(request);
    // Reset form
    setTitle('');
    setContent('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isExpanded) {
    return (
      <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-blue-400 transition-colors">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-center text-gray-500 hover:text-blue-600"
          disabled={loading}
        >
          <div className="flex flex-col items-center space-y-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Add a new note</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-blue-400 p-6">
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
            placeholder="Note title..."
            disabled={loading}
            autoFocus
          />
        </div>

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Note content..."
            disabled={loading}
          />
        </div>

        {(defaultLabels.length > 0 || defaultPriority > 0) && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {defaultLabels.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Labels:</span>{' '}
                {defaultLabels.map((label, index) => (
                  <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">
                    {label}
                  </span>
                ))}
              </div>
            )}
            {defaultPriority > 0 && (
              <div>
                <span className="font-medium">Priority:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  defaultPriority === 1 ? 'text-amber-700 bg-amber-50' :
                  defaultPriority === 2 ? 'text-orange-700 bg-orange-50' :
                  'text-red-700 bg-red-50'
                }`}>
                  {defaultPriority === 1 ? 'Low' : defaultPriority === 2 ? 'Medium' : 'High'}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              onCancel();
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || (!title.trim() && !content.trim())}
          >
            {loading ? 'Creating...' : 'Create Note'}
          </button>
        </div>
      </form>
    </div>
  );
}