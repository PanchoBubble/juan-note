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
  onOpenFunctionBrowser?: () => void;
}

export function McpIntegrationModal({
  isOpen,
  onClose,
  onOpenFunctionBrowser,
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

  const handleAddJuanNoteMcp = async (result: McpConfigResult) => {
    try {
      setIsScanning(true);
      const response = await NoteService.addJuanNoteMcpServer(
        result.config_path
      );
      if (response.success) {
        // Refresh the scan results
        await handleScanConfigs();
        alert("Juan Note MCP server added successfully!");
      } else {
        alert(`Failed to add Juan Note MCP server: ${response.error}`);
      }
    } catch (error) {
      alert(`Error adding Juan Note MCP server: ${error}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyMcpConfig = async () => {
    try {
      const config = await NoteService.getMcpServerConfig();
      await navigator.clipboard.writeText(config);
      alert("MCP server configuration copied to clipboard!");
    } catch (error) {
      alert(`Failed to copy config: ${error}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Juan Note MCP to CLI LLMs"
      size="lg"
    >
      <div className="space-y-6">
        {!hasPermission ? (
          <div className="text-center space-y-4">
            <div className="text-monokai-yellow text-lg font-medium">
              🔐 Permission Required
            </div>
            <p className="text-monokai-fg">
              This feature needs access to your config files to add the Juan
              Note MCP server to your CLI LLM configurations.
            </p>
            <p className="text-monokai-comment text-sm">
              We'll scan{" "}
              <code className="bg-monokai-bg px-1 py-0.5 rounded">
                ~/.config
              </code>{" "}
              and <code className="bg-monokai-bg px-1 py-0.5 rounded">~/</code>{" "}
              for config files (including{" "}
              <code className="bg-monokai-bg px-1 py-0.5 rounded">
                settings.json
              </code>
              ) from Claude, OpenCode, Gemini, AMP, and other MCP clients.
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
                {isScanning
                  ? "🔍 Scanning ~/.config, ~/, and app directories..."
                  : "🔍 Scan for MCP Configs"}
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
                  Configuration Scan Results
                </h3>
                <div className="text-sm text-monokai-comment mb-4">
                  Found {results.length} MCP client configuration file
                  {results.length !== 1 ? "s" : ""} (
                  {results.filter(r => r.mcp_servers.length > 0).length} with
                  existing MCP servers). Click "Add Juan Note MCP" to integrate
                  the Juan Note API validation server.
                </div>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-surface-secondary rounded-lg border border-monokai-comment border-opacity-30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {result.mcp_servers.length > 0 ? (
                          <span className="text-monokai-green">✅</span>
                        ) : result.error ? (
                          <span className="text-monokai-pink">❌</span>
                        ) : (
                          <span className="text-monokai-yellow">⚠️</span>
                        )}
                        <span className="font-medium text-monokai-fg capitalize">
                          {result.provider}
                        </span>
                        <code className="text-monokai-comment text-sm">
                          {result.config_path}
                        </code>
                      </div>
                      {result.mcp_servers.length > 0 && (
                        <button
                          onClick={() => handleAddJuanNoteMcp(result)}
                          disabled={isScanning}
                          className="px-4 py-2 bg-monokai-green text-monokai-bg rounded hover:bg-monokai-green-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          {isScanning ? "Adding..." : "Add Juan Note MCP"}
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {result.error ? (
                        <div className="text-sm text-monokai-pink">
                          Error: {result.error}
                        </div>
                      ) : result.mcp_servers.length > 0 ? (
                        <>
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
                        </>
                      ) : (
                        <div className="text-sm text-monokai-comment">
                          File found but no MCP servers detected
                        </div>
                      )}
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

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-monokai-comment border-opacity-30">
          <div className="flex space-x-3">
            <button
              onClick={handleCopyMcpConfig}
              className="px-4 py-2 bg-monokai-green text-monokai-bg rounded-lg hover:bg-monokai-green-hover transition-colors"
            >
              📋 Copy MCP Config
            </button>
            {onOpenFunctionBrowser && (
              <button
                onClick={onOpenFunctionBrowser}
                className="px-4 py-2 bg-monokai-cyan text-monokai-bg rounded-lg hover:bg-monokai-blue transition-colors"
              >
                🔍 Browse Functions
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleScanConfigs}
              disabled={isScanning}
              className="px-4 py-2 text-monokai-blue hover:bg-monokai-blue hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
            >
              🔄 Refresh
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-monokai-comment hover:bg-monokai-comment-hover text-monokai-bg rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
