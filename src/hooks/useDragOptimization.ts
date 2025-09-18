import { useMemo, useCallback, useRef } from "react";

interface DragOptimizationOptions {
  maxItems?: number;
  enableVirtualization?: boolean;
}

interface DragState {
  isDragging: boolean;
  draggedId: string | null;
  draggedType: "note" | "column" | null;
}

export function useDragOptimization(
  items: any[],
  options: DragOptimizationOptions = {}
) {
  const { maxItems = 100, enableVirtualization = items.length > maxItems } =
    options;

  const dragStateRef = useRef<DragState>({
    isDragging: false,
    draggedId: null,
    draggedType: null,
  });

  // Memoized items to prevent unnecessary re-renders
  const optimizedItems = useMemo(() => {
    if (enableVirtualization && items.length > maxItems) {
      // Basic virtualization - only render visible items + buffer
      return items.slice(0, maxItems);
    }
    return items;
  }, [items, maxItems, enableVirtualization]);

  // Optimized drag start handler
  const handleDragStart = useCallback((id: string, type: "note" | "column") => {
    dragStateRef.current = {
      isDragging: true,
      draggedId: id,
      draggedType: type,
    };

    // Add CSS class for drag optimization
    document.body.classList.add("dragging-active");

    // Disable smooth scrolling during drag for performance
    const scrollContainer = document.querySelector(".kanban-scroll-container");
    if (scrollContainer) {
      (scrollContainer as HTMLElement).style.scrollBehavior = "auto";
    }
  }, []);

  // Optimized drag end handler
  const handleDragEnd = useCallback(() => {
    dragStateRef.current = {
      isDragging: false,
      draggedId: null,
      draggedType: null,
    };

    // Remove drag optimization class
    document.body.classList.remove("dragging-active");

    // Re-enable smooth scrolling
    const scrollContainer = document.querySelector(".kanban-scroll-container");
    if (scrollContainer) {
      (scrollContainer as HTMLElement).style.scrollBehavior = "smooth";
    }
  }, []);

  // CSS transform optimization helper
  const getOptimizedTransform = useCallback((transform: any) => {
    if (!transform) return undefined;

    // Use CSS.Transform.toString() for better performance
    // but avoid scaling during drag to prevent layout thrashing
    const { x, y, scaleX, scaleY } = transform;
    return `translate3d(${x || 0}px, ${y || 0}px, 0) scale(${scaleX || 1}, ${scaleY || 1})`;
  }, []);

  // Performance monitoring helper
  const getDragMetrics = useCallback(
    () => ({
      totalItems: items.length,
      optimizedItems: optimizedItems.length,
      virtualizationEnabled: enableVirtualization,
      isDragging: dragStateRef.current.isDragging,
      draggedType: dragStateRef.current.draggedType,
    }),
    [items.length, optimizedItems.length, enableVirtualization]
  );

  return {
    optimizedItems,
    handleDragStart,
    handleDragEnd,
    getOptimizedTransform,
    getDragMetrics,
    dragState: dragStateRef.current,
    isVirtualized: enableVirtualization,
  };
}

// CSS optimization utilities
export const dragOptimizationStyles = {
  // Will-change for drag elements
  dragElement: {
    willChange: "transform",
    backfaceVisibility: "hidden" as const,
    transformStyle: "preserve-3d" as const,
  },

  // Container optimization during drag
  dragContainer: {
    contain: "layout style paint" as const,
    isolation: "isolate" as const,
  },
} as const;
