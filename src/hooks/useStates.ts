import { useState, useEffect, useCallback } from "react";
import { NoteService } from "../services/noteService";
import type {
  State,
  CreateStateRequest,
  UpdateStateRequest,
} from "../types/note";

export function useStates() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await NoteService.getAllStates();
      if (response.success) {
        setStates(response.data);
      } else {
        setError(response.error || "Failed to load states");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const createState = useCallback(async (request: CreateStateRequest) => {
    setError(null);
    try {
      const response = await NoteService.createState(request);
      if (response.success && response.data) {
        setStates(prev => [...prev, response.data!]);
        return response.data;
      } else {
        setError(response.error || "Failed to create state");
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  const updateState = useCallback(async (request: UpdateStateRequest) => {
    setError(null);
    try {
      const response = await NoteService.updateState(request);
      if (response.success && response.data) {
        setStates(prev =>
          prev.map(state => (state.id === request.id ? response.data! : state))
        );
        return response.data;
      } else {
        setError(response.error || "Failed to update state");
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  const deleteState = useCallback(async (id: number) => {
    setError(null);
    try {
      const response = await NoteService.deleteState(id);
      if (response.success) {
        setStates(prev => prev.filter(state => state.id !== id));
        return true;
      } else {
        setError(response.error || "Failed to delete state");
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const reorderStates = useCallback(
    async (stateId: number, newPosition: number) => {
      setError(null);
      try {
        // Optimistic update
        setStates(prev => {
          const newStates = [...prev];
          const stateIndex = newStates.findIndex(s => s.id === stateId);
          if (stateIndex === -1) return prev;

          const [movedState] = newStates.splice(stateIndex, 1);
          movedState.position = newPosition;
          newStates.splice(newPosition, 0, movedState);

          // Update positions for all states
          newStates.forEach((state, index) => {
            state.position = index;
          });

          return newStates;
        });

        // Update in database
        const updatePromises = states.map((state, index) =>
          NoteService.updateState({ id: state.id!, position: index })
        );

        await Promise.all(updatePromises);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        // Reload states to revert optimistic update
        await loadStates();
      }
    },
    [states, loadStates]
  );

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  return {
    states,
    loading,
    error,
    loadStates,
    createState,
    updateState,
    deleteState,
    reorderStates,
  };
}
