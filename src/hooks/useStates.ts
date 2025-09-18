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

      // Generate optimistic state with temporary ID
      const optimisticState: State = {
        id: -Date.now(), // Temporary negative ID
        name: request.name,
        position: request.position,
        color: request.color || "#3498db",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      setStates(prev => [...prev, optimisticState]);

      try {
        const response = await NoteService.createState(request);
        if (response.success && response.data) {
          // Replace optimistic state with real one
          setStates(prev =>
            prev.map(state =>
              state.id === optimisticState.id ? response.data! : state
            )
          );
          return response.data;
        } else {
          // Rollback optimistic update
          setStates(prev =>
            prev.filter(state => state.id !== optimisticState.id)
          );

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
        // Rollback optimistic update
        setStates(prev =>
          prev.filter(state => state.id !== optimisticState.id)
        );

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

      // Store previous state for rollback
      let previousState: State | undefined;

      // Optimistic update
      setStates(prev => {
        const newStates = prev.map(state => {
          if (state.id === request.id) {
            previousState = state;
            return {
              ...state,
              ...(request.name && { name: request.name }),
              ...(request.position !== undefined && {
                position: request.position,
              }),
              ...(request.color && { color: request.color }),
              updated_at: new Date().toISOString(),
            };
          }
          return state;
        });
        return newStates;
      });

      try {
        const response = await NoteService.updateState(request);
        if (response.success && response.data) {
          // Replace optimistic update with real data
          setStates(prev =>
            prev.map(state =>
              state.id === request.id ? response.data! : state
            )
          );
          return response.data;
        } else {
          // Rollback optimistic update
          if (previousState) {
            setStates(prev =>
              prev.map(state =>
                state.id === request.id ? previousState! : state
              )
            );
          }

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
        // Rollback optimistic update
        if (previousState) {
          setStates(prev =>
            prev.map(state =>
              state.id === request.id ? previousState! : state
            )
          );
        }

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

    // Store the state being deleted for potential rollback
    let deletedState: State | undefined;

    // Optimistic update - remove state immediately
    setStates(prev => {
      deletedState = prev.find(state => state.id === id);
      return prev.filter(state => state.id !== id);
    });

    try {
      const response = await NoteService.deleteState(id);
      if (response.success) {
        // Deletion confirmed - no need to update state again
        return true;
      } else {
        // Rollback optimistic update
        if (deletedState) {
          setStates(prev =>
            [...prev, deletedState!].sort((a, b) => a.position - b.position)
          );
        }

        const errorMessage = response.error || "Failed to delete state";
        if (retryCount < 2) {
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
          return deleteState(id, retryCount + 1);
        }
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      // Rollback optimistic update
      if (deletedState) {
        setStates(prev =>
          [...prev, deletedState!].sort((a, b) => a.position - b.position)
        );
      }

      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (retryCount < 2) {
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
      console.log("🔄 Starting reorderStates:", { stateId, newPosition });

      try {
        // Store the final reordered states for database update
        let reorderedStates: State[] = [];

        setStates(prev => {
          console.log(
            "📊 Current states before reorder:",
            prev.map(s => ({ id: s.id, name: s.name, position: s.position }))
          );

          const newStates = [...prev];
          const stateIndex = newStates.findIndex(s => s.id === stateId);
          if (stateIndex === -1) {
            console.warn("❌ State not found for reordering:", stateId);
            return prev;
          }

          const [movedState] = newStates.splice(stateIndex, 1);
          newStates.splice(newPosition, 0, movedState);

          // Update positions for all states based on their new array positions
          newStates.forEach((state, index) => {
            state.position = index;
          });

          // Store the reordered states for database update
          reorderedStates = [...newStates];

          console.log(
            "✅ States after reorder:",
            reorderedStates.map(s => ({
              id: s.id,
              name: s.name,
              position: s.position,
            }))
          );
          return newStates;
        });

        // Update in database using the NEW reordered positions
        const updatePromises = reorderedStates.map(state =>
          NoteService.updateState({ id: state.id!, position: state.position })
        );

        console.log("💾 Updating database with new positions...");
        await Promise.all(updatePromises);
        console.log("✅ Database update complete");
      } catch (err) {
        console.error("❌ Error in reorderStates:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // Reload states to revert optimistic update
        const response = await NoteService.getAllStates();
        if (response.success) {
          setStates(response.data);
        }
      }
    },
    []
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
