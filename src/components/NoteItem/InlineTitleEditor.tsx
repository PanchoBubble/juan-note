import React, { useState, useEffect, useRef } from "react";

interface InlineTitleEditorProps {
  value: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export const InlineTitleEditor = React.memo(function InlineTitleEditor({
  value,
  onSave,
  onCancel,
  placeholder = "Untitled Note",
}: InlineTitleEditorProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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
    <div className="flex items-center gap-2 w-full">
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 text-base font-semibold text-orange-400 bg-transparent border-2 border-monokai-blue rounded px-2 py-1 focus:outline-none"
        placeholder={placeholder}
        autoFocus
      />
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
  );
});
