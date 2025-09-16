import { Modal } from './Modal';
import type { Note } from '../types/note';

interface CompleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  note: Note | null;
  loading: boolean;
}

export function CompleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  note,
  loading
}: CompleteConfirmModalProps) {
  if (!note) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Note as Complete"
      size="sm"
    >
      <div className="p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-monokai-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-monokai-fg mb-2">
              Mark Note as Complete
            </h3>
            <p className="text-sm text-monokai-comment mb-4">
              Are you sure you want to mark this note as complete? This will update its status and move it to the completed section.
            </p>
            <div className="bg-surface-tertiary rounded-lg p-3 mb-4 border border-monokai-comment border-opacity-30">
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
            className="px-4 py-2 text-sm font-medium text-monokai-pink bg-surface-secondary border-2 border-monokai-pink rounded-lg hover:bg-surface-tertiary hover:border-monokai-pink focus:outline-none focus:ring-2 focus:ring-monokai-pink focus:ring-opacity-30 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-monokai-green bg-monokai-green border-2 border-monokai-green rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-monokai-green focus:ring-opacity-30 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Completing...' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}