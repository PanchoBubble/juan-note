

interface Note {
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
  order: number;
}

interface State {
  id?: number;
  name: string;
  position: number;
  color?: string;
  created_at?: string;
  updated_at?: string;
}



import { configLoader } from '../config/configLoader.js';
import { streamHandler } from '../streaming/streamHandler.js';
import { noteWatcher } from '../realtime/noteWatcher.js';

export class NoteManager {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd().replace('/mcp-server', '');
  }

  private async makeApiRequest(method: string, endpoint: string, data?: any): Promise<any> {
    // Make HTTP request to Juan Note's REST API
    // Juan Note must be running for this to work
    try {
      const host = configLoader.getJuanNoteHost();
      const port = configLoader.getJuanNotePort();
      const url = `http://${host}:${port}${endpoint}`;
      const response = await this.makeHttpRequest(method, url, data);
      return response;
    } catch (error) {
      throw new Error(`Failed to communicate with Juan Note. Please ensure Juan Note is running. ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async makeHttpRequest(method: string, url: string, data?: any): Promise<any> {
    // Use node-fetch for HTTP requests
    const fetch = (await import('node-fetch')).default;

    const options: any = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    console.error(`Making ${method} request to ${url}`);
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const body = await response.text();
      console.error(`Response received: ${body.substring(0, 200)}...`);

      try {
        return JSON.parse(body);
      } catch (e) {
        return body;
      }
    } catch (error) {
      console.error(`HTTP request failed:`, error);
      throw error;
    }
  }

  private async invokeTauriCommand(command: string, args?: any): Promise<any> {
    // For MCP server running outside of Tauri, we need to use HTTP API
    // This method provides compatibility with Tauri command names
    const endpointMap: { [key: string]: { method: string; path: string } } = {
      'update_note_done': { method: 'PUT', path: '/notes/done' },
      'get_all_states': { method: 'GET', path: '/states' },
      'create_state': { method: 'POST', path: '/states' },
      'update_state': { method: 'PUT', path: '/states' },
      'delete_state': { method: 'DELETE', path: '/states' },
      'delete_note': { method: 'DELETE', path: '/notes' },
      'bulk_update_notes_priority': { method: 'PUT', path: '/notes/bulk/priority' },
      'bulk_update_notes_done': { method: 'PUT', path: '/notes/bulk/done' },
      'bulk_update_notes_state': { method: 'PUT', path: '/notes/bulk/state' },
      'bulk_update_notes_order': { method: 'PUT', path: '/notes/bulk/order' },
    };

    const endpoint = endpointMap[command];
    if (!endpoint) {
      throw new Error(`Unknown Tauri command: ${command}`);
    }

    let url = endpoint.path;
    let data = args;

    // Handle commands that need ID in URL
    if (command === 'delete_note' && args?.id) {
      url = `${endpoint.path}/${args.id}`;
      data = undefined;
    } else if (command === 'delete_state' && typeof args === 'number') {
      url = `${endpoint.path}/${args}`;
      data = undefined;
    }

    return this.makeApiRequest(endpoint.method, url, data);
  }





  // Note Management
  async createNote(args: any): Promise<any> {
    try {
      const result = await this.makeApiRequest('POST', '/notes', args);
      if (result.success) {
        return {
          content: [{ type: 'text', text: `Note created successfully with ID: ${result.data?.id}` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to create note: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error creating note: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async getNote(id: number): Promise<any> {
    try {
      const result = await this.makeApiRequest('GET', `/notes/${id}`);
      if (result.success && result.data) {
        const note = result.data;
        return {
          content: [{
            type: 'text',
            text: `Note Details:\nID: ${note.id}\nTitle: ${note.title}\nContent: ${note.content}\nPriority: ${note.priority}\nDone: ${note.done}\nLabels: ${note.labels.join(', ')}`
          }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Note not found: ${result.error || 'Unknown error'}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error getting note: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async getAllNotes(): Promise<any> {
    try {
      const result = await this.makeApiRequest('GET', '/notes');
      if (result.success) {
        const notes = result.data || [];
        const summary = notes.map((note: Note) =>
          `• ${note.title} (ID: ${note.id}, Priority: ${note.priority}, Done: ${note.done})`
        ).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${notes.length} notes:\n${summary}`
            }
          ],
          _meta: {
            notes: notes
          }
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to get notes: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error getting notes: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async updateNote(args: any): Promise<any> {
    try {
      const result = await this.makeApiRequest('PUT', `/notes/${args.id}`, args);
      if (result.success) {
        return {
          content: [{ type: 'text', text: `Note ${args.id} updated successfully` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to update note: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error updating note: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async deleteNote(id: number): Promise<any> {
    try {
      const result = await this.makeApiRequest('DELETE', `/notes/${id}`);
      if (result.success) {
        return {
          content: [{ type: 'text', text: `Note ${id} deleted successfully` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to delete note: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error deleting note: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async searchNotes(args: any): Promise<any> {
    try {
      const result = await this.makeApiRequest('POST', '/notes/search', args);
      if (result.success) {
        const notes = result.data || [];
        const summary = notes.map((note: Note) =>
          `• ${note.title} (ID: ${note.id})`
        ).join('\n');

        return {
          content: [{
            type: 'text',
            text: `Search results for "${args.query}":\nFound ${notes.length} notes:\n${summary}`
          }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Search failed: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error searching notes: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async updateNoteDone(args: any): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('update_note_done', args);
      if (result.success) {
        return {
          content: [{ type: 'text', text: `Note ${args.id} marked as ${args.done ? 'done' : 'not done'}` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to update note status: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error updating note status: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  // State Management
  async getAllStates(): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('get_all_states');
      if (result.success) {
        const states = result.data || [];
        const summary = states.map((state: State) =>
          `• ${state.name} (ID: ${state.id}, Position: ${state.position})`
        ).join('\n');

        return {
          content: [{
            type: 'text',
            text: `Available states:\n${summary}`
          }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to get states: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error getting states: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async createState(args: any): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('create_state', args);
      if (result.success) {
        return {
          content: [{ type: 'text', text: `State "${args.name}" created successfully with ID: ${result.data?.id}` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to create state: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error creating state: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async updateState(args: any): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('update_state', args);
      if (result.success) {
        return {
          content: [{ type: 'text', text: `State ${args.id} updated successfully` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to update state: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error updating state: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async deleteState(id: number): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('delete_state', id);
      if (result.success) {
        return {
          content: [{ type: 'text', text: `State ${id} deleted successfully` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Failed to delete state: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error deleting state: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  // Bulk Operations
  async bulkDeleteNotes(args: any): Promise<any> {
    const operationId = `bulk_delete_${Date.now()}`;

    try {
      const result = await streamHandler.executeBulkOperation(
        operationId,
        args.note_ids,
        async (noteId, index) => {
          // Delete each note individually for progress tracking
          const deleteResult = await this.invokeTauriCommand('delete_note', { id: noteId });
          if (!deleteResult.success) {
            throw new Error(`Failed to delete note ${noteId}: ${deleteResult.error}`);
          }
          return { id: noteId, success: true };
        },
        (results) => {
          const successful = results.filter(r => r.success).length;
          const failed = results.length - successful;
          return {
            content: [{
              type: 'text',
              text: `Bulk delete completed: ${successful} successful, ${failed} failed`
            }]
          };
        }
      );

      return result;
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error in bulk delete: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async bulkUpdateNotesPriority(args: any): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('bulk_update_notes_priority', args);
      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: `Bulk priority update completed: ${result.successful_count} successful, ${result.failed_count} failed`
          }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Bulk priority update failed: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error in bulk priority update: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async bulkUpdateNotesDone(args: any): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('bulk_update_notes_done', args);
      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: `Bulk done status update completed: ${result.successful_count} successful, ${result.failed_count} failed`
          }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Bulk done status update failed: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error in bulk done status update: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async bulkUpdateNotesState(args: any): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('bulk_update_notes_state', args);
      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: `Bulk state update completed: ${result.successful_count} successful, ${result.failed_count} failed`
          }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Bulk state update failed: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error in bulk state update: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }

  async bulkUpdateNotesOrder(args: any): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('bulk_update_notes_order', args);
      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: `Bulk order update completed: ${result.successful_count} successful, ${result.failed_count} failed`
          }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Bulk order update failed: ${result.error}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error in bulk order update: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }


}