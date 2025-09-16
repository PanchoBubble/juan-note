import React from "react";
import type { Note } from "../../types/note";

interface NoteItemContentProps {
  note: Note;
  onLabelClick?: (label: string) => void;
}

export const NoteItemContent = React.memo(function NoteItemContent({
  note,
  onLabelClick,
}: NoteItemContentProps) {
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-monokai-yellow text-monokai-bg border-monokai-yellow";
      case 2:
        return "bg-monokai-orange text-monokai-bg border-monokai-orange";
      case 3:
        return "bg-monokai-pink text-monokai-bg border-monokai-pink";
      default:
        return "bg-monokai-comment text-monokai-bg border-monokai-comment";
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

  const hasMetadata =
    note.priority > 0 || (note.labels && note.labels.length > 0);

  return (
    <div className="text-yellow-300 text-sm leading-relaxed flex-1 min-h-0 flex flex-col">
      <div className="grid grid-cols-[1fr_auto] gap-3 flex-1">
        {note.content ? (
          <div
            id={`note-content-${note.id}`}
            className="bg-surface-tertiary rounded-lg p-2 border-l-4 border-monokai-comment border-opacity-50 flex flex-col overflow-hidden"
          >
            <p
              className="overflow-hidden text-ellipsis flex-1"
              aria-expanded={false}
              title={note.content}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: hasMetadata ? 8 : 6,
                WebkitBoxOrient: "vertical",
                lineHeight: "1.4",
                maxHeight: hasMetadata ? "11.2em" : "5.6em",
              }}
            >
              {note.content}
            </p>
          </div>
        ) : (
          <div
            id={`note-content-${note.id}`}
            className="text-monokai-comment italic bg-surface-tertiary rounded-lg p-2 border-l-4 border-monokai-comment border-opacity-50"
          >
            No content
          </div>
        )}
        {hasMetadata && (
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {/* Priority badge - filled style for prominence */}
            {note.priority > 0 && (
              <div
                className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 ${getPriorityColor(note.priority)} flex-shrink-0 min-w-fit`}
              >
                <span className="flex items-center space-x-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-monokai-bg opacity-80`}
                  ></span>
                  <span className="whitespace-nowrap font-bold">
                    {getPriorityLabel(note.priority)}
                  </span>
                </span>
              </div>
            )}
            {/* Label badges - outline style for secondary info */}
            {note.labels &&
              note.labels.map((label: string, index: number) => (
                <button
                  key={index}
                  onClick={e => {
                    e.stopPropagation();
                    onLabelClick?.(label);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full border-2 border-monokai-green text-monokai-green bg-transparent transition-all duration-200 cursor-pointer hover:bg-monokai-green hover:bg-opacity-15 hover:shadow-sm truncate max-w-32 min-w-fit shadow-sm"
                  title={`Click to filter by "${label}"`}
                >
                  <span className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-monokai-green flex-shrink-0"></span>
                    <span className="truncate font-medium">{label}</span>
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
});
