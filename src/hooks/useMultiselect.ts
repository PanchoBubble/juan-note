import { useState, useCallback, useMemo } from 'react';
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
}

export function useMultiselect(): UseMultiselectReturn {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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
  };
}