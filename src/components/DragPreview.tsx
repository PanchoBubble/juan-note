import { memo } from "react";
import type { Note, State } from "../types/note";

interface DragPreviewProps {
  item: Note | State | null;
  type: "note" | "column" | null;
}

export const DragPreview = memo(function DragPreview({
  item,
  type,
}: DragPreviewProps) {
  if (!item || !type) return null;

  if (type === "note") {
    const note = item as Note;
    return (
      <div className="drag-overlay drag-preview-note">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-monokai-fg truncate">
            {note.title || "Untitled Note"}
          </h4>
          {note.priority && (
            <span
              className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
                note.priority === 1
                  ? "bg-monokai-red/20 text-monokai-red"
                  : note.priority === 2
                    ? "bg-monokai-orange/20 text-monokai-orange"
                    : note.priority === 3
                      ? "bg-monokai-yellow/20 text-monokai-yellow"
                      : "bg-monokai-comment/20 text-monokai-comment"
              }`}
            >
              P{note.priority}
            </span>
          )}
        </div>

        {note.content && (
          <p className="text-xs text-monokai-comment line-clamp-2 mb-2">
            {note.content}
          </p>
        )}

        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.labels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-monokai-blue/20 text-monokai-blue rounded-full"
              >
                {label}
              </span>
            ))}
            {note.labels.length > 3 && (
              <span className="text-xs text-monokai-comment">
                +{note.labels.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (type === "column") {
    const state = item as State;
    return (
      <div className="drag-overlay drag-preview-column">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-monokai-fg">
            {state.name}
          </h4>
          <div
            className="w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: state.color }}
          />
        </div>

        <div className="flex items-center text-sm text-monokai-comment">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Workflow Column</span>
        </div>

        <div className="mt-3 text-xs text-monokai-comment">
          Position: {state.position + 1}
        </div>
      </div>
    );
  }

  return null;
});
