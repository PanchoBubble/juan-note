import { useState } from "react";
import type { CreateNoteRequest } from "../types/note";

interface InlineCreateProps {
  onSave: (request: CreateNoteRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  defaultLabels?: string[];
  defaultPriority?: number;
}

export function InlineCreate({
  onSave,
  onCancel,
  loading,
  defaultLabels = [],
  defaultPriority = 0,
}: InlineCreateProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

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
    // Reset form
    setTitle("");
    setContent("");
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  if (!isExpanded) {
    return (
      <div className="bg-surface-secondary rounded-xl shadow-sm border-2 border-dashed border-monokai-comment border-opacity-50 p-6 hover:border-monokai-blue transition-colors">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-center text-monokai-comment hover:text-monokai-blue"
          disabled={loading}
        >
          <div className="flex flex-col items-center space-y-2">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm font-medium">Add a new note</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary rounded-xl shadow-sm border-2 border-monokai-blue p-6">
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-4"
      >
        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="select-text w-full px-3 py-2 bg-surface-tertiary border-2 border-monokai-comment border-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-monokai-blue text-monokai-fg text-lg font-medium placeholder-monokai-comment"
            placeholder="Note title..."
            disabled={loading}
            autoFocus
          />
        </div>

        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            className="select-text w-full px-3 py-2 bg-surface-tertiary border-2 border-monokai-comment border-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-monokai-blue resize-none text-monokai-fg placeholder-monokai-comment"
            placeholder="Note content..."
            disabled={loading}
          />
        </div>

        {(defaultLabels.length > 0 || defaultPriority > 0) && (
          <div className="text-sm text-monokai-comment bg-surface-tertiary border border-monokai-yellow border-opacity-30 p-2 rounded">
            {defaultLabels.length > 0 && (
              <div className="mb-1">
                <span className="font-medium text-monokai-fg">Labels:</span>{" "}
                {defaultLabels.map((label, index) => (
                  <span
                    key={index}
                    className="inline-block bg-monokai-blue bg-opacity-20 text-monokai-blue text-xs px-2 py-1 rounded-full mr-1 border border-monokai-blue border-opacity-50"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
            {defaultPriority > 0 && (
              <div>
                <span className="font-medium text-monokai-fg">Priority:</span>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                    defaultPriority === 1
                      ? "text-monokai-yellow bg-monokai-yellow bg-opacity-20 border-monokai-yellow border-opacity-50"
                      : defaultPriority === 2
                        ? "text-monokai-orange bg-monokai-orange bg-opacity-20 border-monokai-orange border-opacity-50"
                        : "text-monokai-pink bg-monokai-pink bg-opacity-20 border-monokai-pink border-opacity-50"
                  }`}
                >
                  {defaultPriority === 1
                    ? "Low"
                    : defaultPriority === 2
                      ? "Medium"
                      : "High"}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              onCancel();
            }}
            className="px-4 py-2 text-monokai-pink bg-surface-secondary border-2 border-monokai-pink rounded-md hover:bg-surface-tertiary hover:border-monokai-pink disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-monokai-green text-monokai-green border-2 border-monokai-green rounded-md hover:bg-opacity-80 disabled:opacity-50 transition-colors"
            disabled={loading || (!title.trim() && !content.trim())}
          >
            {loading ? "Creating..." : "Create Note"}
          </button>
        </div>
      </form>
    </div>
  );
}
