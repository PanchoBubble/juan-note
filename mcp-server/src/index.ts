#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { NoteManager } from './managers/noteManager.js';
import { accessController } from './security/accessControl.js';

class JuanNoteMCPServer {
  private server: Server;
  private noteManager: NoteManager;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd().replace('/mcp-server', '');
    this.noteManager = new NoteManager();

    this.server = new Server(
      {
        name: 'juan-note-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Note Management
          {
            name: 'create_note',
            description: 'Create a new note in Juan Note',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Note title' },
                content: { type: 'string', description: 'Note content' },
                priority: { type: 'number', description: 'Priority level (0-5)', default: 0 },
                labels: { type: 'array', items: { type: 'string' }, description: 'Array of label strings' },
                deadline: { type: 'string', description: 'Deadline in ISO format' },
                reminder_minutes: { type: 'number', description: 'Reminder time in minutes', default: 0 },
                done: { type: 'boolean', description: 'Whether the note is completed', default: false },
                state_id: { type: 'number', description: 'State ID for the note' },
                order: { type: 'number', description: 'Display order', default: 0 }
              },
              required: ['title', 'content']
            }
          },
          {
            name: 'get_note',
            description: 'Get a specific note by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Note ID' }
              },
              required: ['id']
            }
          },
          {
            name: 'get_all_notes',
            description: 'Get all notes from Juan Note',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'update_note',
            description: 'Update an existing note',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Note ID' },
                title: { type: 'string', description: 'New title' },
                content: { type: 'string', description: 'New content' },
                priority: { type: 'number', description: 'New priority level' },
                labels: { type: 'array', items: { type: 'string' }, description: 'New labels array' },
                deadline: { type: 'string', description: 'New deadline' },
                reminder_minutes: { type: 'number', description: 'New reminder minutes' },
                done: { type: 'boolean', description: 'New done status' },
                state_id: { type: 'number', description: 'New state ID' },
                order: { type: 'number', description: 'New order' }
              },
              required: ['id']
            }
          },
          {
            name: 'delete_note',
            description: 'Delete a note by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Note ID to delete' }
              },
              required: ['id']
            }
          },
          {
            name: 'search_notes',
            description: 'Search notes using full-text search',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', description: 'Maximum results to return', default: 50 },
                offset: { type: 'number', description: 'Results offset', default: 0 }
              },
              required: ['query']
            }
          },
          {
            name: 'update_note_done',
            description: 'Update the done status of a note',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Note ID' },
                done: { type: 'boolean', description: 'New done status' }
              },
              required: ['id', 'done']
            }
          },

          // State Management
          {
            name: 'get_all_states',
            description: 'Get all available states',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'create_state',
            description: 'Create a new state',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'State name' },
                position: { type: 'number', description: 'State position/order' },
                color: { type: 'string', description: 'State color (hex code)' }
              },
              required: ['name', 'position']
            }
          },
          {
            name: 'update_state',
            description: 'Update an existing state',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'State ID' },
                name: { type: 'string', description: 'New name' },
                position: { type: 'number', description: 'New position' },
                color: { type: 'string', description: 'New color' }
              },
              required: ['id']
            }
          },
          {
            name: 'delete_state',
            description: 'Delete a state by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'State ID to delete' }
              },
              required: ['id']
            }
          },

          // Bulk Operations
          {
            name: 'bulk_delete_notes',
            description: 'Delete multiple notes at once',
            inputSchema: {
              type: 'object',
              properties: {
                note_ids: { type: 'array', items: { type: 'number' }, description: 'Array of note IDs to delete' }
              },
              required: ['note_ids']
            }
          },
          {
            name: 'bulk_update_notes_priority',
            description: 'Update priority for multiple notes',
            inputSchema: {
              type: 'object',
              properties: {
                note_ids: { type: 'array', items: { type: 'number' }, description: 'Array of note IDs' },
                priority: { type: 'number', description: 'New priority level' }
              },
              required: ['note_ids', 'priority']
            }
          },
          {
            name: 'bulk_update_notes_done',
            description: 'Update done status for multiple notes',
            inputSchema: {
              type: 'object',
              properties: {
                note_ids: { type: 'array', items: { type: 'number' }, description: 'Array of note IDs' },
                done: { type: 'boolean', description: 'New done status' }
              },
              required: ['note_ids', 'done']
            }
          },
          {
            name: 'bulk_update_notes_state',
            description: 'Update state for multiple notes',
            inputSchema: {
              type: 'object',
              properties: {
                note_ids: { type: 'array', items: { type: 'number' }, description: 'Array of note IDs' },
                state_id: { type: 'number', description: 'New state ID' }
              },
              required: ['note_ids', 'state_id']
            }
          },
          {
            name: 'bulk_update_notes_order',
            description: 'Update display order for multiple notes',
            inputSchema: {
              type: 'object',
              properties: {
                note_ids: { type: 'array', items: { type: 'number' }, description: 'Array of note IDs' },
                orders: { type: 'array', items: { type: 'number' }, description: 'Array of new order values (same length as note_ids)' }
              },
              required: ['note_ids', 'orders']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      // Check access control
      const accessCheck = accessController.checkAccess(name);
      if (!accessCheck.allowed) {
        return {
          content: [{ type: 'text', text: `Access denied: ${accessCheck.reason}` }],
          isError: true
        };
      }

      // Check rate limiting
      const rateCheck = accessController.checkRateLimit(name);
      if (!rateCheck.allowed) {
        return {
          content: [{ type: 'text', text: `Rate limit exceeded: ${rateCheck.reason}` }],
          isError: true
        };
      }

      // Validate input
      const validation = accessController.validateInput(name, args || {});
      if (!validation.valid) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${validation.errors.join(', ')}` }],
          isError: true
        };
      }

      // Sanitize input
      const sanitizedArgs = accessController.sanitizeInput(args || {});

      switch (name) {
        // Note Management
        case 'create_note':
          return await this.noteManager.createNote(sanitizedArgs);
        case 'get_note':
          return await this.noteManager.getNote(sanitizedArgs?.id);
        case 'get_all_notes':
          return await this.noteManager.getAllNotes();
        case 'update_note':
          return await this.noteManager.updateNote(sanitizedArgs);
        case 'delete_note':
          return await this.noteManager.deleteNote(sanitizedArgs?.id);
        case 'search_notes':
          return await this.noteManager.searchNotes(sanitizedArgs);
        case 'update_note_done':
          return await this.noteManager.updateNoteDone(sanitizedArgs);

        // State Management
        case 'get_all_states':
          return await this.noteManager.getAllStates();
        case 'create_state':
          return await this.noteManager.createState(sanitizedArgs);
        case 'update_state':
          return await this.noteManager.updateState(sanitizedArgs);
        case 'delete_state':
          return await this.noteManager.deleteState(sanitizedArgs?.id);

        // Bulk Operations
        case 'bulk_delete_notes':
          return await this.noteManager.bulkDeleteNotes(sanitizedArgs);
        case 'bulk_update_notes_priority':
          return await this.noteManager.bulkUpdateNotesPriority(sanitizedArgs);
        case 'bulk_update_notes_done':
          return await this.noteManager.bulkUpdateNotesDone(sanitizedArgs);
        case 'bulk_update_notes_state':
          return await this.noteManager.bulkUpdateNotesState(sanitizedArgs);
        case 'bulk_update_notes_order':
          return await this.noteManager.bulkUpdateNotesOrder(sanitizedArgs);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }



  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Juan Note MCP Server started');
  }
}

// Start the MCP server
const mcpServer = new JuanNoteMCPServer();
mcpServer.start().catch(console.error);