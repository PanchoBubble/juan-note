export interface State {
    id?: number;
    name: string;
    position: number;
    color?: string;
    created_at?: string;
    updated_at?: string;
}

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
    done: boolean;
    state_id?: number;
}

export interface CreateNoteRequest {
    title: string;
    content: string;
    priority?: number;
    labels?: string[];
    deadline?: string;
    reminder_minutes?: number;
    done?: boolean;
    state_id?: number;
}

export interface UpdateNoteRequest {
    id: number;
    title?: string;
    content?: string;
    priority?: number;
    labels?: string[];
    deadline?: string;
    reminder_minutes?: number;
    done?: boolean;
    state_id?: number;
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

export interface UpdateNoteDoneRequest {
    id: number;
    done: boolean;
}

export interface CreateStateRequest {
    name: string;
    position: number;
    color?: string;
}

export interface UpdateStateRequest {
    id: number;
    name?: string;
    position?: number;
    color?: string;
}

export interface StateResponse {
    success: boolean;
    data?: State;
    error?: string;
}

export interface StatesListResponse {
    success: boolean;
    data: State[];
    error?: string;
}

// Bulk Operations Types
export interface BulkDeleteRequest {
    note_ids: number[];
}

export interface BulkUpdatePriorityRequest {
    note_ids: number[];
    priority: number;
}

export interface BulkUpdateStateRequest {
    note_ids: number[];
    state_id: number;
}

export interface BulkOperationResponse {
    success: boolean;
    successful_count: number;
    failed_count: number;
    errors?: string[];
    error?: string;
}