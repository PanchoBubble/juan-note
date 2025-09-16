import { useState } from "react";
import { Modal } from "./Modal";
import { NoteService } from "../services/noteService";

interface McpConfigResult {
  provider: string;
  config_path: string;
  mcp_servers: any[];
  error?: string;
}

interface McpIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function McpIntegrationModal({
  isOpen,
  onClose,
}: McpIntegrationModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<McpConfigResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const handleRequestPermission = () => {
    setHasPermission(true);
  };

  const handleScanConfigs = async () => {
    if (!hasPermission) return;

    setIsScanning(true);
    setError(null);
    setResults([]);

    try {
      const response = await NoteService.scanMcpConfigs();
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error || "Failed to scan MCP configurations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsScanning(false);
    }
  };

  const handleIntegrate = (result: McpConfigResult) => {
    // TODO: Integrate with mcp-server configuration
    console.log("Integrating MCP config:", result);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MCP Integration" size="lg">
      <div className="space-y-6">
        {!hasPermission ? (
          <div className="text-center space-y-4">
            <div className="text-monokai-yellow text-lg font-medium">
              🔐 Permission Required
            </div>
            <p className="text-monokai-fg">
              This feature needs access to your config files to discover MCP
              server configurations.
            </p>
            <p className="text-monokai-comment text-sm">
              We'll scan{" "}
              <code className="bg-monokai-bg px-1 py-0.5 rounded">
                ~/.config
              </code>{" "}
              and <code className="bg-monokai-bg px-1 py-0.5 rounded">~/</code>{" "}
              for config files from opencode, gemini, claude, and amp.
            </p>
            <button
              onClick={handleRequestPermission}
              className="px-6 py-3 bg-monokai-blue text-monokai-bg rounded-lg hover:bg-monokai-blue-hover transition-colors font-medium"
            >
              Grant Access
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <button
                onClick={handleScanConfigs}
                disabled={isScanning}
                className="px-6 py-3 bg-monokai-green text-monokai-bg rounded-lg hover:bg-monokai-green-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isScanning ? "🔍 Scanning..." : "🔍 Scan for MCP Configs"}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-monokai-pink bg-opacity-20 border border-monokai-pink border-opacity-30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-monokai-pink">❌</span>
                  <span className="text-monokai-pink">{error}</span>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-monokai-fg">
                  Found MCP Configurations
                </h3>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-surface-secondary rounded-lg border border-monokai-comment border-opacity-30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-monokai-green">✅</span>
                        <span className="font-medium text-monokai-fg capitalize">
                          {result.provider}
                        </span>
                        <code className="text-monokai-comment text-sm">
                          {result.config_path}
                        </code>
                      </div>
                      <button
                        onClick={() => handleIntegrate(result)}
                        className="px-4 py-2 bg-monokai-blue text-monokai-bg rounded hover:bg-monokai-blue-hover transition-colors text-sm font-medium"
                      >
                        Integrate
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-monokai-comment">
                        Found {result.mcp_servers.length} MCP server
                        {result.mcp_servers.length !== 1 ? "s" : ""}:
                      </div>
                      <div className="space-y-1">
                        {result.mcp_servers.map(
                          (server: any, serverIndex: number) => (
                            <div
                              key={serverIndex}
                              className="text-xs bg-monokai-bg px-2 py-1 rounded font-mono text-monokai-fg"
                            >
                              {server.name}: {server.command}{" "}
                              {server.args?.join(" ") || ""}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && !isScanning && !error && hasPermission && (
              <div className="text-center py-8">
                <div className="text-monokai-comment">
                  No MCP configurations found. Make sure you have config files
                  from supported providers.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
