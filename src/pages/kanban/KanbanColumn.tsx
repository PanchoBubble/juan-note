import { memo } from "react";
import { KanbanDraggableNoteItem } from "./KanbanDraggableNoteItem";
import { useDroppable } from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnManagementMenu } from "./ColumnManagementMenu";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import type { KanbanNote } from "../../hooks/useKanbanView";
import type { Note, State } from "../../types/note";

interface KanbanColumnProps {
  id: number;
  title: string;
  notes: KanbanNote[];
  colorClass: string;
  borderColor?: string;
  state?: State;
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onUpdate?: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  isDragOver: boolean;
  isColumnDraggable?: boolean;
  onColumnEdit?: (state: State) => void;
  onColumnDelete?: (stateId: number) => Promise<boolean>;
  onColumnDuplicate?: (state: State) => void;
  isUnassigned?: boolean;
}

export const KanbanColumn = memo(function KanbanColumn({
  id,
  title,
  notes,
  colorClass,
  borderColor,
  state,
  onEdit,
  onComplete,
  onDelete,
  onUpdate,
  onLabelClick,
  isDragOver,
  isColumnDraggable = false,
  onColumnEdit,
  onColumnDelete,
  onColumnDuplicate,
  isUnassigned = false,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id.toString(),
  });

  // Column drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${id}`,
    disabled: !isColumnDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Keyboard navigation for column management
  useKeyboardNavigation({
    onCtrlE: () => state && onColumnEdit?.(state),
    onDelete: () => state?.id && onColumnDelete?.(state.id),
    enabled: !!state,
  });

  // Combine refs for both droppable and sortable functionality
  const combineRefs = (element: HTMLDivElement | null) => {
    setNodeRef(element);
    if (isColumnDraggable) {
      setSortableRef(element);
    }
  };

  return (
    <div
      ref={combineRefs}
      style={{
        ...style,
        ...(borderColor ? { borderColor } : {}),
      }}
      {...(isColumnDraggable ? { ...attributes, ...listeners } : {})}
      className={`flex-none w-80 ${colorClass} rounded-lg p-4 transition-all duration-200 ${
        isDragOver ? "ring-2 ring-[#66d9ef]/50" : ""
      } ${isDragging ? "opacity-50 z-50" : ""} ${
        isColumnDraggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 flex-1">
          <h3 className="text-lg font-semibold text-monokai-fg flex items-center space-x-2">
            <span>{title}</span>
            <span className="bg-[#2f2f2a]/80 text-monokai-comment px-2 py-1 rounded-full text-sm font-normal border border-[#75715e]/30">
              {notes.length}
            </span>
          </h3>
        </div>

        {state && (onColumnEdit || onColumnDelete || onColumnDuplicate) && (
          <div
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <ColumnManagementMenu
              state={state}
              onEdit={onColumnEdit!}
              onDelete={onColumnDelete!}
              onDuplicate={onColumnDuplicate}
            />
          </div>
        )}
      </div>

      <div
        className={`flex flex-wrap gap-3 min-h-32 max-w-full overflow-hidden ${isUnassigned ? "max-h-96 overflow-y-auto" : ""}`}
        style={{
          pointerEvents: isColumnDraggable && isDragging ? "none" : "auto",
        }}
      >
        {notes.length === 0 ? (
          <div className="text-center py-8 text-monokai-comment w-full min-h-[200px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-[#2f2f2a]/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#75715e]/30">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-sm">No {title.toLowerCase()} notes</p>
            <p className="text-xs text-monokai-comment mt-1">
              Drop notes here to assign them to {title.toLowerCase()}
            </p>
          </div>
        ) : (
          <SortableContext
            items={notes.map(note => note.id?.toString() || "")}
            strategy={verticalListSortingStrategy}
          >
            {notes.map(note => (
              <div
                key={note.id}
                className="w-full"
                style={{
                  pointerEvents:
                    isColumnDraggable && isDragging ? "none" : "auto",
                }}
              >
                <KanbanDraggableNoteItem
                  note={note}
                  onEdit={onEdit}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onLabelClick={onLabelClick}
                />
              </div>
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
});
