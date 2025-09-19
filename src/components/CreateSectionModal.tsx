import React, { useState, useRef, useEffect } from "react";
import { Modal } from "./Modal";

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSection: (name: string) => void;
}

export const CreateSectionModal: React.FC<CreateSectionModalProps> = ({
  isOpen,
  onClose,
  onCreateSection,
}) => {
  const [sectionName, setSectionName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sectionName.trim()) {
      onCreateSection(sectionName.trim());
      setSectionName("");
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleClose = () => {
    setSectionName("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Section">
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="section-name"
              className="block text-sm font-medium text-monokai-fg mb-2"
            >
              Section Name
            </label>
            <input
              ref={inputRef}
              id="section-name"
              type="text"
              value={sectionName}
              onChange={e => setSectionName(e.target.value)}
              placeholder="Enter section name..."
              className="
                w-full px-3 py-2 bg-surface-secondary border border-monokai-comment border-opacity-30
                rounded-md text-monokai-fg placeholder-monokai-comment focus:outline-none
                focus:ring-2 focus:ring-monokai-blue focus:border-transparent
              "
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="
              px-4 py-2 text-sm font-medium text-monokai-fg bg-surface-secondary
              border border-monokai-comment border-opacity-30 rounded-md
              hover:bg-surface-tertiary transition-colors focus:outline-none
              focus:ring-2 focus:ring-monokai-blue focus:ring-opacity-50
            "
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!sectionName.trim()}
            className="
              px-4 py-2 text-sm font-medium text-white bg-monokai-blue
              border border-transparent rounded-md hover:bg-opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:ring-opacity-50
            "
          >
            Create Section
          </button>
        </div>
      </form>
    </Modal>
  );
};
