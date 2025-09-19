import React, { useState, useEffect, useRef } from "react";

interface InlineNoteEditorProps {
  title: string;
  content: string;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

export const InlineNoteEditor = React.memo(function InlineNoteEditor({
  title,
  content,
  onSave,
  onCancel,
}: InlineNoteEditorProps) {
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitle(title);
    setEditContent(content);
  }, [title, content]);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (
      (e.key === "Enter" && e.ctrlKey) ||
      (e.key === "Enter" && e.metaKey)
    ) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();

    // Only save if there's a change in either title or content
    if (trimmedTitle !== title || trimmedContent !== content) {
      onSave(trimmedTitle, trimmedContent);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-3 w-full" onKeyDown={handleKeyDown}>
      {/* Title Editor */}
      <div>
        <input
          ref={titleInputRef}
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          className="w-full text-base font-semibold text-orange-400 bg-transparent border-2 border-monokai-blue rounded px-2 py-1 focus:outline-none"
          placeholder="Untitled Note"
        />
      </div>

      {/* Content Editor */}
      <div>
        <textarea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          className="w-full bg-transparent border-2 border-monokai-blue rounded px-2 py-1 focus:outline-none resize-none text-sm leading-relaxed"
          placeholder="No content"
          rows={Math.max(3, Math.min(8, editContent.split("\n").length))}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-monokai-green text-monokai-bg border border-monokai-green rounded hover:bg-opacity-80 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm bg-monokai-pink text-monokai-bg border border-monokai-pink rounded hover:bg-opacity-80 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
});
