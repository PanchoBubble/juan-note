import { NoteItem } from "./NoteItem/";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnManagementMenu } from "./ColumnManagementMenu";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import type { KanbanNote } from "../hooks/useKanbanView";
import type { Note, State } from "../types/note";

interface KanbanColumnProps {
  id: number;
  title: string;
  notes: KanbanNote[];
  colorClass: string;
  state?: State;
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onUpdate?: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  isDragOver: boolean;
  isColumnDraggable?: boolean;
  onColumnEdit?: (state: State) => void;
  onColumnDelete?: (stateId: number) => void;
  onColumnDuplicate?: (state: State) => void;
}

export function KanbanColumn({
  id,
  title,
  notes,
  colorClass,
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
      style={style}
      {...(isColumnDraggable ? attributes : {})}
      className={`flex-1 min-w-80 max-w-96 ${colorClass} rounded-lg p-4 transition-all duration-200 ${
        isDragOver ? "ring-2 ring-monokai-blue ring-opacity-50 scale-105" : ""
      } ${isDragging ? "opacity-50 z-50" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="flex items-center space-x-2 flex-1"
          {...(isColumnDraggable ? listeners : {})}
        >
          {isColumnDraggable && (
            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-surface-secondary hover:bg-opacity-30 rounded transition-colors">
              <svg
                className="w-4 h-4 text-monokai-comment"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </div>
          )}
          <h3 className="text-lg font-semibold text-monokai-fg flex items-center space-x-2">
            <span>{title}</span>
            <span className="bg-surface-secondary bg-opacity-80 text-monokai-comment px-2 py-1 rounded-full text-sm font-normal border border-monokai-comment border-opacity-30">
              {notes.length}
            </span>
          </h3>
        </div>

        {state && (onColumnEdit || onColumnDelete || onColumnDuplicate) && (
          <ColumnManagementMenu
            state={state}
            onEdit={onColumnEdit!}
            onDelete={onColumnDelete!}
            onDuplicate={onColumnDuplicate}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-3 min-h-32">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-monokai-comment w-full">
            <div className="w-12 h-12 bg-surface-secondary bg-opacity-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-monokai-comment border-opacity-30">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-sm">No {title.toLowerCase()} notes</p>
            <p className="text-xs text-monokai-comment mt-1">
              Drop notes here to assign them to {title.toLowerCase()}
            </p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="cursor-move">
              <NoteItem
                note={note}
                onEdit={onEdit}
                onComplete={onComplete}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onLabelClick={onLabelClick}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
