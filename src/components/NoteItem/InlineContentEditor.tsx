import React, { useState, useEffect, useRef } from "react";

interface InlineContentEditorProps {
  value: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export const InlineContentEditor = React.memo(function InlineContentEditor({
  value,
  onSave,
  onCancel,
  placeholder = "No content",
}: InlineContentEditorProps) {
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue !== value) {
      onSave(trimmedValue);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-2 w-full">
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-transparent border-2 border-monokai-blue rounded px-2 py-1 focus:outline-none resize-none w-full text-sm leading-relaxed"
        placeholder={placeholder}
        rows={Math.max(3, Math.min(8, editValue.split("\n").length))}
        autoFocus
      />
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
