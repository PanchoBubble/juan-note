export interface Note {
  id?: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  priority: number;
  labels: string[];
  deadline?: string;
  reminder_minutes: number;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  priority?: number;
  labels?: string[];
  deadline?: string;
  reminder_minutes?: number;
}

export interface UpdateNoteRequest {
  id: number;
  title?: string;
  content?: string;
  priority?: number;
  labels?: string[];
  deadline?: string;
  reminder_minutes?: number;
}

export interface NoteResponse {
  success: boolean;
  data?: Note;
  error?: string;
}

export interface NotesListResponse {
  success: boolean;
  data: Note[];
  error?: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface DeleteNoteRequest {
  id: number;
}