import React, { useState } from "react";
import type { Note } from "../../../types/note";

interface NoteItemActionsProps {
  note: Note;
  isEditing?: boolean;
  onComplete: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export const NoteItemActions = React.memo(function NoteItemActions({
  note,
  onComplete,
  onEdit,
  onDelete,
  isEditing = false,
}: NoteItemActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  if (isEditing) return;

  return (
    <>
      {/* Action buttons - only visible on hover */}
      <div className="interactive-element absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 z-10">
        {/* Mark as complete button */}
        {!note.done && (
          <button
            onClick={e => {
              e.stopPropagation();
              onComplete(note);
            }}
            className="w-7 h-7 p-0 m-0 flex items-center justify-center text-monokai-comment hover:text-white hover:bg-monokai-green rounded-full focus:outline-none focus:ring-2 focus:ring-monokai-green focus:ring-opacity-50 shadow-lg bg-surface-secondary"
            style={{ margin: 0, padding: 0 }}
            title="Mark as complete"
            aria-label={`Mark note as complete: ${note.title || "Untitled"}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        )}

        {/* 3-dots menu button */}
        <div className="relative">
          <button
            onClick={e => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="w-7 h-7 p-0 m-0 flex items-center justify-center text-monokai-comment hover:text-monokai-fg hover:bg-surface-primary rounded-full focus:outline-none focus:ring-2 focus:ring-monokai-fg focus:ring-opacity-50 shadow-lg bg-surface-secondary"
            style={{ margin: 0, padding: 0 }}
            title="More options"
            aria-label="More options"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v.01M12 12v.01M12 18v.01"
              />
            </svg>
          </button>

          {/* Dropdown menu - positioned to overflow card */}
          {isMenuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const textToCopy = `${note.title || "Untitled Note"}\n\n${note.content || "No content"}`;
                    navigator.clipboard.writeText(textToCopy);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-monokai-comment hover:text-monokai-purple hover:bg-monokai-purple hover:bg-opacity-10 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Copy note</span>
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(note);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-monokai-comment hover:text-monokai-blue hover:bg-monokai-blue hover:bg-opacity-10 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit note</span>
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(note);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-monokai-comment hover:text-monokai-pink hover:bg-monokai-pink hover:bg-opacity-10 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete note</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
});
