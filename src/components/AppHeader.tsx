import React from "react";
import { SectionTabs } from "./SectionTabs";

interface AppHeaderProps {
  viewMode: "list" | "kanban";
  onViewModeChange: (mode: "list" | "kanban") => void;
  onCreateNote: () => void;
  onOpenSettings: () => void;
  loading: boolean;
  sections: string[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  onCreateSection: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onCreateNote,
  onOpenSettings,
  loading,
  sections,
  activeSection,
  onSectionChange,
  onCreateSection,
}) => {
  return (
    <header
      className="bg-surface shadow-lg border-b border-monokai-comment absolute inset-0 h-32 flex items-center"
      role="banner"
    >
      <div className="max-w-4xl mx-auto px-4 w-full">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-surface-secondary bg-opacity-80 rounded-lg flex items-center justify-center border border-monokai-comment border-opacity-30">
              <span className="text-monokai-fg text-xl float-left">📝</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-monokai-fg text-left">
                Juan Notes
              </h1>
              <p className="text-monokai-fg opacity-80 text-sm text-left">
                Organize your thoughts
              </p>
            </div>
          </div>

          {/* Section Tabs */}
          <SectionTabs
            sections={sections}
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            onCreateSection={onCreateSection}
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                onViewModeChange(viewMode === "list" ? "kanban" : "list")
              }
              className="hidden md:flex items-center bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors font-medium shadow-sm text-monokai-fg text-xs"
              title={`Switch to ${viewMode === "list" ? "Kanban" : "List"} view`}
            >
              {viewMode === "list" ? "📊" : "📋"}
            </button>
            <button
              onClick={onCreateNote}
              className="hidden md:flex items-center py-2 bg-surface-secondary text-monokai-blue rounded-lg hover:bg-surface-tertiary transition-colors font-medium shadow-sm"
              disabled={loading}
            >
              <svg
                className="w-5 h-5"
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
            <button
              onClick={onOpenSettings}
              className="hidden md:flex items-center bg-surface-secondary text-monokai-yellow rounded-lg hover:bg-surface-tertiary transition-colors font-medium shadow-sm"
              title="Settings"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
