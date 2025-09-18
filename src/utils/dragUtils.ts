import type { Note, State } from "../types/note";

export interface DragData {
  item: Note | State;
  type: "note" | "column";
  sourceId?: string;
}

/**
 * Creates enhanced drag data for better drag preview and feedback
 */
export function createDragData(
  item: Note | State,
  type: "note" | "column",
  sourceId?: string
): DragData {
  return {
    item,
    type,
    sourceId,
  };
}

/**
 * Extracts drag data from a DnD kit active item
 */
export function extractDragData(activeData: any): DragData | null {
  if (!activeData?.current) return null;

  return {
    item: activeData.current.item,
    type: activeData.current.type,
    sourceId: activeData.current.sourceId,
  };
}

/**
 * Determines if a drop is valid based on drag and drop data
 */
export function isValidDrop(
  dragData: DragData | null,
  dropTargetId: string,
  dropTargetType: "note" | "column" | "container"
): boolean {
  if (!dragData) return false;

  // Note-specific rules
  if (dragData.type === "note") {
    // Notes can be dropped on columns or containers, but not on other notes
    return dropTargetType === "column" || dropTargetType === "container";
  }

  // Column-specific rules
  if (dragData.type === "column") {
    // Columns can only be dropped on other columns for reordering
    return dropTargetType === "column" && dropTargetId !== dragData.sourceId;
  }

  return false;
}

/**
 * Calculates drop zone feedback styles
 */
export function getDropZoneStyles(
  isValidTarget: boolean,
  isDraggedOver: boolean
): Record<string, string> {
  if (!isDraggedOver) return {};

  if (isValidTarget) {
    return {
      backgroundColor: "rgba(102, 217, 239, 0.1)",
      borderColor: "rgba(102, 217, 239, 0.5)",
      boxShadow: "0 0 0 2px rgba(102, 217, 239, 0.3)",
    };
  } else {
    return {
      backgroundColor: "rgba(249, 38, 114, 0.1)",
      borderColor: "rgba(249, 38, 114, 0.5)",
      boxShadow: "0 0 0 2px rgba(249, 38, 114, 0.3)",
    };
  }
}

/**
 * Generates drag preview styling based on item type
 */
export function getDragPreviewStyles(type: "note" | "column") {
  const baseStyles = {
    opacity: "0.9",
    transform: "rotate(2deg) scale(1.02)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    zIndex: "1000",
    cursor: "grabbing",
  };

  if (type === "note") {
    return {
      ...baseStyles,
      border: "2px solid #ae81ff",
      background: "linear-gradient(135deg, #2f2f2a 0%, #38382f 100%)",
    };
  }

  if (type === "column") {
    return {
      ...baseStyles,
      border: "2px solid #a6e22e",
      background: "#2f2f2a",
      minWidth: "20rem",
    };
  }

  return baseStyles;
}

/**
 * Animates an element when it's successfully dropped
 */
export function animateSuccessfulDrop(element: HTMLElement) {
  element.style.transition = "transform 0.2s ease-out";
  element.style.transform = "scale(1.05)";

  setTimeout(() => {
    element.style.transform = "scale(1)";
    setTimeout(() => {
      element.style.transition = "";
      element.style.transform = "";
    }, 200);
  }, 100);
}

/**
 * Handles drag feedback for accessibility
 */
export function announceDragAction(
  action: "start" | "move" | "drop" | "cancel",
  itemType: "note" | "column",
  itemName: string,
  targetName?: string
) {
  const messages = {
    start: `Started dragging ${itemType} "${itemName}"`,
    move: `Moving ${itemType} "${itemName}" ${targetName ? `to ${targetName}` : ""}`,
    drop: `Dropped ${itemType} "${itemName}" ${targetName ? `in ${targetName}` : ""}`,
    cancel: `Cancelled dragging ${itemType} "${itemName}"`,
  };

  // Create a live region for screen readers
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = messages[action];

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
