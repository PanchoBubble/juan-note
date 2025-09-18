// Color utility functions for consistent styling across Kanban and list views

export interface PriorityColor {
  bg: string;
  border: string;
  text: string;
  accent: string;
}

// Priority color mappings using Monokai theme colors
export const priorityColors: Record<number, PriorityColor> = {
  1: {
    // Low priority
    bg: "bg-monokai-green bg-opacity-10",
    border: "border-monokai-green border-opacity-30",
    text: "text-monokai-green",
    accent: "ring-monokai-green",
  },
  2: {
    // Medium priority
    bg: "bg-monokai-yellow bg-opacity-10",
    border: "border-monokai-yellow border-opacity-30",
    text: "text-monokai-yellow",
    accent: "ring-monokai-yellow",
  },
  3: {
    // High priority
    bg: "bg-monokai-red bg-opacity-10",
    border: "border-monokai-red border-opacity-30",
    text: "text-monokai-red",
    accent: "ring-monokai-red",
  },
};

// Default column colors for states
export const defaultColumnColors = [
  "#3498db", // Blue
  "#e74c3c", // Red
  "#2ecc71", // Green
  "#f39c12", // Orange
  "#9b59b6", // Purple
  "#1abc9c", // Turquoise
  "#e67e22", // Carrot
  "#95a5a6", // Silver
];

// Get priority color classes for a note
export function getPriorityColor(priority: number): PriorityColor {
  return priorityColors[priority] || priorityColors[1]; // Default to low priority
}

// Get column color class for a state
export function getColumnColorClass(color?: string): string {
  if (!color) {
    return "bg-surface-secondary border-monokai border-opacity-20";
  }

  // If it's a CSS custom property, use it directly
  if (color.startsWith("--")) {
    return `bg-[var(${color})] border-[var(${color})] border-opacity-30`;
  }

  // If it's a hex color, apply it
  return `bg-[${color}] bg-opacity-10 border-[${color}] border-opacity-30`;
}

// Validate hex color format
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Get a suitable text color based on background color
export function getTextColorForBackground(bgColor: string): string {
  // Simple contrast calculation - for more complex cases, use a proper contrast library
  if (!bgColor.startsWith("#")) {
    return "text-monokai-fg"; // Default text color
  }

  const hex = bgColor.slice(1);
  const rgb =
    hex.length === 3
      ? hex.split("").map(c => parseInt(c + c, 16))
      : [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(c =>
          parseInt(c, 16)
        );

  // Calculate luminance
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;

  return luminance > 0.5 ? "text-gray-900" : "text-white";
}

// Get predefined color palette for column creation
export function getColorPalette(): Array<{ color: string; name: string }> {
  return [
    { color: "#3498db", name: "Blue" },
    { color: "#e74c3c", name: "Red" },
    { color: "#2ecc71", name: "Green" },
    { color: "#f39c12", name: "Orange" },
    { color: "#9b59b6", name: "Purple" },
    { color: "#1abc9c", name: "Turquoise" },
    { color: "#e67e22", name: "Carrot" },
    { color: "#95a5a6", name: "Silver" },
  ];
}
