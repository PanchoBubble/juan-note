import { invoke } from '@tauri-apps/api/core';
import type {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteResponse,
  NotesListResponse,
  SearchRequest,
  DeleteNoteRequest
} from '../types/note';

export class NoteService {
  static async initializeDatabase(): Promise<NotesListResponse> {
    try {
      return await invoke('initialize_db');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async createNote(request: CreateNoteRequest): Promise<NoteResponse> {
    try {
      return await invoke('create_note', { request });
    } catch (error) {
      console.error('Failed to create note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getNote(id: number): Promise<NoteResponse> {
    try {
      return await invoke('get_note', { id });
    } catch (error) {
      console.error('Failed to get note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getAllNotes(): Promise<NotesListResponse> {
    try {
      return await invoke('get_all_notes');
    } catch (error) {
      console.error('Failed to get all notes:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async updateNote(request: UpdateNoteRequest): Promise<NoteResponse> {
    try {
      return await invoke('update_note', { request });
    } catch (error) {
      console.error('Failed to update note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async deleteNote(request: DeleteNoteRequest): Promise<NoteResponse> {
    try {
      return await invoke('delete_note', { request });
    } catch (error) {
      console.error('Failed to delete note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async searchNotes(request: SearchRequest): Promise<NotesListResponse> {
    try {
      return await invoke('search_notes', { request });
    } catch (error) {
      console.error('Failed to search notes:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}