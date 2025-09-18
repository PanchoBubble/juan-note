import React, { useMemo, useCallback } from "react";
import { NoteItem } from "./NoteItem/";
import { LabelFilter } from "../../components/LabelFilter";
import { PriorityFilter } from "../../components/PriorityFilter";
import { SortControls } from "./SortControls";
import { InlineCreate } from "../../components/InlineCreate";

import { useMultiselect } from "../../hooks/useMultiselect";
import type { Note, CreateNoteRequest } from "../../types/note";
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface NoteListProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onUpdate?: (note: Note) => void;
  loading: boolean;
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  selectedPriority: number | null;
  onPriorityChange: (priority: number | null) => void;
  sortBy: "created" | "updated" | "priority" | "title" | "custom";
  onSortChange: (
    sort: "created" | "updated" | "priority" | "title" | "custom"
  ) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
  showInlineCreate?: boolean;
  onCancelInlineCreate?: () => void;
  onSaveNote?: (request: CreateNoteRequest) => Promise<void>;
  setSelectionState?: React.Dispatch<
    React.SetStateAction<{
      count: number;
      total: number;
      selectedIds?: Set<number>;
    }>
  >;
  onReorderNotes?: (notes: Note[]) => void;
}

export const NoteList = React.memo(function NoteList({
  notes,
  onEdit,
  onComplete,
  onDelete,
  onUpdate,
  loading,
  selectedLabels,
  onLabelsChange,
  selectedPriority,
  onPriorityChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  showInlineCreate = false,
  onCancelInlineCreate,
  onSaveNote,
  setSelectionState,
  onReorderNotes,
}: NoteListProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const { isSelected, clearAll, toggleAll, handleItemClick } = useMultiselect(
    undefined, // Remove onSelectionChange callback
    () => filteredAndSortedNotes.length + doneNotes.length,
    setSelectionState // Pass the state setter directly
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150, // Allow time for double-click detection
        distance: 3,
      },
      // Don't activate drag if cmd/ctrl is pressed
      shouldActivate: ({ event }: { event: Event }) => {
        const e = event as PointerEvent;
        return !(e.metaKey || e.ctrlKey);
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get all available labels from notes
  const availableLabels = useMemo(() => {
    const labelSet = new Set<string>();
    notes.forEach(note => {
      note.labels?.forEach(label => labelSet.add(label));
    });
    return Array.from(labelSet).sort();
  }, [notes]);

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes;

    // Apply label filter
    if (selectedLabels.length > 0) {
      filtered = filtered.filter(note =>
        selectedLabels.every(label => note.labels?.includes(label))
      );
    }

    // Apply priority filter
    if (selectedPriority !== null) {
      filtered = filtered.filter(note => note.priority === selectedPriority);
    }

    // Exclude done notes by default
    filtered = filtered.filter(note => !note.done);

    // Sort notes
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "created":
          comparison =
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime();
          break;
        case "updated":
          comparison =
            new Date(b.updated_at || 0).getTime() -
            new Date(a.updated_at || 0).getTime();
          break;
        case "priority":
          comparison = b.priority - a.priority;
          break;
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "custom":
          comparison = (a.order || 0) - (b.order || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

    return sorted;
  }, [notes, selectedLabels, selectedPriority, sortBy, sortOrder]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        // Find the indices of the dragged and target items in the filtered notes
        const oldIndex = filteredAndSortedNotes.findIndex(
          note => note.id?.toString() === active.id
        );
        const newIndex = filteredAndSortedNotes.findIndex(
          note => note.id?.toString() === over.id
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          // For non-custom sort modes, switch to custom sort mode first
          if (sortBy !== "custom" && onSortChange) {
            onSortChange("custom");
          }

          // Create the reordered notes array
          const reorderedFilteredNotes = arrayMove(
            filteredAndSortedNotes,
            oldIndex,
            newIndex
          );

          // Create a map of note IDs to their new order values
          const orderMap = new Map<string, number>();
          reorderedFilteredNotes.forEach((note, index) => {
            if (note.id) {
              orderMap.set(note.id.toString(), index);
            }
          });

          // Update order values for ALL notes based on the new positions
          let nextOrder = reorderedFilteredNotes.length;
          const updatedAllNotes = notes.map(note => {
            if (note.id && orderMap.has(note.id.toString())) {
              return {
                ...note,
                order: orderMap.get(note.id.toString())!,
              };
            } else {
              // Non-visible note, assign order after visible notes
              return {
                ...note,
                order: nextOrder++,
              };
            }
          });

          // Call the reorder function with all notes
          if (onReorderNotes) {
            onReorderNotes(updatedAllNotes);
          }
        }
      }
    },
    [filteredAndSortedNotes, notes, sortBy, onSortChange, onReorderNotes]
  );

  // Get done/archived notes
  const doneNotes = useMemo(() => {
    return notes.filter(note => note.done);
  }, [notes]);

  // Handle global keyboard shortcuts
  React.useEffect(() => {
    const handleSelectAll = () => {
      toggleAll(filteredAndSortedNotes);
    };

    const handleClearSelection = () => {
      clearAll();
    };

    document.addEventListener("selectAllNotes", handleSelectAll);
    document.addEventListener("clearNoteSelection", handleClearSelection);

    return () => {
      document.removeEventListener("selectAllNotes", handleSelectAll);
      document.removeEventListener("clearNoteSelection", handleClearSelection);
    };
  }, [toggleAll, clearAll, filteredAndSortedNotes]);

  if (loading && notes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-monokai-blue mb-4"></div>
        <span className="text-monokai-comment font-medium">
          Loading your notes...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Sort Controls */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <LabelFilter
            availableLabels={availableLabels}
            selectedLabels={selectedLabels}
            onLabelsChange={onLabelsChange}
          />

          <PriorityFilter
            selectedPriority={selectedPriority}
            onPriorityChange={onPriorityChange}
          />

          <SortControls
            sortBy={sortBy}
            onSortChange={onSortChange}
            sortOrder={sortOrder}
            onSortOrderChange={onSortOrderChange}
          />

          {(selectedLabels.length > 0 || selectedPriority !== null) && (
            <button
              onClick={() => {
                onLabelsChange([]);
                onPriorityChange(null);
              }}
              className="px-2 py-1 text-sm text-monokai-pink bg-surface-secondary border-2 border-monokai-pink rounded-md hover:bg-monokai-pink hover:bg-opacity-20 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      {filteredAndSortedNotes.length === 0 && !showInlineCreate ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-surface-secondary bg-opacity-80 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-monokai-yellow">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-2xl font-bold text-monokai-fg mb-3">
            No notes match your filters
          </h3>
          <p className="text-monokai-comment max-w-sm mx-auto mb-4">
            Try adjusting your filters or create a new note that matches your
            criteria.
          </p>
          <button
            onClick={() => {
              onLabelsChange([]);
              onPriorityChange(null);
            }}
            className="px-4 py-2 bg-monokai-green text-monokai-green border-2 border-monokai-green rounded-lg hover:bg-opacity-80 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {showInlineCreate && onSaveNote && (
            <InlineCreate
              onSave={onSaveNote}
              onCancel={onCancelInlineCreate || (() => {})}
              loading={loading}
              defaultLabels={selectedLabels}
              defaultPriority={selectedPriority || 0}
            />
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredAndSortedNotes.map(
                note => note.id?.toString() || ""
              )}
              strategy={verticalListSortingStrategy}
            >
              {filteredAndSortedNotes.map((note, index) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onEdit={onEdit}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onLabelClick={label => {
                    if (!selectedLabels.includes(label)) {
                      onLabelsChange([...selectedLabels, label]);
                    }
                  }}
                  isSelected={note.id ? isSelected(note.id) : false}
                  onItemClick={(id, index, event) =>
                    handleItemClick(id, index, event, filteredAndSortedNotes)
                  }
                  showSelection={true}
                  itemIndex={index}
                  isDraggable={true}
                />
              ))}
            </SortableContext>
          </DndContext>
          <DragOverlay>
            {activeId ? (
              <NoteItem
                note={
                  filteredAndSortedNotes.find(
                    note => note.id?.toString() === activeId
                  )!
                }
                onEdit={() => {}}
                onComplete={() => {}}
                onDelete={() => {}}
                showSelection={false}
                isDraggable={false}
                isDragOverlay={true}
              />
            ) : null}
          </DragOverlay>
        </div>
      )}

      {/* Done/Archived Notes Section */}
      {(() => {
        if (doneNotes.length === 0) return null;

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-monokai-fg">
                Archived Notes
              </h3>
              <span className="text-sm text-monokai-comment bg-surface-tertiary px-2 py-1 rounded">
                {doneNotes.length} note{doneNotes.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {doneNotes
                .sort(
                  (a, b) =>
                    new Date(b.updated_at || 0).getTime() -
                    new Date(a.updated_at || 0).getTime()
                )
                .map((note, index) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onEdit={onEdit}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onLabelClick={label => {
                      if (!selectedLabels.includes(label)) {
                        onLabelsChange([...selectedLabels, label]);
                      }
                    }}
                    isSelected={note.id ? isSelected(note.id) : false}
                    onItemClick={(id, index, event) =>
                      handleItemClick(id, index, event, doneNotes)
                    }
                    showSelection={true}
                    itemIndex={filteredAndSortedNotes.length + index}
                  />
                ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
});
