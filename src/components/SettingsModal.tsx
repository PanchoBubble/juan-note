import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { NoteService } from "../services/noteService";
import { McpFunctionBrowserModal } from "./McpFunctionBrowserModal";

interface McpConfigResult {
  provider: string;
  config_path: string;
  mcp_servers: any[];
  error?: string;
  has_juan_note?: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState("mcp");
  const [mcpConfigs, setMcpConfigs] = useState<McpConfigResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFunctionBrowser, setShowFunctionBrowser] = useState(false);

  useEffect(() => {
    if (isOpen && activeSection === "mcp") {
      scanMcpConfigs();
    }
  }, [isOpen, activeSection]);

  const scanMcpConfigs = async () => {
    setLoading(true);
    try {
      const response = await NoteService.scanMcpConfigs();
      if (response.success && response.data) {
        // Check which configs have Juan Note MCP
        const configsWithStatus = response.data.map(config => ({
          ...config,
          has_juan_note: config.mcp_servers.some(
            (server: any) =>
              server.name === "juan-note-api" ||
              server.name === "juan-note-mcp-server"
          ),
        }));
        setMcpConfigs(configsWithStatus);
      }
    } catch (error) {
      console.error("Failed to scan MCP configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMcp = async () => {
    try {
      const response = await NoteService.addJuanNoteMcpServer();
      if (response.success && response.data) {
        const successful = response.data.filter(r =>
          r.error?.includes("Successfully added")
        );
        const failed = response.data.filter(
          r => !r.error?.includes("Successfully added")
        );

        if (successful.length > 0) {
          alert(
            `Juan Note MCP server added to ${successful.length} config file(s) successfully!`
          );
        }
        if (failed.length > 0) {
          alert(
            `Failed to add to ${failed.length} config file(s). Check console for details.`
          );
        }
      } else {
        alert(`Failed to add Juan Note MCP server: ${response.error}`);
      }
    } catch (error) {
      console.error("Failed to add Juan Note MCP server:", error);
      alert("Failed to add Juan Note MCP server");
    }
    // Refresh the list
    await scanMcpConfigs();
  };

  const handleRemoveMcp = async () => {
    try {
      const response = await NoteService.removeJuanNoteMcpServer();
      if (response.success && response.data) {
        const successful = response.data.filter(r =>
          r.error?.includes("Successfully removed")
        );
        const failed = response.data.filter(
          r => !r.error?.includes("Successfully removed")
        );

        if (successful.length > 0) {
          alert(
            `Juan Note MCP server removed from ${successful.length} config file(s) successfully!`
          );
        }
        if (failed.length > 0) {
          alert(
            `Failed to remove from ${failed.length} config file(s). Check console for details.`
          );
        }
      } else {
        alert(`Failed to remove Juan Note MCP server: ${response.error}`);
      }
    } catch (error) {
      console.error("Failed to remove Juan Note MCP server:", error);
      alert("Failed to remove Juan Note MCP server");
    }
    // Refresh the list
    await scanMcpConfigs();
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      claude: "🤖",
      opencode: "💻",
      gemini: "🧠",
      amp: "⚡",
      continue: "🔄",
      cline: "📝",
    };
    return icons[provider] || "🔧";
  };

  const renderMcpSection = () => (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 p-4 bg-surface-secondary rounded-lg border border-monokai-comment border-opacity-30">
        <button
          onClick={handleAddMcp}
          className="px-4 py-2 bg-monokai-green text-monokai-bg rounded-lg hover:bg-monokai-green-hover transition-colors font-medium"
        >
          ➕ Add MCP
        </button>
        <button
          onClick={handleRemoveMcp}
          className="px-4 py-2 bg-monokai-pink text-monokai-bg rounded-lg hover:bg-monokai-pink-hover transition-colors font-medium"
        >
          ➖ Remove MCP
        </button>
        <button
          onClick={scanMcpConfigs}
          disabled={loading}
          className="px-4 py-2 bg-monokai-blue text-monokai-bg rounded-lg hover:bg-monokai-blue-hover disabled:opacity-50 transition-colors font-medium"
        >
          🔄 Refresh
        </button>
        <button
          onClick={() => setShowFunctionBrowser(true)}
          className="px-4 py-2 bg-monokai-cyan text-monokai-bg rounded-lg hover:bg-monokai-cyan-hover transition-colors font-medium"
        >
          📋 Juan Note Functions
        </button>
      </div>

      {/* Config Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-monokai-fg">
          MCP Configuration Status
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-monokai-comment">
              Scanning MCP configurations...
            </div>
          </div>
        ) : mcpConfigs.length === 0 ? (
          <div className="text-center py-8 text-monokai-comment">
            No MCP client configurations found
          </div>
        ) : (
          <div className="space-y-3">
            {mcpConfigs.map((config, index) => (
              <div
                key={index}
                className="p-4 bg-surface-secondary rounded-lg border border-monokai-comment border-opacity-30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getProviderIcon(config.provider)}
                    </span>
                    <div>
                      <div className="font-medium text-monokai-fg capitalize">
                        {config.provider}
                      </div>
                      <div className="text-sm text-monokai-comment">
                        {config.config_path}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {config.has_juan_note ? (
                      <span className="px-3 py-1 bg-monokai-green bg-opacity-20 text-monokai-green rounded-full text-sm font-medium">
                        ✅ Juan Note MCP
                      </span>
                    ) : config.mcp_servers.length > 0 ? (
                      <span className="px-3 py-1 bg-monokai-yellow bg-opacity-20 text-monokai-yellow rounded-full text-sm font-medium">
                        ⚠️ No Juan Note MCP
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-monokai-comment bg-opacity-20 text-monokai-comment rounded-full text-sm">
                        📁 No MCP servers
                      </span>
                    )}
                  </div>
                </div>
                {config.error && (
                  <div className="mt-2 text-sm text-monokai-pink">
                    Error: {config.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Settings"
        size="fullscreen"
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-surface-secondary border-r border-monokai-comment border-opacity-30 p-6">
            <h2 className="text-lg font-semibold text-monokai-fg mb-6">
              Settings
            </h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("mcp")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeSection === "mcp"
                    ? "bg-monokai-blue bg-opacity-20 text-monokai-blue"
                    : "text-monokai-fg hover:bg-surface-tertiary"
                }`}
              >
                🔗 MCP Integration
              </button>
              {/* Future sections can be added here */}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === "mcp" && renderMcpSection()}
          </div>
        </div>
      </Modal>

      <McpFunctionBrowserModal
        isOpen={showFunctionBrowser}
        onClose={() => setShowFunctionBrowser(false)}
      />
    </>
  );
}
