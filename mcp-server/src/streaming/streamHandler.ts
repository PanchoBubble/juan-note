/**
 * Streaming response handler for MCP server
 * Provides progress updates for long-running operations
 */

import { configLoader } from '../config/configLoader.js';

export interface StreamChunk {
  type: 'progress' | 'result' | 'error';
  data: any;
  progress?: number;
  message?: string;
}

export class StreamHandler {
  private static instance: StreamHandler;
  private activeStreams: Map<string, (chunk: StreamChunk) => void> = new Map();

  private constructor() {}

  static getInstance(): StreamHandler {
    if (!StreamHandler.instance) {
      StreamHandler.instance = new StreamHandler();
    }
    return StreamHandler.instance;
  }

  /**
   * Check if streaming is enabled
   */
  isStreamingEnabled(): boolean {
    return configLoader.isFeatureEnabled('streamingResponses');
  }

  /**
   * Register a stream callback for an operation
   */
  registerStream(operationId: string, callback: (chunk: StreamChunk) => void): void {
    if (this.isStreamingEnabled()) {
      this.activeStreams.set(operationId, callback);
    }
  }

  /**
   * Unregister a stream callback
   */
  unregisterStream(operationId: string): void {
    this.activeStreams.delete(operationId);
  }

  /**
   * Send a progress update
   */
  sendProgress(operationId: string, progress: number, message?: string): void {
    const callback = this.activeStreams.get(operationId);
    if (callback) {
      callback({
        type: 'progress',
        data: { progress },
        progress,
        message
      });
    }
  }

  /**
   * Send a result
   */
  sendResult(operationId: string, data: any): void {
    const callback = this.activeStreams.get(operationId);
    if (callback) {
      callback({
        type: 'result',
        data
      });
    }
    this.unregisterStream(operationId);
  }

  /**
   * Send an error
   */
  sendError(operationId: string, error: string): void {
    const callback = this.activeStreams.get(operationId);
    if (callback) {
      callback({
        type: 'error',
        data: { error },
        message: error
      });
    }
    this.unregisterStream(operationId);
  }

  /**
   * Execute an operation with streaming support
   */
  async executeWithStreaming<T>(
    operationId: string,
    operation: () => Promise<T>,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<T> {
    if (!this.isStreamingEnabled()) {
      return operation();
    }

    // Register progress callback if provided
    if (onProgress) {
      this.registerStream(operationId, (chunk) => {
        if (chunk.type === 'progress') {
          onProgress(chunk.progress || 0, chunk.message);
        }
      });
    }

    try {
      this.sendProgress(operationId, 0, 'Starting operation...');
      const result = await operation();
      this.sendProgress(operationId, 100, 'Operation completed');
      this.sendResult(operationId, result);
      return result;
    } catch (error) {
      this.sendError(operationId, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Create a streaming version of bulk operations
   */
  async executeBulkOperation<T>(
    operationId: string,
    items: any[],
    processItem: (item: any, index: number) => Promise<any>,
    resultAggregator: (results: any[]) => T
  ): Promise<T> {
    if (!this.isStreamingEnabled()) {
      const results = await Promise.all(items.map(processItem));
      return resultAggregator(results);
    }

    const results: any[] = [];
    const totalItems = items.length;

    this.sendProgress(operationId, 0, `Processing ${totalItems} items...`);

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await processItem(items[i], i);
        results.push(result);

        const progress = Math.round(((i + 1) / totalItems) * 100);
        this.sendProgress(operationId, progress, `Processed ${i + 1}/${totalItems} items`);
      } catch (error) {
        this.sendError(operationId, `Failed to process item ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }

    const finalResult = resultAggregator(results);
    this.sendResult(operationId, finalResult);
    return finalResult;
  }
}

// Export singleton instance
export const streamHandler = StreamHandler.getInstance();