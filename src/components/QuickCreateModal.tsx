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
            className="select-text w-full px-3 py-2 bg-surface-secondary border-2 border-monokai-comment border-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-monokai-blue text-monokai-fg text-lg font-medium placeholder-monokai-comment"
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
            className="select-text w-full px-3 py-2 bg-surface-secondary border-2 border-monokai-comment border-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-monokai-blue resize-none text-monokai-fg placeholder-monokai-comment"
            placeholder="Note content..."
            disabled={loading}
          />
        </div>

        {(defaultLabels.length > 0 || defaultPriority > 0) && (
          <div className="text-sm text-monokai-comment bg-surface-tertiary border border-monokai-yellow border-opacity-30 p-2 rounded">
            {defaultLabels.length > 0 && (
              <div className="mb-1">
                <span className="font-medium text-monokai-fg">Labels:</span>{' '}
                {defaultLabels.map((label, index) => (
                  <span key={index} className="inline-block bg-monokai-blue bg-opacity-20 text-monokai-blue text-xs px-2 py-1 rounded-full mr-1 border border-monokai-blue border-opacity-50">
                    {label}
                  </span>
                ))}
              </div>
            )}
            {defaultPriority > 0 && (
              <div>
                <span className="font-medium text-monokai-fg">Priority:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                  defaultPriority === 1 ? 'text-monokai-yellow bg-monokai-yellow bg-opacity-20 border-monokai-yellow border-opacity-50' :
                  defaultPriority === 2 ? 'text-monokai-orange bg-monokai-orange bg-opacity-20 border-monokai-orange border-opacity-50' :
                  'text-monokai-pink bg-monokai-pink bg-opacity-20 border-monokai-pink border-opacity-50'
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
            className="px-4 py-2 text-monokai-pink border-2 border-monokai-pink rounded-md hover:bg-monokai-pink hover:bg-opacity-20 disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-monokai-green text-monokai-green border-2 border-monokai-green rounded-md hover:bg-opacity-80 disabled:opacity-50 transition-colors"
            disabled={loading || (!title.trim() && !content.trim())}
          >
            {loading ? 'Creating...' : 'Create Note'}
          </button>
        </div>

        <div className="text-xs text-monokai-comment text-center">
          Press Ctrl/Cmd + Enter to create quickly
        </div>
      </form>
    </Modal>
  );
}