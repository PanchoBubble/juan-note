import { useState, useRef, useEffect } from "react";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import type { State } from "../../types/note";

interface ColumnManagementMenuProps {
  state: State;
  onEdit: (state: State) => void;
  onDelete: (stateId: number) => Promise<boolean>;
  onDuplicate?: (state: State) => void;
}

export function ColumnManagementMenu({
  state,
  onEdit,
  onDelete,
  onDuplicate,
}: ColumnManagementMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case "Enter":
      case " ":
        if (!isOpen) {
          event.preventDefault();
          setIsOpen(true);
        }
        break;
    }
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!state.id) return;

    setIsDeleting(true);
    try {
      const success = await onDelete(state.id);
      if (success) {
        setShowDeleteConfirm(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="p-1 hover:bg-[#2f2f2a]/50 rounded transition-colors interactive-element"
        aria-label={`Column options for ${state.name}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg
          className="w-4 h-4 text-monokai-comment hover:text-monokai-fg transition-colors"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-8 w-48 bg-[#272822] border border-[#75715e]/30 rounded-lg shadow-lg z-50 py-1"
          role="menu"
          aria-orientation="vertical"
        >
          <button
            type="button"
            onClick={() => handleMenuItemClick(() => onEdit(state))}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[#2f2f2a]/50 flex items-center space-x-2 transition-colors"
            role="menuitem"
          >
            <svg
              className="w-4 h-4 text-monokai-blue"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span className="text-monokai-fg">Edit column</span>
          </button>

          {onDuplicate && (
            <button
              type="button"
              onClick={() => handleMenuItemClick(() => onDuplicate(state))}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#2f2f2a]/50 flex items-center space-x-2 transition-colors"
              role="menuitem"
            >
              <svg
                className="w-4 h-4 text-monokai-green"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-monokai-fg">Duplicate column</span>
            </button>
          )}

          <hr className="my-1 border-[#75715e]/20" />

          <button
            type="button"
            onClick={() => handleMenuItemClick(handleDelete)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-monokai-red/10 flex items-center space-x-2 transition-colors"
            role="menuitem"
          >
            <svg
              className="w-4 h-4 text-monokai-red"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-monokai-red">Delete column</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Column"
        message={`Are you sure you want to delete the "${state.name}" column? This action cannot be undone and will affect all notes in this column.`}
        confirmText="Delete Column"
        cancelText="Cancel"
        confirmButtonVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
