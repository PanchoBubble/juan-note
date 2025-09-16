import { invoke } from "@tauri-apps/api/core";
import type {
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteResponse,
  NotesListResponse,
  SearchRequest,
  DeleteNoteRequest,
  UpdateNoteDoneRequest,
  CreateStateRequest,
  UpdateStateRequest,
  StateResponse,
  StatesListResponse,
  BulkOperationResponse,
} from "../types/note";

export class NoteService {
  static async initializeDatabase(): Promise<NotesListResponse> {
    try {
      return await invoke("initialize_db");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async createNote(request: CreateNoteRequest): Promise<NoteResponse> {
    try {
      return await invoke("create_note", { request });
    } catch (error) {
      console.error("Failed to create note:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getNote(id: number): Promise<NoteResponse> {
    try {
      return await invoke("get_note", { id });
    } catch (error) {
      console.error("Failed to get note:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getAllNotes(): Promise<NotesListResponse> {
    try {
      return await invoke("get_all_notes");
    } catch (error) {
      console.error("Failed to get all notes:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async updateNote(request: UpdateNoteRequest): Promise<NoteResponse> {
    try {
      return await invoke("update_note", { request });
    } catch (error) {
      console.error("Failed to update note:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async deleteNote(request: DeleteNoteRequest): Promise<NoteResponse> {
    try {
      return await invoke("delete_note", { request });
    } catch (error) {
      console.error("Failed to delete note:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async searchNotes(request: SearchRequest): Promise<NotesListResponse> {
    try {
      return await invoke("search_notes", { request });
    } catch (error) {
      console.error("Failed to search notes:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async updateNoteDone(
    request: UpdateNoteDoneRequest
  ): Promise<NoteResponse> {
    try {
      return await invoke("update_note_done", { request });
    } catch (error) {
      console.error("Failed to update note done status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getAllStates(): Promise<StatesListResponse> {
    try {
      return await invoke("get_all_states");
    } catch (error) {
      console.error("Failed to get all states:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async createState(
    request: CreateStateRequest
  ): Promise<StateResponse> {
    try {
      return await invoke("create_state", { request });
    } catch (error) {
      console.error("Failed to create state:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async updateState(
    request: UpdateStateRequest
  ): Promise<StateResponse> {
    try {
      return await invoke("update_state", { request });
    } catch (error) {
      console.error("Failed to update state:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async deleteState(id: number): Promise<StateResponse> {
    try {
      return await invoke("delete_state", { id });
    } catch (error) {
      console.error("Failed to delete state:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async bulkDeleteNotes(
    noteIds: number[]
  ): Promise<BulkOperationResponse> {
    try {
      return await invoke("bulk_delete_notes", { noteIds });
    } catch (error) {
      console.error("Failed to bulk delete notes:", error);
      return {
        success: false,
        successful_count: 0,
        failed_count: noteIds.length,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async bulkUpdateNotesPriority(
    noteIds: number[],
    priority: number
  ): Promise<BulkOperationResponse> {
    try {
      return await invoke("bulk_update_notes_priority", { noteIds, priority });
    } catch (error) {
      console.error("Failed to bulk update notes priority:", error);
      return {
        success: false,
        successful_count: 0,
        failed_count: noteIds.length,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async bulkUpdateNotesState(
    noteIds: number[],
    stateId: number
  ): Promise<BulkOperationResponse> {
    try {
      return await invoke("bulk_update_notes_state", { noteIds, stateId });
    } catch (error) {
      console.error("Failed to bulk update notes state:", error);
      return {
        success: false,
        successful_count: 0,
        failed_count: noteIds.length,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async bulkUpdateNotesDone(
    noteIds: number[],
    done: boolean
  ): Promise<BulkOperationResponse> {
    try {
      return await invoke("bulk_update_notes_done", { noteIds, done });
    } catch (error) {
      console.error("Failed to bulk update notes done status:", error);
      return {
        success: false,
        successful_count: 0,
        failed_count: noteIds.length,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async migrateNotesToStates(): Promise<NoteResponse> {
    try {
      return await invoke("migrate_notes_to_states");
    } catch (error) {
      console.error("Failed to migrate notes to states:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
