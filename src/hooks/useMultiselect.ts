import { useState, useCallback } from 'react';
import type { Note } from '../types/note';

export interface UseMultiselectReturn {
  selectedIds: Set<number>;
  selectedCount: number;
  isSelected: (id: number) => boolean;
  isAllSelected: (notes: Note[]) => boolean;
  isNoneSelected: boolean;
  toggleSelection: (id: number) => void;
  selectAll: (notes: Note[]) => void;
  clearAll: () => void;
  toggleAll: (notes: Note[]) => void;
  getSelectedNotes: (notes: Note[]) => Note[];
  handleItemClick: (id: number, index: number, event: React.MouseEvent) => void;
  lastSelectedIndex: number | null;
}

export function useMultiselect(): UseMultiselectReturn {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const selectedCount = selectedIds.size;
  const isNoneSelected = selectedCount === 0;

  const isSelected = useCallback((id: number) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const isAllSelected = useCallback((notes: Note[]) => {
    if (notes.length === 0) return false;
    return notes.every(note => note.id && selectedIds.has(note.id));
  }, [selectedIds]);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((notes: Note[]) => {
    const allIds = new Set(notes.map(note => note.id).filter(Boolean) as number[]);
    setSelectedIds(allIds);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, []);

  const toggleAll = useCallback((notes: Note[]) => {
    if (isAllSelected(notes)) {
      clearAll();
    } else {
      selectAll(notes);
    }
  }, [isAllSelected, selectAll, clearAll]);

  const getSelectedNotes = useCallback((notes: Note[]) => {
    return notes.filter(note => note.id && selectedIds.has(note.id));
  }, [selectedIds]);

  const handleItemClick = useCallback((id: number, index: number, event: React.MouseEvent) => {
    const isShiftClick = event.shiftKey;
    const isCmdClick = event.metaKey || event.ctrlKey;

    setSelectedIds(prev => {
      const newSelection = new Set(prev);

      if (isShiftClick && lastSelectedIndex !== null) {
        // Range selection: select all items between last selected and current
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);

        // Clear previous selection and add range
        newSelection.clear();
        for (let i = start; i <= end; i++) {
          // Note: We'll need to map index back to item ID in the calling component
          // For now, we'll handle this in the NoteList component
        }
      } else if (isCmdClick) {
        // Toggle selection: add if not selected, remove if selected
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
      } else {
        // Single selection: clear all and select only this item
        newSelection.clear();
        newSelection.add(id);
      }

      return newSelection;
    });

    setLastSelectedIndex(index);
  }, [lastSelectedIndex]);

  return {
    selectedIds,
    selectedCount,
    isSelected,
    isAllSelected,
    isNoneSelected,
    toggleSelection,
    selectAll,
    clearAll,
    toggleAll,
    getSelectedNotes,
    handleItemClick,
    lastSelectedIndex,
  };
}