import { watch, FSWatcher } from 'fs';
import { FileWatchConfig } from '../types';

export class FileWatcher {
  private watchers: FSWatcher[] = [];
  private config: FileWatchConfig;
  private changeCallback?: (path: string) => void;
  private errorCallback?: (error: Error) => void;

  constructor(config: FileWatchConfig) {
    this.config = config;
  }

  onFileChanged(callback: (path: string) => void): void {
    this.changeCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  start(): void {
    this.config.paths.forEach(path => {
      const watcher = watch(path, { recursive: true }, (eventType: string, filename: string | null) => {
        if (filename && eventType === 'change') {
          const fullPath = `${path}/${filename}`;
          if (this.changeCallback) {
            this.changeCallback(fullPath);
          }
        }
      });

      watcher.on('error', (error: Error) => {
        if (this.errorCallback) {
          this.errorCallback(error);
        }
      });

      this.watchers.push(watcher);
    });

    console.log('File watcher started for paths:', this.config.paths);
  }

  stop(): void {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
    console.log('File watcher stopped');
  }

  isWatching(): boolean {
    return this.watchers.length > 0;
  }
}