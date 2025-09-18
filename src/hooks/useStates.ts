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

  const createState = useCallback(
    async (request: CreateStateRequest, retryCount = 0) => {
      setError(null);
      try {
        const response = await NoteService.createState(request);
        if (response.success && response.data) {
          setStates(prev => [...prev, response.data!]);
          return response.data;
        } else {
          const errorMessage = response.error || "Failed to create state";
          if (retryCount < 2) {
            await new Promise(resolve =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
            return createState(request, retryCount + 1);
          }
          setError(errorMessage);
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        if (retryCount < 2) {
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
          return createState(request, retryCount + 1);
        }
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const updateState = useCallback(
    async (request: UpdateStateRequest, retryCount = 0) => {
      setError(null);
      try {
        const response = await NoteService.updateState(request);
        if (response.success && response.data) {
          setStates(prev =>
            prev.map(state =>
              state.id === request.id ? response.data! : state
            )
          );
          return response.data;
        } else {
          const errorMessage = response.error || "Failed to update state";
          if (retryCount < 2) {
            await new Promise(resolve =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
            return updateState(request, retryCount + 1);
          }
          setError(errorMessage);
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        if (retryCount < 2) {
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
          return updateState(request, retryCount + 1);
        }
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const deleteState = useCallback(async (id: number, retryCount = 0) => {
    setError(null);
    try {
      const response = await NoteService.deleteState(id);
      if (response.success) {
        setStates(prev => prev.filter(state => state.id !== id));
        return true;
      } else {
        const errorMessage = response.error || "Failed to delete state";
        if (retryCount < 2) {
          // Retry up to 2 times with exponential backoff
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
          return deleteState(id, retryCount + 1);
        }
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (retryCount < 2) {
        // Retry up to 2 times with exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );
        return deleteState(id, retryCount + 1);
      }
      setError(errorMessage);
      return false;
    }
  }, []);

  const reorderStates = useCallback(
    async (stateId: number, newPosition: number) => {
      setError(null);
      try {
        // Optimistic update and get current states for database update
        let currentStates: State[] = [];
        setStates(prev => {
          currentStates = [...prev];
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

        // Update in database using the captured currentStates
        const updatePromises = currentStates.map((state, index) =>
          NoteService.updateState({ id: state.id!, position: index })
        );

        await Promise.all(updatePromises);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        // Reload states to revert optimistic update
        const response = await NoteService.getAllStates();
        if (response.success) {
          setStates(response.data);
        }
      }
    },
    [] // No dependencies needed since we capture states inside the function
  );

  useEffect(() => {
    const initializeStates = async () => {
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
    };

    initializeStates();
  }, []);

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
