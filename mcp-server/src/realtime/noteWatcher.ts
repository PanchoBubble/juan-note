/**
 * Real-time note watcher for MCP server
 * Monitors note changes and broadcasts updates (future implementation)
 */

import { configLoader } from '../config/configLoader.js';

export interface NoteChange {
  type: 'created' | 'updated' | 'deleted';
  noteId: number;
  timestamp: Date;
  changes?: Record<string, any>;
}

export class NoteWatcher {
  private static instance: NoteWatcher;
  private listeners: Map<string, (change: NoteChange) => void> = new Map();
  private isWatching = false;

  private constructor() {}

  static getInstance(): NoteWatcher {
    if (!NoteWatcher.instance) {
      NoteWatcher.instance = new NoteWatcher();
    }
    return NoteWatcher.instance;
  }

  /**
   * Check if real-time updates are enabled
   */
  isRealTimeEnabled(): boolean {
    return configLoader.isFeatureEnabled('realTimeUpdates');
  }

  /**
   * Register a listener for note changes
   */
  addListener(clientId: string, callback: (change: NoteChange) => void): void {
    if (this.isRealTimeEnabled()) {
      this.listeners.set(clientId, callback);
    }
  }

  /**
   * Remove a listener
   */
  removeListener(clientId: string): void {
    this.listeners.delete(clientId);
  }

  /**
   * Broadcast a note change to all listeners
   */
  broadcastChange(change: NoteChange): void {
    if (!this.isRealTimeEnabled()) {
      return;
    }

    for (const [clientId, callback] of this.listeners) {
      try {
        callback(change);
      } catch (error) {
        console.error(`Error notifying client ${clientId}:`, error);
        // Remove faulty listeners
        this.listeners.delete(clientId);
      }
    }
  }

  /**
   * Start watching for changes (placeholder for future implementation)
   */
  startWatching(): void {
    if (this.isRealTimeEnabled() && !this.isWatching) {
      this.isWatching = true;
      console.log('NoteWatcher: Started watching for real-time changes');

      // TODO: Implement actual change detection
      // This could involve:
      // - WebSocket connection to Juan Note
      // - Polling the database for changes
      // - File system watching for database changes
      // - Integration with Juan Note's change events
    }
  }

  /**
   * Stop watching for changes
   */
  stopWatching(): void {
    if (this.isWatching) {
      this.isWatching = false;
      console.log('NoteWatcher: Stopped watching for changes');
      this.listeners.clear();
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    enabled: boolean;
    watching: boolean;
    listeners: number;
  } {
    return {
      enabled: this.isRealTimeEnabled(),
      watching: this.isWatching,
      listeners: this.listeners.size
    };
  }
}

// Export singleton instance
export const noteWatcher = NoteWatcher.getInstance();