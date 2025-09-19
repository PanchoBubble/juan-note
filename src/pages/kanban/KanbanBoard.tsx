import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { ColumnSettingsModal } from "./ColumnSettingsModal";
import { useKanbanView } from "../../hooks/useKanbanView";
import { useStates } from "../../hooks/useStates";
import { useDragOptimization } from "../../hooks/useDragOptimization";
import { DragPreview } from "./DragPreview";
import {
  createDragData,
  extractDragData,
  announceDragAction,
} from "../../utils/dragUtils";
import { getColumnColorClass } from "../../utils/colorUtils";
import type {
  Note,
  State,
  CreateStateRequest,
  UpdateStateRequest,
} from "../../types/note";

interface KanbanBoardProps {
  notes: Note[];
  states: State[];
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onUpdate?: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  onStatesChange?: () => void; // Deprecated: Now using optimistic updates
  createState?: (request: CreateStateRequest) => Promise<State | null>;
  updateState?: (request: UpdateStateRequest) => Promise<State | null>;
  deleteState?: (id: number) => Promise<boolean>;
  reorderStates?: (stateId: number, newPosition: number) => Promise<void>;
  statesError?: string | null;
}

export function KanbanBoard({
  notes,
  states,
  onEdit,
  onComplete,
  onDelete,
  onUpdate,
  onLabelClick,
  onStatesChange: _onStatesChange, // Deprecated: using optimistic updates
  createState: propCreateState,
  updateState: propUpdateState,
  deleteState: propDeleteState,
  reorderStates: propReorderStates,
  statesError: propStatesError,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | undefined>();
  const [isColumnDragMode, setIsColumnDragMode] = useState(false);
  const [scrollFade, setScrollFade] = useState<
    "none" | "left" | "right" | "both"
  >("none");

  const {
    handleDragStart,
    handleDragEnd,
    getNotesByState,
    getNotesWithoutState,
  } = useKanbanView(notes, states);

  // Use props for state management functions, fallback to hook if not provided
  const {
    createState,
    updateState,
    deleteState,
    reorderStates,
    error: statesError,
  } = propCreateState && propUpdateState && propDeleteState && propReorderStates
    ? {
        createState: propCreateState,
        updateState: propUpdateState,
        deleteState: propDeleteState,
        reorderStates: propReorderStates,
        error: propStatesError,
      }
    : useStates();

  // Drag optimization for performance
  const {
    handleDragStart: optimizedDragStart,
    handleDragEnd: optimizedDragEnd,
  } = useDragOptimization(notes, {
    maxItems: 200,
    enableVirtualization: notes.length > 200,
  });

  // Handle scroll fade effects
  const updateScrollFade = (element: HTMLElement) => {
    const { scrollLeft, scrollWidth, clientWidth } = element;
    const canScrollLeft = scrollLeft > 0;
    const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1; // -1 for rounding errors

    if (canScrollLeft && canScrollRight) {
      setScrollFade("both");
    } else if (canScrollLeft) {
      setScrollFade("left");
    } else if (canScrollRight) {
      setScrollFade("right");
    } else {
      setScrollFade("none");
    }
  };

  // Data integrity check - find notes that reference non-existent states
  const orphanedNotes = notes.filter(
    note => note.state_id && !states.find(state => state.id === note.state_id)
  );

  // Log orphaned notes for debugging
  if (orphanedNotes.length > 0) {
    console.warn(
      `Found ${orphanedNotes.length} notes with invalid state references:`,
      orphanedNotes.map(note => ({
        id: note.id,
        title: note.title,
        invalidStateId: note.state_id,
      }))
    );
  }

  // Enhanced collision detection for both column and note operations
  const customCollisionDetection: CollisionDetection = args => {
    const { active, droppableContainers } = args;
    const activeId = active.id as string;

    // If dragging a column, only consider column drop targets
    if (activeId.startsWith("column-")) {
      const columnContainers = Array.from(droppableContainers.values()).filter(
        container => String(container.id).startsWith("column-")
      );

      if (columnContainers.length > 0) {
        // Create args with only column containers
        const columnArgs = {
          ...args,
          droppableContainers: columnContainers,
        };

        return rectIntersection(columnArgs);
      }
    }

    // For notes, use progressive collision detection
    if (!isNaN(parseInt(activeId))) {
      // First try sortable collisions (within-column reordering)
      const sortableCollisions = closestCorners(args);

      // Filter out column containers for sortable detection
      const noteContainers = Array.from(droppableContainers.values()).filter(
        container => !String(container.id).startsWith("column-")
      );

      if (sortableCollisions.length > 0 && noteContainers.length > 0) {
        // Check if the collision is with another note (within-column)
        const collision = sortableCollisions[0];
        const collisionId = String(collision.id);
        if (!isNaN(parseInt(collisionId))) {
          return sortableCollisions;
        }
      }

      // Fall back to droppable collisions (cross-column moves)
      // For empty columns, we need to consider all droppable containers
      const pointerCollisions = pointerWithin(args);

      // If no pointer collisions, try closest center for empty columns
      if (pointerCollisions.length === 0) {
        return closestCenter(args);
      }

      return pointerCollisions;
    }

    // Default fallback
    return closestCenter(args);
  };

  // Force apply scrollbar styles when component mounts
  useEffect(() => {
    const applyScrollbarStyles = () => {
      const scrollContainer = document.querySelector(
        ".kanban-scroll-container"
      );
      if (scrollContainer) {
        const element = scrollContainer as HTMLElement;

        // Update scroll fade on mount
        updateScrollFade(element);

        // Add scroll event listener
        const handleScroll = () => updateScrollFade(element);
        element.addEventListener("scroll", handleScroll);

        // Force apply the styles programmatically
        element.style.setProperty("scrollbar-width", "thin", "important");
        element.style.setProperty(
          "scrollbar-color",
          "#fd971f #272822",
          "important"
        );

        // Add custom CSS for webkit browsers
        const style = document.createElement("style");
        style.textContent = `
          .kanban-scroll-container::-webkit-scrollbar {
            height: 12px !important;
            background: transparent !important;
          }
          .kanban-scroll-container::-webkit-scrollbar-track {
            background: #272822 !important;
            border-radius: 6px !important;
          }
          .kanban-scroll-container::-webkit-scrollbar-thumb {
            background: #fd971f !important;
            border-radius: 6px !important;
            border: 2px solid #272822 !important;
          }
          .kanban-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #e6db74 !important;
          }
        `;

        // Only add the style if it doesn't already exist
        if (!document.querySelector("#kanban-scrollbar-styles")) {
          style.id = "kanban-scrollbar-styles";
          document.head.appendChild(style);
        }

        // Cleanup function
        return () => {
          element.removeEventListener("scroll", handleScroll);
        };
      }
    };

    // Apply styles immediately and after a short delay
    const cleanup = applyScrollbarStyles();
    const timer = setTimeout(() => {
      applyScrollbarStyles();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  // Handle column editing
  const handleEditColumn = (state: State) => {
    setEditingState(state);
    setIsSettingsModalOpen(true);
  };

  // Handle column updates with optimistic updates
  const handleUpdateColumn = async (request: UpdateStateRequest) => {
    // Optimistic updates are handled in useStates hook
    return await updateState(request);
  };

  // Handle column deletion with optimistic updates
  const handleDeleteColumn = async (stateId: number) => {
    // Optimistic updates are handled in useStates hook
    return await deleteState(stateId);
  };

  // Handle column duplication with optimistic updates
  const handleDuplicateColumn = async (state: State) => {
    const duplicateRequest: CreateStateRequest = {
      name: `${state.name} Copy`,
      position: states.length,
      color: state.color,
    };
    // Optimistic updates are handled in useStates hook
    await createState(duplicateRequest);
  };

  // Utility function to clean up orphaned notes
  const cleanupOrphanedNotes = async () => {
    if (orphanedNotes.length > 0 && onUpdate) {
      console.log(`Cleaning up ${orphanedNotes.length} orphaned notes...`);
      for (const note of orphanedNotes) {
        try {
          // Reset the state_id to undefined for orphaned notes
          onUpdate({ ...note, state_id: undefined });
        } catch (error) {
          console.error(`Failed to clean up note ${note.id}:`, error);
        }
      }
    }
  };

  const handleDragStartEvent = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const activeIdStr = event.active.id as string;

    // Check if dragging a column
    if (activeIdStr.startsWith("column-")) {
      const columnId = parseInt(activeIdStr.replace("column-", ""));
      const state = states.find(s => s.id === columnId);

      if (state && state.id != null) {
        const dragData = createDragData(state, "column", activeIdStr);
        setActiveDragData(dragData);
        setIsColumnDragMode(true);
        optimizedDragStart(activeIdStr, "column");
        announceDragAction("start", "column", state.name);
      } else {
        console.warn("Cannot drag column: state not found", {
          columnId,
          activeIdStr,
          availableStates: states.map(s => ({ id: s.id, name: s.name })),
        });
      }
      return;
    }

    // Handle note dragging
    const noteId = parseInt(activeIdStr);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const dragData = createDragData(note, "note", activeIdStr);
      setActiveDragData(dragData);
      optimizedDragStart(activeIdStr, "note");
      handleDragStart({
        ...note,
        stateId: note.state_id,
      });
      announceDragAction("start", "note", note.title || "Untitled Note");
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Debug logging for drag over events
    if (event.over) {
      console.log("Drag over:", {
        overId: event.over.id,
        activeId: event.active.id,
      });
    }
  };

  const handleDragEndEvent = (event: DragEndEvent) => {
    const dragData = extractDragData(activeDragData);
    setActiveId(null);
    setActiveDragData(null);
    setIsColumnDragMode(false);
    handleDragEnd();
    optimizedDragEnd();

    const { active, over } = event;
    if (!over) {
      if (dragData) {
        const itemName =
          dragData.type === "note"
            ? (dragData.item as any).title || "Untitled Note"
            : (dragData.item as any).name;
        announceDragAction("cancel", dragData.type, itemName);
      }
      return;
    }

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Debug logging for empty column drops
    console.log("Drag end event:", {
      activeId: activeIdStr,
      overId: overIdStr,
      overData: over.data?.current,
    });

    // Handle column reordering
    if (activeIdStr.startsWith("column-") && overIdStr.startsWith("column-")) {
      const activeColumnId = parseInt(activeIdStr.replace("column-", ""));
      const overColumnId = parseInt(overIdStr.replace("column-", ""));

      // Validate that both states exist
      const activeState = states.find(state => state.id === activeColumnId);
      const overState = states.find(state => state.id === overColumnId);

      if (!activeState || !overState) {
        console.warn("Cannot reorder columns: one or both states not found", {
          activeColumnId,
          overColumnId,
          activeState,
          overState,
        });
        return;
      }

      const oldIndex = states.findIndex(state => state.id === activeColumnId);
      const newIndex = states.findIndex(state => state.id === overColumnId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Use the reorderStates function with optimistic updates
        reorderStates(activeColumnId, newIndex).catch(error => {
          console.error("Error reordering states:", error);
        });
      }
      return;
    }

    // Handle note operations
    const noteId = parseInt(activeIdStr);
    if (!isNaN(noteId)) {
      const draggedNote = notes.find(note => note.id === noteId);
      if (!draggedNote) {
        console.warn("Cannot find dragged note", { noteId });
        return;
      }

      const overNoteId = parseInt(overIdStr);

      // Check if dropped on another note (within-column reordering)
      if (!isNaN(overNoteId) && overNoteId !== noteId) {
        const targetNote = notes.find(note => note.id === overNoteId);
        if (targetNote && targetNote.state_id === draggedNote.state_id) {
          // Within-column reordering - calculate new order based on target position
          const sameColumnNotes = notes
            .filter(
              note =>
                note.state_id === draggedNote.state_id && note.id !== noteId
            )
            .sort((a, b) => a.order - b.order);

          const targetIndex = sameColumnNotes.findIndex(
            note => note.id === overNoteId
          );

          if (targetIndex !== -1) {
            // Calculate new order - place before the target note using integer values
            let newOrder: number;

            if (targetIndex === 0) {
              // Dropping at the beginning - place before the first note
              // Since i32 supports negative numbers, we can always place before
              newOrder = targetNote.order - 10;
            } else {
              // Dropping between notes - use integer spacing
              const prevNote = sameColumnNotes[targetIndex - 1];
              const gap = targetNote.order - prevNote.order;

              if (gap > 1) {
                // There's space between the notes
                newOrder = prevNote.order + Math.floor(gap / 2);
              } else {
                // No space - need to reorganize orders
                // For now, place after the previous note
                newOrder = prevNote.order + 1;
              }
            }

            // Ensure the new order is an integer
            newOrder = Math.round(newOrder);

            if (draggedNote.order !== newOrder) {
              // Update note order within the same column
              const updateRequest = {
                ...draggedNote,
                order: newOrder,
              };
              onUpdate?.(updateRequest);
            }
          }
          return;
        }
      }

      // Handle cross-column moves
      let targetStateId: number;

      if (overIdStr.startsWith("column-")) {
        // Dropped on a column - extract state ID from column ID
        targetStateId = parseInt(overIdStr.replace("column-", ""));
      } else if (!isNaN(parseInt(overIdStr)) && isNaN(overNoteId)) {
        // Dropped directly on a column area (droppable ID is just the state ID)
        targetStateId = parseInt(overIdStr);
      } else if (!isNaN(overNoteId)) {
        // Dropped on a note in different column - use that note's state
        const targetNote = notes.find(note => note.id === overNoteId);
        if (targetNote && targetNote.state_id !== draggedNote.state_id) {
          targetStateId = targetNote.state_id || -1;

          // Position before the target note with integer order
          const newOrder = targetNote.order - 10;
          const updatedNote = {
            ...draggedNote,
            state_id: targetStateId === -1 ? undefined : targetStateId,
            order: newOrder,
          };
          onUpdate?.(updatedNote);
          return;
        } else {
          return; // Same column, already handled above
        }
      } else {
        // Fallback - couldn't determine target state
        console.warn("Could not determine target state for drop", {
          overIdStr,
          overNoteId,
        });
        return;
      }

      // Validate that the target state exists (unless it's -1 for unassigned)
      if (targetStateId !== -1) {
        const targetState = states.find(state => state.id === targetStateId);
        if (!targetState) {
          console.warn("Cannot drop note: target state not found", {
            noteId,
            targetStateId,
            overIdStr,
            availableStates: states.map(s => ({ id: s.id, name: s.name })),
          });
          return;
        }
      }

      // Only update if the state is changing
      if (draggedNote.state_id !== targetStateId) {
        // Cross-column move - place at end of target column
        const targetColumnNotes = notes.filter(
          note =>
            note.state_id === (targetStateId === -1 ? undefined : targetStateId)
        );
        const maxOrder =
          targetColumnNotes.length > 0
            ? Math.max(...targetColumnNotes.map(note => note.order))
            : 0;

        const updatedNote = {
          ...draggedNote,
          state_id: targetStateId === -1 ? undefined : targetStateId,
          order: maxOrder + 1,
        };
        onUpdate?.(updatedNote);
      }
    }
  };

  // Create columns from states with proper color handling and validation
  const columns: Array<{
    id: number;
    title: string;
    state?: State;
    colorClass: string;
    borderColor?: string;
    notes: any[];
  }> = states
    .filter(state => state.id != null) // Filter out states without valid IDs
    .sort((a, b) => a.position - b.position) // Ensure columns are sorted by position
    .map(state => ({
      id: state.id!,
      title: state.name,
      state: state,
      colorClass: getColumnColorClass(state.color),
      borderColor:
        state.color && !state.color.startsWith("--") ? state.color : undefined,
      notes: getNotesByState(state.id!),
    }));

  // Add a column for notes without states
  const unassignedNotes = getNotesWithoutState();
  if (unassignedNotes.length > 0) {
    columns.unshift({
      id: -1,
      title: "Unassigned",
      state: undefined,
      colorClass: "bg-[#2f2f2a] border-[#75715e]/30 border-2",
      borderColor: undefined,
      notes: unassignedNotes,
    });
  }

  const columnIds = columns.map(col => `column-${col.id}`);

  // Update scroll fade when columns change
  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".kanban-scroll-container"
    ) as HTMLElement;
    if (scrollContainer) {
      // Small delay to ensure DOM is updated
      setTimeout(() => updateScrollFade(scrollContainer), 50);
    }
  }, [columns]);

  return (
    <>
      <DndContext
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStartEvent}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEndEvent}
      >
        <div className="flex flex-col w-full">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className={`kanban-scroll-container pt-0 scrollbar-monokai flex gap-6 overflow-x-auto w-full max-w-full px-6 sm:px-8 sm:py-6 ${
                scrollFade === "left"
                  ? "kanban-scroll-fade-left"
                  : scrollFade === "right"
                    ? "kanban-scroll-fade-right"
                    : scrollFade === "both"
                      ? "kanban-scroll-fade-both"
                      : ""
              }`}
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#fd971f #272822",
                maxWidth: "100vw", // Prevent horizontal overflow
              }}
            >
              {columns.map(column => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  notes={column.notes}
                  colorClass={column.colorClass}
                  borderColor={column.borderColor}
                  state={column.state}
                  onEdit={onEdit}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onLabelClick={onLabelClick}
                  isDragOver={activeId !== null && !isColumnDragMode}
                  isColumnDraggable={!!column.state} // Only allow dragging for actual states
                  onColumnEdit={column.state ? handleEditColumn : undefined}
                  onColumnDelete={column.state ? handleDeleteColumn : undefined}
                  onColumnDuplicate={
                    column.state ? handleDuplicateColumn : undefined
                  }
                  isUnassigned={column.id === -1}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* Enhanced Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeDragData && (
            <DragPreview
              item={activeDragData.item}
              type={activeDragData.type}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Column Settings Modal */}
      <ColumnSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setEditingState(undefined);
        }}
        onSave={handleUpdateColumn}
        state={editingState}
      />

      {/* Error Display */}
      {statesError && (
        <div className="fixed bottom-4 right-4 bg-monokai-red/10 border border-[#f92672]/30 rounded-lg p-3 max-w-md">
          <p className="text-monokai-red text-sm">{statesError}</p>
        </div>
      )}

      {/* Orphaned Notes Warning */}
      {orphanedNotes.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-monokai-orange/10 border border-[#fd971f]/30 rounded-lg p-3 max-w-md">
          <p className="text-monokai-orange text-sm mb-2">
            Found {orphanedNotes.length} notes with invalid column references.
          </p>
          <button
            onClick={cleanupOrphanedNotes}
            className="text-xs bg-monokai-orange text-white px-2 py-1 rounded hover:bg-opacity-80 transition-colors"
          >
            Move to Unassigned
          </button>
        </div>
      )}
    </>
  );
}
