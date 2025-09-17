import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { NoteService } from "../services/noteService";
import type { McpFunction } from "../types/note";

interface McpFunctionBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function McpFunctionBrowserModal({
  isOpen,
  onClose,
}: McpFunctionBrowserModalProps) {
  const [functions, setFunctions] = useState<McpFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFunction, setSelectedFunction] = useState<McpFunction | null>(
    null
  );
  const [filterProvider, setFilterProvider] = useState<string>("all");

  useEffect(() => {
    if (isOpen) {
      loadFunctions();
    }
  }, [isOpen]);

  const loadFunctions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await NoteService.queryMcpFunctions();
      if (response.success && response.data) {
        setFunctions(response.data);
      } else {
        setError(response.error || "Failed to load MCP functions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredFunctions = functions.filter(func => {
    const matchesSearch =
      func.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      func.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      func.server_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider =
      filterProvider === "all" || func.server_provider === filterProvider;

    return matchesSearch && matchesProvider;
  });

  const providers = Array.from(new Set(functions.map(f => f.server_provider)));

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      "juan-note": "bg-monokai-blue bg-opacity-20 text-monokai-blue",
    };
    return (
      colors[provider] ||
      "bg-monokai-comment bg-opacity-20 text-monokai-comment"
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Juan Note MCP Functions"
      size="xl"
    >
      <div className="space-y-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search functions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-monokai-comment border-opacity-30 rounded-lg bg-surface-secondary text-monokai-fg placeholder-monokai-comment focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterProvider}
              onChange={e => setFilterProvider(e.target.value)}
              className="w-full px-3 py-2 border border-monokai-comment border-opacity-30 rounded-lg bg-surface-secondary text-monokai-fg focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:border-transparent"
            >
              <option value="all">All Providers</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-monokai-comment">Loading MCP functions...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-monokai-pink bg-opacity-20 border border-monokai-pink border-opacity-30 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-monokai-pink">❌</span>
              <span className="text-monokai-pink">{error}</span>
            </div>
          </div>
        )}

        {/* Function List and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Function List */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-monokai-fg">
              Juan Note MCP Functions ({filteredFunctions.length})
            </h3>
            <p className="text-sm text-monokai-comment">
              These functions provide API validation and monitoring capabilities
              for the Juan Note application.
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredFunctions.map((func, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedFunction(func)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFunction?.name === func.name
                      ? "border-monokai-blue bg-monokai-blue bg-opacity-10"
                      : "border-monokai-comment border-opacity-30 bg-surface-secondary hover:bg-surface-tertiary"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-monokai-fg">{func.name}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderColor(func.server_provider)}`}
                    >
                      {func.server_provider}
                    </span>
                  </div>
                  <div className="text-sm text-monokai-comment mb-2">
                    {func.description || "No description available"}
                  </div>
                  <div className="text-xs text-monokai-comment">
                    Server: {func.server_name} • {func.parameters.length}{" "}
                    parameter{func.parameters.length !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
              {filteredFunctions.length === 0 && !loading && (
                <div className="text-center py-8 text-monokai-comment">
                  No functions found matching your criteria
                </div>
              )}
            </div>
          </div>

          {/* Function Details */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-monokai-fg">
              Function Details
            </h3>
            {selectedFunction ? (
              <div className="p-4 bg-surface-secondary rounded-lg border border-monokai-comment border-opacity-30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-monokai-fg">
                    {selectedFunction.name}
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getProviderColor(selectedFunction.server_provider)}`}
                  >
                    {selectedFunction.server_provider}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-monokai-comment mb-2">
                    Description
                  </div>
                  <div className="text-monokai-fg">
                    {selectedFunction.description || "No description available"}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-monokai-comment mb-2">
                    Server
                  </div>
                  <div className="text-monokai-fg">
                    {selectedFunction.server_name}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-monokai-comment mb-3">
                    Parameters ({selectedFunction.parameters.length})
                  </div>
                  {selectedFunction.parameters.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFunction.parameters.map((param, index) => (
                        <div
                          key={index}
                          className="p-3 bg-monokai-bg rounded border border-monokai-comment border-opacity-20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-monokai-fg">
                              {param.name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs px-2 py-1 bg-monokai-blue bg-opacity-20 text-monokai-blue rounded">
                                {param.type}
                              </span>
                              {param.required && (
                                <span className="text-xs px-2 py-1 bg-monokai-pink bg-opacity-20 text-monokai-pink rounded">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                          {param.description && (
                            <div className="text-sm text-monokai-comment">
                              {param.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-monokai-comment italic">
                      No parameters required
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-monokai-comment bg-surface-secondary rounded-lg border border-monokai-comment border-opacity-30">
                Select a function to view its details
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-monokai-comment border-opacity-30">
          <button
            onClick={loadFunctions}
            disabled={loading}
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
    </Modal>
  );
}
