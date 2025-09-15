import { readFileSync } from 'fs';
import { ApiEndpoint, ApiValidationResult, TypeMismatch } from '../types';

export class ApiValidator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  validateApis(): ApiValidationResult {
    const frontendEndpoints = this.extractFrontendEndpoints();
    const backendEndpoints = this.extractBackendEndpoints();

    const missingFrontend: string[] = [];
    const missingBackend: string[] = [];
    const typeMismatches: TypeMismatch[] = [];
    const inconsistencies: string[] = [];

    // Check for missing backend implementations
    frontendEndpoints.forEach(fe => {
      const matching = backendEndpoints.find(be => 
        this.normalizeCommandName(fe.name) === this.normalizeCommandName(be.name)
      );
      if (!matching) {
        missingBackend.push(fe.name);
      }
    });

    // Check for missing frontend implementations
    backendEndpoints.forEach(be => {
      const matching = frontendEndpoints.find(fe => 
        this.normalizeCommandName(fe.name) === this.normalizeCommandName(be.name)
      );
      if (!matching) {
        missingFrontend.push(be.name);
      }
    });

    // Check for type mismatches (simplified check)
    frontendEndpoints.forEach(fe => {
      const matching = backendEndpoints.find(be => 
        this.normalizeCommandName(fe.name) === this.normalizeCommandName(be.name)
      );
      if (matching && fe.requestType !== matching.requestType) {
        typeMismatches.push({
          endpoint: fe.name,
          frontend: fe.requestType || 'unknown',
          backend: matching.requestType || 'unknown',
          field: 'requestType'
        });
      }
    });

    const isValid = missingFrontend.length === 0 && 
                   missingBackend.length === 0 && 
                   typeMismatches.length === 0 && 
                   inconsistencies.length === 0;

    return {
      isValid,
      missingFrontend,
      missingBackend,
      typeMismatches,
      inconsistencies
    };
  }

  private extractFrontendEndpoints(): ApiEndpoint[] {
    const serviceFile = `${this.projectRoot}/src/services/noteService.ts`;
    try {
      const content = readFileSync(serviceFile, 'utf-8');
      const endpoints: ApiEndpoint[] = [];
      
      // Simple regex to extract method names and invoke calls
      const methodRegex = /static async (\w+)\([^)]*\).*?invoke\(['"`](\w+)['"`]/gs;
      let match;
      let lineNumber = 1;

      while ((match = methodRegex.exec(content)) !== null) {
        endpoints.push({
          name: match[2], // tauri command name
          frontendMethod: match[1], // frontend method name
          file: serviceFile,
          line: lineNumber
        });
        lineNumber++;
      }

      return endpoints;
    } catch (error) {
      console.error('Error reading frontend service file:', error);
      return [];
    }
  }

  private extractBackendEndpoints(): ApiEndpoint[] {
    const commandsFile = `${this.projectRoot}/src-tauri/src/commands.rs`;
    try {
      const content = readFileSync(commandsFile, 'utf-8');
      const endpoints: ApiEndpoint[] = [];
      
      // Simple regex to extract tauri commands
      const commandRegex = /#\[tauri::command\]\s*pub fn (\w+)/g;
      let match;
      let lineNumber = 1;

      while ((match = commandRegex.exec(content)) !== null) {
        endpoints.push({
          name: match[1],
          tauriCommand: match[1],
          file: commandsFile,
          line: lineNumber
        });
        lineNumber++;
      }

      return endpoints;
    } catch (error) {
      console.error('Error reading backend commands file:', error);
      return [];
    }
  }

  private normalizeCommandName(name: string): string {
    // Convert between camelCase and snake_case
    return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
}