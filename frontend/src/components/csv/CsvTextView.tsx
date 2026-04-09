import { useState } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function CsvTextView() {
  const csvRawText = useAppStore((s) => s.csvRawText);
  const updateCsvText = useAppStore((s) => s.updateCsvText);
  const [localText, setLocalText] = useState(csvRawText);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isDirty = localText !== csvRawText;

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await updateCsvText(localText);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response: { data: { detail: string } } }).response?.data
              ?.detail
          : "Failed to parse CSV";
      setError(msg || "Failed to parse CSV");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        className="flex-1 resize-none font-mono text-sm p-3 border-0 focus:outline-none"
        spellCheck={false}
      />
      {error && (
        <p className="px-3 py-1 text-sm text-red-600">{error}</p>
      )}
      {isDirty && (
        <div className="flex items-center justify-end gap-2 border-t bg-gray-50 px-3 py-2">
          <button
            onClick={() => setLocalText(csvRawText)}
            className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
          >
            Revert
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
