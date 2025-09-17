/**
 * Access control system for Juan Note MCP server
 * Provides operation-level permissions and input validation
 */

import { configLoader } from '../config/configLoader.js';

export interface AccessControl {
  operation: string;
  requiresAuth: boolean;
  rateLimit: number; // requests per minute
  sensitive: boolean; // operations that modify data
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Define access controls for each operation
export const OPERATION_CONTROLS: Record<string, AccessControl> = {
  // Read operations - low risk
  get_note: { operation: 'get_note', requiresAuth: false, rateLimit: 60, sensitive: false },
  get_all_notes: { operation: 'get_all_notes', requiresAuth: false, rateLimit: 30, sensitive: false },
  search_notes: { operation: 'search_notes', requiresAuth: false, rateLimit: 30, sensitive: false },
  get_all_states: { operation: 'get_all_states', requiresAuth: false, rateLimit: 30, sensitive: false },

  // Write operations - medium risk
  create_note: { operation: 'create_note', requiresAuth: false, rateLimit: 20, sensitive: true },
  update_note: { operation: 'update_note', requiresAuth: false, rateLimit: 20, sensitive: true },
  update_note_done: { operation: 'update_note_done', requiresAuth: false, rateLimit: 30, sensitive: true },
  create_state: { operation: 'create_state', requiresAuth: false, rateLimit: 10, sensitive: true },
  update_state: { operation: 'update_state', requiresAuth: false, rateLimit: 20, sensitive: true },

  // Delete operations - high risk
  delete_note: { operation: 'delete_note', requiresAuth: false, rateLimit: 5, sensitive: true },
  delete_state: { operation: 'delete_state', requiresAuth: false, rateLimit: 5, sensitive: true },

  // Bulk operations - highest risk
  bulk_delete_notes: { operation: 'bulk_delete_notes', requiresAuth: false, rateLimit: 2, sensitive: true },
  bulk_update_notes_priority: { operation: 'bulk_update_notes_priority', requiresAuth: false, rateLimit: 5, sensitive: true },
  bulk_update_notes_done: { operation: 'bulk_update_notes_done', requiresAuth: false, rateLimit: 5, sensitive: true },
  bulk_update_notes_state: { operation: 'bulk_update_notes_state', requiresAuth: false, rateLimit: 5, sensitive: true },
  bulk_update_notes_order: { operation: 'bulk_update_notes_order', requiresAuth: false, rateLimit: 5, sensitive: true },
};

// Rate limiting state (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class AccessController {
  /**
   * Check if an operation is allowed
   */
  checkAccess(operation: string): { allowed: boolean; reason?: string } {
    const control = OPERATION_CONTROLS[operation];
    if (!control) {
      return { allowed: false, reason: `Unknown operation: ${operation}` };
    }

    // For now, all operations are allowed (no auth required)
    // In the future, this could check authentication tokens
    return { allowed: true };
  }

  /**
   * Check rate limiting for an operation
   */
  checkRateLimit(operation: string, clientId: string = 'default'): { allowed: boolean; reason?: string } {
    // Skip rate limiting if disabled in configuration
    if (!configLoader.isRateLimitingEnabled()) {
      return { allowed: true };
    }

    const control = OPERATION_CONTROLS[operation];
    if (!control) {
      return { allowed: false, reason: `Unknown operation: ${operation}` };
    }

    const key = `${clientId}:${operation}`;
    const now = Date.now();
    const windowMs = configLoader.getConfig().security.rateLimitWindowMs;

    const record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    if (record.count >= control.rateLimit) {
      return {
        allowed: false,
        reason: `Rate limit exceeded for ${operation}. Limit: ${control.rateLimit} per minute`
      };
    }

    record.count++;
    return { allowed: true };
  }

  /**
   * Validate input parameters for an operation
   */
  validateInput(operation: string, args: any): ValidationResult {
    const errors: string[] = [];

    switch (operation) {
      case 'create_note':
        if (!args.title || typeof args.title !== 'string' || args.title.trim().length === 0) {
          errors.push('title is required and must be a non-empty string');
        }
        if (!args.content || typeof args.content !== 'string') {
          errors.push('content is required and must be a string');
        }
        if (args.priority !== undefined && (typeof args.priority !== 'number' || args.priority < 0 || args.priority > 5)) {
          errors.push('priority must be a number between 0 and 5');
        }
        if (args.labels && !Array.isArray(args.labels)) {
          errors.push('labels must be an array of strings');
        }
        break;

      case 'get_note':
      case 'delete_note':
      case 'update_note_done':
        if (!args.id || typeof args.id !== 'number' || args.id <= 0) {
          errors.push('id is required and must be a positive number');
        }
        break;

      case 'update_note':
        if (!args.id || typeof args.id !== 'number' || args.id <= 0) {
          errors.push('id is required and must be a positive number');
        }
        // Validate optional fields if provided
        if (args.title !== undefined && (typeof args.title !== 'string' || args.title.trim().length === 0)) {
          errors.push('title must be a non-empty string if provided');
        }
        if (args.content !== undefined && typeof args.content !== 'string') {
          errors.push('content must be a string if provided');
        }
        break;

      case 'search_notes':
        if (!args.query || typeof args.query !== 'string' || args.query.trim().length === 0) {
          errors.push('query is required and must be a non-empty string');
        }
        if (args.limit !== undefined && (typeof args.limit !== 'number' || args.limit <= 0 || args.limit > 100)) {
          errors.push('limit must be a number between 1 and 100 if provided');
        }
        break;

      case 'bulk_delete_notes':
      case 'bulk_update_notes_priority':
      case 'bulk_update_notes_done':
      case 'bulk_update_notes_state':
        if (!args.note_ids || !Array.isArray(args.note_ids) || args.note_ids.length === 0) {
          errors.push('note_ids is required and must be a non-empty array');
        } else {
          // Validate each ID
          for (const id of args.note_ids) {
            if (typeof id !== 'number' || id <= 0) {
              errors.push('all note_ids must be positive numbers');
              break;
            }
          }
          // Limit bulk operations
          if (args.note_ids.length > 50) {
            errors.push('bulk operations limited to 50 items maximum');
          }
        }
        break;

      case 'bulk_update_notes_order':
        if (!args.note_ids || !Array.isArray(args.note_ids) || args.note_ids.length === 0) {
          errors.push('note_ids is required and must be a non-empty array');
        }
        if (!args.orders || !Array.isArray(args.orders)) {
          errors.push('orders is required and must be an array');
        }
        if (args.note_ids && args.orders && args.note_ids.length !== args.orders.length) {
          errors.push('note_ids and orders arrays must have the same length');
        }
        break;

      // Add validation for other operations as needed
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      // Basic sanitization - trim whitespace and limit length
      return data.trim().substring(0, 10000);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return data;
  }
}

// Export singleton instance
export const accessController = new AccessController();