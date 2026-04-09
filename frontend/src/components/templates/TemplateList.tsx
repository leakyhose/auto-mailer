import { useState } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { TemplateEditor } from "./TemplateEditor";

export function TemplateList() {
  const templateNames = useAppStore((s) => s.templateNames);
  const templates = useAppStore((s) => s.templates);
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());

  function toggleExpanded(name: string) {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  if (templateNames.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Upload a CSV to see templates here.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {templateNames.map((name) => {
        const isExpanded = expandedSet.has(name);
        const hasContent = templates[name]?.subject || templates[name]?.body;
        return (
          <div key={name} className="border-b border-gray-100">
            <button
              onClick={() => toggleExpanded(name)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`transform transition ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                >
                  &#9654;
                </span>
                <span className="font-medium">{name}</span>
              </span>
              {hasContent ? (
                <span className="h-2 w-2 rounded-full bg-green-400" />
              ) : (
                <span className="text-xs text-orange-500">needs template</span>
              )}
            </button>
            {isExpanded && (
              <div className="px-3 pb-3">
                <TemplateEditor name={name} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
