#!/usr/bin/env node

import { FileWatcher } from './watchers/fileWatcher';
import { ApiValidator } from './validators/apiValidator';
import { DocumentationGenerator } from './generators/docGenerator';
import { MCPServerConfig } from './types';

class MCPServer {
  private config: MCPServerConfig;
  private fileWatcher: FileWatcher;
  private apiValidator: ApiValidator;
  private docGenerator: DocumentationGenerator;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.apiValidator = new ApiValidator(config.projectRoot);
    this.docGenerator = new DocumentationGenerator(config.projectRoot);
    
    this.fileWatcher = new FileWatcher({
      paths: config.watchPaths,
      ignored: ['**/node_modules/**', '**/target/**', '**/dist/**'],
      persistent: true
    });
  }

  start(): void {
    console.log('🚀 Starting Juan Note MCP Server...');
    console.log('📁 Project Root:', this.config.projectRoot);
    console.log('👀 Watching paths:', this.config.watchPaths);

    // Initial validation
    this.runValidation();

    // Set up file watching
    this.fileWatcher.onFileChanged((path: string) => {
      console.log('📝 File changed:', path);
      if (this.config.validateOnChange) {
        this.runValidation();
      }
    });

    this.fileWatcher.onError((error: Error) => {
      console.error('❌ File watcher error:', error);
    });

    this.fileWatcher.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down MCP Server...');
      this.stop();
      process.exit(0);
    });
  }

  stop(): void {
    this.fileWatcher.stop();
    console.log('✅ MCP Server stopped');
  }

  private runValidation(): void {
    console.log('🔍 Running API validation...');
    
    const result = this.apiValidator.validateApis();
    
    if (result.isValid) {
      console.log('✅ All APIs are synchronized');
    } else {
      console.log('⚠️  API issues found:');
      if (result.missingBackend.length > 0) {
        console.log('  Missing backend:', result.missingBackend.join(', '));
      }
      if (result.missingFrontend.length > 0) {
        console.log('  Missing frontend:', result.missingFrontend.join(', '));
      }
      if (result.typeMismatches.length > 0) {
        console.log('  Type mismatches:', result.typeMismatches.length);
      }
    }

    // Generate documentation if enabled
    if (this.config.generateDocs) {
      this.docGenerator.updateAgentsDocumentation(result);
      this.docGenerator.saveReport(result);
    }
  }
}

// Default configuration  
const projectRoot = process.cwd().replace('/mcp-server', ''); // Parent directory
const defaultConfig: MCPServerConfig = {
  projectRoot,
  watchPaths: [
    `${projectRoot}/src/services`,
    `${projectRoot}/src-tauri/src`,
    `${projectRoot}/src/types`
  ],
  outputPath: 'api-validation-report.md',
  validateOnChange: true,
  generateDocs: true
};

// Initialize and start server
const server = new MCPServer(defaultConfig);
server.start();

export { MCPServer };