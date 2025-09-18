import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import type { State, CreateStateRequest } from "../types/note";
import { getColorPalette, isValidHexColor } from "../utils/colorUtils";

interface CreateColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (request: CreateStateRequest) => Promise<State | null>;
  existingStates: State[];
}

// Common column templates
const columnTemplates = [
  { name: "To Do", color: "#3498db" },
  { name: "In Progress", color: "#f39c12" },
  { name: "Review", color: "#9b59b6" },
  { name: "Done", color: "#2ecc71" },
  { name: "Blocked", color: "#e74c3c" },
  { name: "Testing", color: "#1abc9c" },
];

export function CreateColumnModal({
  isOpen,
  onClose,
  onCreate,
  existingStates,
}: CreateColumnModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3498db");
  const [customColor, setCustomColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorPalette = getColorPalette();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setSelectedColor("#3498db");
      setCustomColor("");
      setError(null);
    }
  }, [isOpen]);

  // Handle template selection
  const handleTemplateSelect = (template: (typeof columnTemplates)[0]) => {
    setName(template.name);
    setSelectedColor(template.color);
    setCustomColor("");
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCustomColor(""); // Clear custom color when selecting preset
  };

  // Handle custom color input
  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    if (isValidHexColor(color)) {
      setSelectedColor(color);
    }
  };

  // Check if name already exists
  const nameExists = existingStates.some(
    state => state.name.toLowerCase().trim() === name.toLowerCase().trim()
  );

  // Validate form
  const isFormValid =
    name.trim().length > 0 && name.trim().length <= 50 && !nameExists;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const createRequest: CreateStateRequest = {
        name: name.trim(),
        position: existingStates.length, // Add to end
        color: selectedColor,
      };

      const result = await onCreate(createRequest);
      if (result) {
        onClose();
      } else {
        setError("Failed to create column");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create column");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Column">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-monokai-red/10 border border-[#f92672]/30 rounded-lg p-3">
            <p className="text-monokai-red text-sm">{error}</p>
          </div>
        )}

        {/* Quick Templates */}
        <div>
          <label className="block text-sm font-medium text-monokai-fg mb-3">
            Quick Templates
          </label>
          <div className="grid grid-cols-2 gap-2">
            {columnTemplates.map(template => {
              const templateExists = existingStates.some(
                state =>
                  state.name.toLowerCase() === template.name.toLowerCase()
              );

              return (
                <button
                  key={template.name}
                  type="button"
                  onClick={() =>
                    !templateExists && handleTemplateSelect(template)
                  }
                  disabled={templateExists || isLoading}
                  className={`p-2 text-left rounded-lg border transition-colors ${
                    templateExists
                      ? "border-[#75715e]/20 bg-[#2f2f2a]/30 text-monokai-comment cursor-not-allowed"
                      : "border-[#75715e]/30 hover:border-[#75715e]/50 hover:bg-[#2f2f2a]/30 text-monokai-fg"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: template.color }}
                    />
                    <span className="text-sm">{template.name}</span>
                    {templateExists && (
                      <span className="text-xs text-monokai-comment">
                        (exists)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#75715e]/20 pt-6">
          <p className="text-sm text-monokai-comment mb-4">
            Or create a custom column:
          </p>

          {/* Column Name */}
          <div className="mb-6">
            <label
              htmlFor="columnName"
              className="block text-sm font-medium text-monokai-fg mb-2"
            >
              Column Name *
            </label>
            <input
              type="text"
              id="columnName"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter column name..."
              maxLength={50}
              className={`w-full px-3 py-2 bg-[#2f2f2a] border rounded-lg text-monokai-fg placeholder-monokai-comment focus:outline-none focus:ring-2 focus:ring-[#66d9ef]/50 focus:border-transparent ${
                nameExists ? "border-[#f92672]/50" : "border-[#75715e]/30"
              }`}
              disabled={isLoading}
              required
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                {nameExists && (
                  <p className="text-xs text-monokai-red">
                    A column with this name already exists
                  </p>
                )}
              </div>
              <p className="text-xs text-monokai-comment">
                {name.length}/50 characters
              </p>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-monokai-fg mb-3">
              Column Color
            </label>

            {/* Preset Colors */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {colorPalette.map(({ color, name: colorName }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-full h-10 rounded-lg border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#66d9ef]/50 ${
                    selectedColor === color
                      ? "border-[#66d9ef]/70 ring-2 ring-[#66d9ef]/30"
                      : "border-[#75715e]/30 hover:border-[#75715e]/50"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select ${colorName} color`}
                  disabled={isLoading}
                  title={colorName}
                >
                  {selectedColor === color && (
                    <svg
                      className="w-4 h-4 text-white mx-auto drop-shadow-lg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color Input */}
            <div>
              <label
                htmlFor="customColor"
                className="block text-xs text-monokai-comment mb-2"
              >
                Or enter custom hex color:
              </label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded border border-[#75715e]/30"
                  style={{
                    backgroundColor: isValidHexColor(customColor)
                      ? customColor
                      : selectedColor,
                  }}
                />
                <input
                  type="text"
                  id="customColor"
                  value={customColor}
                  onChange={e => handleCustomColorChange(e.target.value)}
                  placeholder="#3498db"
                  className="flex-1 px-3 py-2 bg-[#2f2f2a] border border-[#75715e]/30 rounded-lg text-monokai-fg placeholder-monokai-comment focus:outline-none focus:ring-2 focus:ring-[#66d9ef]/50 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              {customColor && !isValidHexColor(customColor) && (
                <p className="text-xs text-monokai-red mt-1">
                  Please enter a valid hex color (e.g., #3498db)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-[#75715e]/20">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-monokai-comment hover:text-monokai-fg border border-[#75715e]/30 hover:border-[#75715e]/50 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="px-4 py-2 bg-monokai-green hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>Create Column</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
