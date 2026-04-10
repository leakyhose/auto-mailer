import { useEffect } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { TemplateEditor } from "../templates/TemplateEditor";
import { SignatureEditor } from "../general/SignatureEditor";
import { CsvTableView } from "../csv/CsvTableView";
import { CsvTextView } from "../csv/CsvTextView";
import { ViewToggle } from "../csv/ViewToggle";

const SIGNATURE_TAB = "__signature__";
const CONTACTS_TAB = "__contacts__";

export function MainContent() {
  const templateNames = useAppStore((s) => s.templateNames);
  const templates = useAppStore((s) => s.templates);
  const activeEditorTab = useAppStore((s) => s.activeEditorTab);
  const setActiveEditorTab = useAppStore((s) => s.setActiveEditorTab);
  const viewMode = useAppStore((s) => s.viewMode);

  // Auto-select first template when templates change and current selection is invalid
  useEffect(() => {
    if (
      activeEditorTab === SIGNATURE_TAB ||
      activeEditorTab === CONTACTS_TAB
    )
      return;
    if (templateNames.length > 0 && !templateNames.includes(activeEditorTab)) {
      setActiveEditorTab(templateNames[0]);
    }
  }, [templateNames, activeEditorTab, setActiveEditorTab]);

  const isSignature = activeEditorTab === SIGNATURE_TAB;
  const isContacts = activeEditorTab === CONTACTS_TAB;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b overflow-x-auto">
        {/* Contacts tab */}
        <button
          onClick={() => setActiveEditorTab(CONTACTS_TAB)}
          className={`flex shrink-0 items-center gap-1 px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
            isContacts
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Contacts
        </button>
        {/* Separator */}
        <div className="mx-1 h-5 w-px shrink-0 bg-gray-300" />
        {/* Template tabs */}
        {templateNames.map((name) => {
          const isActive = activeEditorTab === name;
          const hasContent = templates[name]?.subject || templates[name]?.body;
          return (
            <button
              key={name}
              onClick={() => setActiveEditorTab(name)}
              className={`flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                isActive
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {name}
              {hasContent ? (
                <span className="h-2 w-2 rounded-full bg-green-400" />
              ) : (
                <span className="text-[10px] text-orange-500">!</span>
              )}
            </button>
          );
        })}
        {/* Separator */}
        <div className="mx-1 h-5 w-px shrink-0 bg-gray-300" />
        {/* Signature tab */}
        <button
          onClick={() => setActiveEditorTab(SIGNATURE_TAB)}
          className={`flex shrink-0 items-center gap-1 px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
            isSignature
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Signature
        </button>
      </div>

      {/* Content area */}
      {isContacts ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <ViewToggle />
          <div className="flex-1 overflow-auto min-h-0">
            {viewMode === "table" ? <CsvTableView /> : <CsvTextView />}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto min-h-0 p-4">
          {isSignature ? (
            <SignatureEditor />
          ) : activeEditorTab && templateNames.includes(activeEditorTab) ? (
            <TemplateEditor name={activeEditorTab} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Add contacts with a TEMPLATE column to start editing.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
