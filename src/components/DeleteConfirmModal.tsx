import { Modal } from './Modal';
import type { Note } from '../types/note';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  note: Note | null;
  loading: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  note,
  loading
}: DeleteConfirmModalProps) {
  if (!note) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Note"
      size="sm"
    >
      <div className="p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-monokai-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-monokai-fg mb-2">
              Delete Note
            </h3>
            <p className="text-sm text-monokai-comment mb-4">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="bg-surface-tertiary border border-monokai-yellow border-opacity-30 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-monokai-fg mb-1">
                {note.title || 'Untitled Note'}
              </p>
              {note.content && (
                <p className="text-sm text-monokai-comment line-clamp-2">
                  {note.content.length > 100
                    ? `${note.content.substring(0, 100)}...`
                    : note.content
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-monokai-blue bg-surface-secondary border-2 border-monokai-blue rounded-lg hover:bg-surface-tertiary hover:border-monokai-blue focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:ring-opacity-30 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-monokai-pink bg-monokai-pink border-2 border-monokai-pink rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-monokai-pink focus:ring-opacity-30 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete Note'}
          </button>
        </div>
      </div>
    </Modal>
  );
}