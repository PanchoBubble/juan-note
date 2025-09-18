import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { AddColumnButton } from "./AddColumnButton";
import { CreateColumnModal } from "./CreateColumnModal";
import { ColumnSettingsModal } from "./ColumnSettingsModal";
import { useKanbanView } from "../hooks/useKanbanView";
import { useStates } from "../hooks/useStates";
import { useDragOptimization } from "../hooks/useDragOptimization";
import { getColumnColorClass } from "../utils/colorUtils";
import type {
  Note,
  State,
  CreateStateRequest,
  UpdateStateRequest,
} from "../types/note";

interface KanbanBoardProps {
  notes: Note[];
  states: State[];
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onUpdate?: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  onStatesChange?: () => void; // Callback to refresh states after changes
}

export function KanbanBoard({
  notes,
  states,
  onEdit,
  onComplete,
  onDelete,
  onUpdate,
  onLabelClick,
  onStatesChange,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | undefined>();
  const [isColumnDragMode, setIsColumnDragMode] = useState(false);

  const {
    handleDrop,
    handleDragStart,
    handleDragEnd,
    getNotesByState,
    getNotesWithoutState,
  } = useKanbanView(notes, states);

  const {
    createState,
    updateState,
    deleteState,
    reorderStates,
    error: statesError,
  } = useStates();

  // Drag optimization for performance
  const {
    handleDragStart: optimizedDragStart,
    handleDragEnd: optimizedDragEnd,
  } = useDragOptimization(notes, {
    maxItems: 200,
    enableVirtualization: notes.length > 200,
  });

  // Handle column creation
  const handleCreateColumn = async (request: CreateStateRequest) => {
    const result = await createState(request);
    if (result && onStatesChange) {
      onStatesChange();
    }
    return result;
  };

  // Handle column editing
  const handleEditColumn = (state: State) => {
    setEditingState(state);
    setIsSettingsModalOpen(true);
  };

  // Handle column updates
  const handleUpdateColumn = async (request: UpdateStateRequest) => {
    const result = await updateState(request);
    if (result && onStatesChange) {
      onStatesChange();
    }
    return result;
  };

  // Handle column deletion
  const handleDeleteColumn = async (stateId: number) => {
    const success = await deleteState(stateId);
    if (success && onStatesChange) {
      onStatesChange();
    }
    return success;
  };

  // Handle column duplication
  const handleDuplicateColumn = async (state: State) => {
    const duplicateRequest: CreateStateRequest = {
      name: `${state.name} Copy`,
      position: states.length,
      color: state.color,
    };
    const result = await createState(duplicateRequest);
    if (result && onStatesChange) {
      onStatesChange();
    }
  };

  const handleDragStartEvent = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const activeIdStr = event.active.id as string;

    // Check if dragging a column
    if (activeIdStr.startsWith("column-")) {
      setIsColumnDragMode(true);
      optimizedDragStart(activeIdStr, "column");
      return;
    }

    // Handle note dragging
    const noteId = parseInt(activeIdStr);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      optimizedDragStart(activeIdStr, "note");
      handleDragStart({
        ...note,
        stateId: note.state_id,
      });
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEndEvent = (event: DragEndEvent) => {
    setActiveId(null);
    setIsColumnDragMode(false);
    handleDragEnd();
    optimizedDragEnd();

    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Handle column reordering
    if (activeIdStr.startsWith("column-") && overIdStr.startsWith("column-")) {
      const activeColumnId = parseInt(activeIdStr.replace("column-", ""));
      const overColumnId = parseInt(overIdStr.replace("column-", ""));

      const oldIndex = states.findIndex(state => state.id === activeColumnId);
      const newIndex = states.findIndex(state => state.id === overColumnId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Use the reorderStates function from the hook
        reorderStates(activeColumnId, newIndex).then(() => {
          if (onStatesChange) onStatesChange();
        });
      }
      return;
    }

    // Handle note dragging
    const noteId = parseInt(activeIdStr);
    const targetStateId = parseInt(overIdStr);

    if (!isNaN(noteId) && !isNaN(targetStateId)) {
      handleDrop(targetStateId);
    }
  };

  // Create columns from states with proper color handling
  const columns: Array<{
    id: number;
    title: string;
    state?: State;
    colorClass: string;
    notes: any[];
  }> = states.map(state => ({
    id: state.id!,
    title: state.name,
    state: state,
    colorClass: getColumnColorClass(state.color),
    notes: getNotesByState(state.id!),
  }));

  // Add a column for notes without states
  const unassignedNotes = getNotesWithoutState();
  if (unassignedNotes.length > 0) {
    columns.unshift({
      id: -1,
      title: "Unassigned",
      state: undefined,
      colorClass: "bg-[#2f2f2a] border-[#75715e]/20",
      notes: unassignedNotes,
    });
  }

  const columnIds = columns.map(col => `column-${col.id}`);

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStartEvent}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEndEvent}
      >
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          <div className="kanban-scroll-container flex gap-6 overflow-x-auto w-full px-4 sm:px-6 lg:px-8">
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                notes={column.notes}
                colorClass={column.colorClass}
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
              />
            ))}
            <AddColumnButton
              onClick={() => setIsCreateModalOpen(true)}
              disabled={false}
            />
          </div>
        </SortableContext>
      </DndContext>

      {/* Create Column Modal */}
      <CreateColumnModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateColumn}
        existingStates={states}
      />

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
    </>
  );
}
