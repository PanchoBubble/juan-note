import React, { useState, useEffect } from 'react';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types/note';

interface NoteEditorProps {
  note?: Note | null;
  onSave: (request: CreateNoteRequest | UpdateNoteRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function NoteEditor({ note, onSave, onCancel, loading }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState(0);
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setPriority(note.priority);
      setLabels(note.labels || []);
    } else {
      setTitle('');
      setContent('');
      setPriority(0);
      setLabels([]);
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() && !content.trim()) {
      return; // Don't save empty notes
    }

    const request = note?.id
      ? {
          id: note.id,
          title: title.trim(),
          content: content.trim(),
          priority,
          labels,
        } as UpdateNoteRequest
      : {
          title: title.trim(),
          content: content.trim(),
          priority,
          labels,
        } as CreateNoteRequest;

    await onSave(request);
  };

  const addLabel = () => {
    const trimmedLabel = labelInput.trim();
    if (trimmedLabel && !labels.includes(trimmedLabel)) {
      setLabels([...labels, trimmedLabel]);
      setLabelInput('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLabel();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">
        {note ? 'Edit Note' : 'Create New Note'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter note title..."
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            placeholder="Enter note content..."
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value={0}>Normal</option>
            <option value={1}>Low</option>
            <option value={2}>Medium</option>
            <option value={3}>High</option>
          </select>
        </div>

        <div>
          <label htmlFor="labels" className="block text-sm font-medium text-gray-700 mb-1">
            Labels
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              id="labels"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a label..."
              disabled={loading}
            />
            <button
              type="button"
              onClick={addLabel}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || (!title.trim() && !content.trim())}
          >
            {loading ? 'Saving...' : (note ? 'Update Note' : 'Create Note')}
          </button>
        </div>
      </form>
    </div>
  );
}