export interface ApiEndpoint {
  name: string;
  frontendMethod?: string;
  tauriCommand?: string;
  requestType?: string;
  responseType?: string;
  file: string;
  line: number;
}

export interface ApiValidationResult {
  isValid: boolean;
  missingFrontend: string[];
  missingBackend: string[];
  typeMismatches: TypeMismatch[];
  inconsistencies: string[];
}

export interface TypeMismatch {
  endpoint: string;
  frontend: string;
  backend: string;
  field: string;
}

export interface FileWatchConfig {
  paths: string[];
  ignored: string[];
  persistent: boolean;
}

export interface MCPServerConfig {
  projectRoot: string;
  watchPaths: string[];
  outputPath: string;
  validateOnChange: boolean;
  generateDocs: boolean;
}