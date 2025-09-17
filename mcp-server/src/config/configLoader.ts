/**
 * Configuration loader for Juan Note MCP server
 * Supports environment-specific settings and deployment configurations
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface McpConfig {
  projectRoot: string;
  watchPaths: string[];
  outputPath: string;
  validateOnChange: boolean;
  generateDocs: boolean;
  ignored: string[];
  deployment: {
    environments: {
      [key: string]: {
        juanNoteHost: string;
        juanNotePort: number;
        security: {
          rateLimitingEnabled: boolean;
          strictValidation: boolean;
        };
      };
    };
    currentEnvironment: string;
  };
  security: {
    maxBulkOperationSize: number;
    rateLimitWindowMs: number;
    enableAccessLogging: boolean;
    allowedOrigins: string[];
  };
  features: {
    streamingResponses: boolean;
    realTimeUpdates: boolean;
    caching: boolean;
  };
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: McpConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  private loadConfig(): McpConfig {
    try {
      const configPath = join(__dirname, '../../config/mcp-config.json');
      const configData = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);

      // Validate required fields
      this.validateConfig(config);

      return config;
    } catch (error) {
      console.error('Failed to load MCP configuration:', error);
      // Return default configuration
      return this.getDefaultConfig();
    }
  }

  private validateConfig(config: any): void {
    const requiredFields = ['projectRoot', 'watchPaths', 'deployment'];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing required configuration field: ${field}`);
      }
    }

    // Validate environment exists
    const env = config.deployment?.currentEnvironment;
    if (!config.deployment?.environments?.[env]) {
      throw new Error(`Invalid environment: ${env}`);
    }
  }

  private getDefaultConfig(): McpConfig {
    return {
      projectRoot: process.cwd().replace('/mcp-server', ''),
      watchPaths: ['src/services', 'src-tauri/src', 'src/types'],
      outputPath: 'api-validation-report.md',
      validateOnChange: true,
      generateDocs: true,
      ignored: ['**/node_modules/**', '**/target/**', '**/dist/**', '**/.git/**', '**/notes.db*'],
      deployment: {
        environments: {
          development: {
            juanNoteHost: 'localhost',
            juanNotePort: 1420,
            security: {
              rateLimitingEnabled: false,
              strictValidation: false
            }
          }
        },
        currentEnvironment: 'development'
      },
      security: {
        maxBulkOperationSize: 50,
        rateLimitWindowMs: 60000,
        enableAccessLogging: false,
        allowedOrigins: ['localhost']
      },
      features: {
        streamingResponses: false,
        realTimeUpdates: false,
        caching: false
      }
    };
  }

  getConfig(): McpConfig {
    return this.config;
  }

  getCurrentEnvironment() {
    const env = this.config.deployment.currentEnvironment;
    return this.config.deployment.environments[env];
  }

  isRateLimitingEnabled(): boolean {
    return this.getCurrentEnvironment().security.rateLimitingEnabled;
  }

  isStrictValidationEnabled(): boolean {
    return this.getCurrentEnvironment().security.strictValidation;
  }

  getJuanNoteHost(): string {
    return this.getCurrentEnvironment().juanNoteHost;
  }

  getJuanNotePort(): number {
    return this.getCurrentEnvironment().juanNotePort;
  }

  getMaxBulkOperationSize(): number {
    return this.config.security.maxBulkOperationSize;
  }

  isFeatureEnabled(feature: keyof McpConfig['features']): boolean {
    return this.config.features[feature];
  }

  // Environment variable overrides
  private getEnvOverride(key: string, defaultValue: any): any {
    const envValue = process.env[key];
    if (envValue !== undefined) {
      // Simple type conversion
      if (typeof defaultValue === 'number') {
        return parseInt(envValue, 10);
      }
      if (typeof defaultValue === 'boolean') {
        return envValue.toLowerCase() === 'true';
      }
      return envValue;
    }
    return defaultValue;
  }
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance();