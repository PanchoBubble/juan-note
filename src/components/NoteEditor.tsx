import React, { useState, useEffect } from "react";
import type { Note, CreateNoteRequest, UpdateNoteRequest } from "../types/note";

interface NoteEditorProps {
  note?: Note | null;
  onSave: (request: CreateNoteRequest | UpdateNoteRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  quick?: boolean; // Simplified mode with fewer fields
}

export function NoteEditor({
  note,
  onSave,
  onCancel,
  loading,
  quick = false,
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState(0);
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setPriority(note.priority);
      setLabels(note.labels || []);
      setDone(note.done || false);
    } else {
      setTitle("");
      setContent("");
      setPriority(0);
      setLabels([]);
      setDone(false);
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() && !content.trim()) {
      return; // Don't save empty notes
    }

    const request = note?.id
      ? ({
          id: note.id,
          title: title.trim(),
          content: content.trim(),
          priority,
          labels,
          done,
        } as UpdateNoteRequest)
      : ({
          title: title.trim(),
          content: content.trim(),
          priority,
          labels,
          done,
        } as CreateNoteRequest);

    await onSave(request);
  };

  const addLabel = () => {
    const trimmedLabel = labelInput.trim();
    if (trimmedLabel && !labels.includes(trimmedLabel)) {
      setLabels([...labels, trimmedLabel]);
      setLabelInput("");
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLabel();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-6 ${quick ? "space-y-4" : "space-y-6"}`}
    >
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-monokai-fg mb-1"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="select-text w-full px-3 py-2 bg-surface-secondary border-2 border-monokai-comment border-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-monokai-blue text-monokai-fg placeholder-monokai-comment"
          placeholder="Enter note title..."
          disabled={loading}
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-monokai-fg mb-1"
        >
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={quick ? 4 : 8}
          className="select-text w-full px-3 py-2 bg-surface-secondary border-2 border-monokai-comment border-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-monokai-blue resize-vertical text-monokai-fg placeholder-monokai-comment"
          placeholder="Enter note content..."
          disabled={loading}
        />
      </div>

      {!quick && (
        <>
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-monokai-fg mb-1"
            >
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={e => setPriority(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface-secondary border-2 border-monokai-yellow border-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-monokai-yellow focus:border-monokai-yellow text-monokai-fg"
              disabled={loading}
            >
              <option value={0}>Normal</option>
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="done"
                checked={done}
                onChange={e => setDone(e.target.checked)}
                className="w-4 h-4 text-monokai-green bg-surface-secondary border-2 border-monokai-green border-opacity-50 rounded focus:ring-monokai-green focus:ring-2"
                disabled={loading}
              />
              <span className="text-sm font-medium text-monokai-fg">
                Mark as Done
              </span>
            </label>
          </div>

          <div>
            <label
              htmlFor="labels"
              className="block text-sm font-medium text-monokai-fg mb-1"
            >
              Labels
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                id="labels"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="select-text flex-1 px-3 py-2 bg-surface-secondary border-2 border-monokai-comment border-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-monokai-blue text-monokai-fg placeholder-monokai-comment"
                placeholder="Add a label..."
                disabled={loading}
              />
              <button
                type="button"
                onClick={addLabel}
                className="px-4 py-2 bg-monokai-green text-monokai-green border-2 border-monokai-green rounded-md hover:bg-opacity-80 disabled:opacity-50 transition-colors"
                disabled={loading || !labelInput.trim()}
              >
                Add
              </button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.map((label, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-monokai-blue bg-opacity-20 text-monokai-blue text-sm rounded-full border border-monokai-blue border-opacity-50"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="ml-1 text-monokai-blue hover:text-monokai-pink transition-colors"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
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
          {loading ? "Saving..." : note ? "Update Note" : "Create Note"}
        </button>
      </div>
    </form>
  );
}
