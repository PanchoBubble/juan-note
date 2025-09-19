import { useState, useEffect } from "react";

export const useSections = () => {
  const [sections, setSections] = useState<string[]>(["unset"]);
  const [activeSection, setActiveSection] = useState<string>("unset");

  // Load active section from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("juan-note-active-section");
    if (saved && sections.includes(saved)) {
      setActiveSection(saved);
    }
  }, [sections]);

  // Save active section to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("juan-note-active-section", activeSection);
  }, [activeSection]);

  const addSection = (sectionName: string) => {
    if (!sections.includes(sectionName)) {
      setSections(prev => [...prev, sectionName]);
    }
  };

  const removeSection = (sectionName: string) => {
    if (sectionName !== "unset") {
      setSections(prev => prev.filter(s => s !== sectionName));
      if (activeSection === sectionName) {
        setActiveSection("unset");
      }
    }
  };

  const renameSection = (oldName: string, newName: string) => {
    if (oldName !== "unset" && !sections.includes(newName)) {
      setSections(prev => prev.map(s => (s === oldName ? newName : s)));
      if (activeSection === oldName) {
        setActiveSection(newName);
      }
    }
  };

  return {
    sections,
    activeSection,
    setActiveSection,
    addSection,
    removeSection,
    renameSection,
  };
};
