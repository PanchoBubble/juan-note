import { useCallback, useEffect, useRef } from "react";

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onDelete?: () => void;
  onCtrlN?: () => void; // New column
  onCtrlE?: () => void; // Edit
  onCtrlD?: () => void; // Delete/Duplicate
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onEscape,
  onEnter,
  onSpace,
  onArrowLeft,
  onArrowRight,
  onArrowUp,
  onArrowDown,
  onDelete,
  onCtrlN,
  onCtrlE,
  onCtrlD,
  enabled = true,
}: KeyboardNavigationOptions) {
  const handlerRef = useRef<KeyboardNavigationOptions>({});

  // Update handler ref to avoid stale closures
  useEffect(() => {
    handlerRef.current = {
      onEscape,
      onEnter,
      onSpace,
      onArrowLeft,
      onArrowRight,
      onArrowUp,
      onArrowDown,
      onDelete,
      onCtrlN,
      onCtrlE,
      onCtrlD,
    };
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const handlers = handlerRef.current;
      const { key, ctrlKey, metaKey, target } = event;

      // Don't interfere with input elements
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle modifier + key combinations
      if (ctrlKey || metaKey) {
        switch (key.toLowerCase()) {
          case "n":
            if (handlers.onCtrlN) {
              event.preventDefault();
              handlers.onCtrlN();
            }
            break;
          case "e":
            if (handlers.onCtrlE) {
              event.preventDefault();
              handlers.onCtrlE();
            }
            break;
          case "d":
            if (handlers.onCtrlD) {
              event.preventDefault();
              handlers.onCtrlD();
            }
            break;
        }
        return;
      }

      // Handle single key presses
      switch (key) {
        case "Escape":
          if (handlers.onEscape) {
            event.preventDefault();
            handlers.onEscape();
          }
          break;
        case "Enter":
          if (handlers.onEnter) {
            event.preventDefault();
            handlers.onEnter();
          }
          break;
        case " ":
          if (handlers.onSpace) {
            event.preventDefault();
            handlers.onSpace();
          }
          break;
        case "ArrowLeft":
          if (handlers.onArrowLeft) {
            event.preventDefault();
            handlers.onArrowLeft();
          }
          break;
        case "ArrowRight":
          if (handlers.onArrowRight) {
            event.preventDefault();
            handlers.onArrowRight();
          }
          break;
        case "ArrowUp":
          if (handlers.onArrowUp) {
            event.preventDefault();
            handlers.onArrowUp();
          }
          break;
        case "ArrowDown":
          if (handlers.onArrowDown) {
            event.preventDefault();
            handlers.onArrowDown();
          }
          break;
        case "Delete":
        case "Backspace":
          if (handlers.onDelete) {
            event.preventDefault();
            handlers.onDelete();
          }
          break;
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);

  return {
    // Helper to focus next/previous element
    focusNext: useCallback(() => {
      const focusableElements = document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const currentIndex = Array.from(focusableElements).indexOf(
        document.activeElement as Element
      );
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      (focusableElements[nextIndex] as HTMLElement)?.focus();
    }, []),

    focusPrevious: useCallback(() => {
      const focusableElements = document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const currentIndex = Array.from(focusableElements).indexOf(
        document.activeElement as Element
      );
      const previousIndex =
        currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
      (focusableElements[previousIndex] as HTMLElement)?.focus();
    }, []),
  };
}

// Hook for managing focus within a specific container
export function useFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const trapFocus = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (event.key === "Tab") {
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [containerRef]
  );

  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;

    const firstFocusable = containerRef.current.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;

    firstFocusable?.focus();
  }, [containerRef]);

  return {
    trapFocus,
    focusFirst,
  };
}
