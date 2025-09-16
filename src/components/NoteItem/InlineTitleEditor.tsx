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
      const trimmedValue = editValue.trim();
      if (trimmedValue !== value) {
        onSave(trimmedValue);
      } else {
        onCancel();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue !== value) {
      onSave(trimmedValue);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="text-base font-semibold text-orange-400 bg-transparent border-2 border-monokai-blue rounded px-2 py-1 focus:outline-none w-full"
      placeholder={placeholder}
      autoFocus
    />
  );
});
