import { useState, useRef, useCallback } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function CustomTagsEditor() {
  const customTags = useAppStore((s) => s.customTags);
  const saveCustomTags = useAppStore((s) => s.saveCustomTags);
  const csvHeaders = useAppStore((s) => s.csvHeaders);

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debouncedSave = useCallback(
    (tags: Record<string, string>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => saveCustomTags(tags), 500);
    },
    [saveCustomTags]
  );

  function handleAdd() {
    setError("");
    const key = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!key) {
      setError("Tag name cannot be empty");
      return;
    }
    if (key in customTags) {
      setError(`Tag {${key}} already exists`);
      return;
    }
    if (csvHeaders.map((h) => h.toUpperCase()).includes(key)) {
      setError(`{${key}} is already a CSV column`);
      return;
    }
    const updated = { ...customTags, [key]: newValue };
    saveCustomTags(updated);
    setNewKey("");
    setNewValue("");
  }

  function handleValueChange(key: string, value: string) {
    const updated = { ...customTags, [key]: value };
    useAppStore.setState({ customTags: updated });
    debouncedSave(updated);
  }

  function handleDelete(key: string) {
    const updated = { ...customTags };
    delete updated[key];
    saveCustomTags(updated);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  const entries = Object.entries(customTags);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Custom Tags
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Define personal placeholders to use in templates.
      </p>

      {/* Existing tags */}
      {entries.length > 0 && (
        <div className="space-y-2 mb-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                {`{${key}}`}
              </span>
              <input
                type="text"
                value={value}
                onChange={(e) => handleValueChange(key, e.target.value)}
                className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => handleDelete(key)}
                className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title="Remove tag"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new tag */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={newKey}
          onChange={(e) => { setNewKey(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          placeholder="Tag name"
          className="w-20 shrink-0 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Value"
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
