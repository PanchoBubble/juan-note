import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { CreateNoteRequest } from '../types/note';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: CreateNoteRequest) => Promise<void>;
  loading: boolean;
  defaultLabels?: string[];
  defaultPriority?: number;
}

export function QuickCreateModal({
  isOpen,
  onClose,
  onSave,
  loading,
  defaultLabels = [],
  defaultPriority = 0
}: QuickCreateModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
    }
  }, [isOpen]);

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
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Allow Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Create Note"
      size="sm"
    >
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-4 space-y-4">
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
            onClick={onClose}
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

        <div className="text-xs text-gray-500 text-center">
          Press Ctrl/Cmd + Enter to create quickly
        </div>
      </form>
    </Modal>
  );
}