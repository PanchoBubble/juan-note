import React from "react";
import type { Note } from "../../types/note";

interface NoteItemTitleProps {
  note: Note;
}

export const NoteItemTitle = React.memo(function NoteItemTitle({
  note,
}: NoteItemTitleProps) {
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "text-monokai-yellow bg-monokai-bg bg-opacity-80 border-monokai-comment";
      case 2:
        return "text-monokai-orange bg-monokai-bg bg-opacity-80 border-monokai-comment";
      case 3:
        return "text-monokai-pink bg-monokai-bg bg-opacity-80 border-monokai-comment";
      default:
        return "text-monokai-comment bg-monokai-bg bg-opacity-80 border-monokai-comment";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      default:
        return "Normal";
    }
  };

  return (
    <div className="mb-3">
      <div className="flex items-start justify-between">
        <h3
          id={`note-title-${note.id}`}
          className="text-base font-semibold text-orange-400 flex-1 pr-2"
          title={note.title || "Untitled Note"}
        >
          {note.title || "Untitled Note"}
        </h3>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {note.done && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold border shadow-sm text-monokai-green bg-monokai-bg bg-opacity-80 border-monokai-comment flex-shrink-0">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-monokai-green"></span>
                <span>Done</span>
              </span>
            </span>
          )}
          {note.priority > 0 && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold border shadow-sm ${getPriorityColor(note.priority)} flex-shrink-0`}
            >
              <span className="flex items-center space-x-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    note.priority === 1
                      ? "bg-monokai-yellow"
                      : note.priority === 2
                        ? "bg-monokai-orange"
                        : "bg-monokai-pink"
                  }`}
                ></span>
                <span>{getPriorityLabel(note.priority)}</span>
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
