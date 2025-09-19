import React, { useRef, useEffect } from "react";

interface SectionTabsProps {
  sections: string[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  onCreateSection: () => void;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({
  sections,
  activeSection,
  onSectionChange,
  onCreateSection,
}) => {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!event.shiftKey) return;

    const currentIndex = sections.indexOf(activeSection);
    let newIndex = currentIndex;

    if (event.key === "ArrowRight") {
      newIndex = (currentIndex + 1) % sections.length;
    } else if (event.key === "ArrowLeft") {
      newIndex = (currentIndex - 1 + sections.length) % sections.length;
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      onSectionChange(sections[newIndex]);
      // Focus the new active tab
      setTimeout(() => {
        tabsRef.current[newIndex]?.focus();
      }, 0);
    }
  };

  // Update focus when active section changes
  useEffect(() => {
    const activeIndex = sections.indexOf(activeSection);
    if (activeIndex >= 0) {
      tabsRef.current[activeIndex]?.focus();
    }
  }, [activeSection, sections]);

  return (
    <div
      className="flex items-center space-x-1 bg-surface-secondary rounded-lg p-1 border border-monokai-comment border-opacity-30"
      role="tablist"
      aria-label="Note sections"
      onKeyDown={handleKeyDown}
    >
      {sections.map((section, index) => (
        <button
          key={section}
          ref={el => {
            tabsRef.current[index] = el;
          }}
          role="tab"
          aria-selected={activeSection === section}
          aria-controls={`section-panel-${section}`}
          id={`section-tab-${section}`}
          tabIndex={activeSection === section ? 0 : -1}
          onClick={() => onSectionChange(section)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:ring-opacity-50
            ${
              activeSection === section
                ? "bg-monokai-blue text-white shadow-sm"
                : "text-monokai-fg hover:bg-surface-tertiary hover:text-monokai-blue"
            }
          `}
        >
          {section === "unset" ? "All Notes" : section}
        </button>
      ))}

      {/* Add section button */}
      <button
        onClick={onCreateSection}
        className="
          px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          bg-surface-tertiary hover:bg-monokai-green hover:text-white
          text-monokai-fg focus:outline-none focus:ring-2 focus:ring-monokai-green focus:ring-opacity-50
          ml-1
        "
        title="Create new section (Cmd+T)"
        aria-label="Create new section"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
};
