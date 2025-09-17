import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

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



export class NoteManager {
  private juanNoteProcess: any = null;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd().replace('/mcp-server', '');
  }

  private async ensureJuanNoteRunning(): Promise<void> {
    // Check if Juan Note is already running
    // For now, we'll assume it's running or start it
    // In a real implementation, you'd check for running processes
    if (!this.juanNoteProcess) {
      // Try to start Juan Note if not running
      await this.startJuanNote();
    }
  }

  private async startJuanNote(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Path to the Juan Note executable
        const juanNotePath = this.findJuanNoteExecutable();

        if (!juanNotePath) {
          reject(new Error('Juan Note executable not found. Please ensure Juan Note is installed and accessible.'));
          return;
        }

        // Start Juan Note in headless mode if possible
        this.juanNoteProcess = spawn(juanNotePath, ['--headless'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: this.projectRoot
        });

        // Wait a bit for the app to start
        setTimeout(() => {
          resolve();
        }, 2000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private findJuanNoteExecutable(): string | null {
    // Try common locations for Juan Note executable
    const possiblePaths = [
      path.join(this.projectRoot, 'src-tauri', 'target', 'release', 'juan-note'),
      path.join(this.projectRoot, 'src-tauri', 'target', 'debug', 'juan-note'),
      '/Applications/Juan Note.app/Contents/MacOS/juan-note', // macOS
      'C:\\Program Files\\Juan Note\\juan-note.exe', // Windows
    ];

    for (const exePath of possiblePaths) {
      if (fs.existsSync(exePath)) {
        return exePath;
      }
    }

    return null;
  }

  private async invokeTauriCommand(command: string, args: any = {}): Promise<any> {
    await this.ensureJuanNoteRunning();

    // For now, we'll simulate the Tauri invoke by making HTTP requests
    // In a real implementation, you'd need to set up an HTTP bridge or IPC
    try {
      const response = await this.makeHttpRequest('POST', `http://localhost:1420/invoke/${command}`, args);
      return response;
    } catch (error) {
      // Fallback: try to communicate via stdin/stdout if HTTP fails
      return this.invokeViaStdio(command, args);
    }
  }

  private async makeHttpRequest(method: string, url: string, data?: any): Promise<any> {
    // Simple HTTP request implementation
    // In a real scenario, you'd use a proper HTTP client
    return new Promise((resolve, reject) => {
      const http = require('http');
      const urlObj = new URL(url);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const req = http.request(options, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      });

      req.on('error', (err: any) => {
        reject(err);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  private async invokeViaStdio(command: string, args: any): Promise<any> {
    // Fallback method using stdin/stdout
    // This would require Juan Note to support command-line interface
    return new Promise((resolve, reject) => {
      if (!this.juanNoteProcess) {
        reject(new Error('Juan Note process not available'));
        return;
      }

      const commandData = JSON.stringify({ command, args });
      this.juanNoteProcess.stdin.write(commandData + '\n');

      // Listen for response (simplified)
      let responseData = '';
      const onData = (data: Buffer) => {
        responseData += data.toString();
        try {
          const response = JSON.parse(responseData);
          this.juanNoteProcess.stdout.removeListener('data', onData);
          resolve(response);
        } catch (e) {
          // Wait for more data
        }
      };

      this.juanNoteProcess.stdout.on('data', onData);

      // Timeout after 10 seconds
      setTimeout(() => {
        this.juanNoteProcess.stdout.removeListener('data', onData);
        reject(new Error('Command timeout'));
      }, 10000);
    });
  }



  // Note Management
  async createNote(args: any): Promise<any> {
    try {
      const result = await this.invokeTauriCommand('create_note', args);
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
      const result = await this.invokeTauriCommand('get_note', id);
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
      const result = await this.invokeTauriCommand('get_all_notes');
      if (result.success) {
        const notes = result.data || [];
        const summary = notes.map((note: Note) =>
          `• ${note.title} (ID: ${note.id}, Priority: ${note.priority}, Done: ${note.done})`
        ).join('\n');

        return {
          content: [{
            type: 'text',
            text: `Found ${notes.length} notes:\n${summary}`
          }]
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
      const result = await this.invokeTauriCommand('update_note', args);
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
      const result = await this.invokeTauriCommand('delete_note', { id });
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
      const result = await this.invokeTauriCommand('search_notes', args);
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
    try {
      const result = await this.invokeTauriCommand('bulk_delete_notes', args);
      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: `Bulk delete completed: ${result.successful_count} successful, ${result.failed_count} failed`
          }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Bulk delete failed: ${result.error}` }],
          isError: true
        };
      }
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