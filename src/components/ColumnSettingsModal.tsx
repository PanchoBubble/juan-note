import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import type { State, UpdateStateRequest } from "../types/note";
import { getColorPalette, isValidHexColor } from "../utils/colorUtils";

interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: UpdateStateRequest) => Promise<State | null>;
  state?: State;
  title?: string;
}

export function ColumnSettingsModal({
  isOpen,
  onClose,
  onSave,
  state,
  title = "Edit Column",
}: ColumnSettingsModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorPalette = getColorPalette();

  // Initialize form when modal opens or state changes
  useEffect(() => {
    if (isOpen && state) {
      setName(state.name || "");
      setSelectedColor(state.color || "");
      setCustomColor("");
      setError(null);
    }
  }, [isOpen, state]);

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

  // Validate form
  const isFormValid = name.trim().length > 0 && name.trim().length <= 50;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !state?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const updateRequest: UpdateStateRequest = {
        id: state.id,
        name: name.trim(),
        color: selectedColor || undefined,
      };

      const result = await onSave(updateRequest);
      if (result) {
        onClose();
      } else {
        setError("Failed to save column settings");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save column settings"
      );
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
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-monokai-red/10 border border-[#f92672]/30 rounded-lg p-3">
            <p className="text-monokai-red text-sm">{error}</p>
          </div>
        )}

        {/* Column Name */}
        <div>
          <label
            htmlFor="columnName"
            className="block text-sm font-medium text-monokai-fg mb-2"
          >
            Column Name
          </label>
          <input
            type="text"
            id="columnName"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter column name..."
            maxLength={50}
            className="w-full px-3 py-2 bg-[#2f2f2a] border border-[#75715e]/30 rounded-lg text-monokai-fg placeholder-monokai-comment focus:outline-none focus:ring-2 focus:ring-[#66d9ef]/50 focus:border-transparent"
            disabled={isLoading}
            required
          />
          <p className="text-xs text-monokai-comment mt-1">
            {name.length}/50 characters
          </p>
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
                className={`w-full h-10 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#66d9ef]/50 ${
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
                    : "#333",
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
            className="px-4 py-2 bg-monokai-blue hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
