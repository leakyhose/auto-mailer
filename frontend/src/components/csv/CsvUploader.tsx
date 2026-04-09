import { useRef, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function CsvUploader() {
  const uploadCsv = useAppStore((s) => s.uploadCsv);
  const updateCsvText = useAppStore((s) => s.updateCsvText);
  const contacts = useAppStore((s) => s.contacts);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    try {
      await uploadCsv(file);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response: { data: { detail: string } } }).response?.data
              ?.detail
          : "Failed to upload CSV";
      setError(msg || "Failed to upload CSV");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text");
    if (!text.trim()) return;
    setError("");
    try {
      await updateCsvText(text);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail: string } } }).response?.data
              ?.detail
          : "Failed to parse pasted CSV";
      setError(msg || "Failed to parse pasted CSV");
    }
  }

  // Compact re-upload button when contacts are already loaded
  if (contacts.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Re-upload CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  // Full drop zone when no contacts
  return (
    <div className="flex h-full items-center justify-center">
      {/* tabIndex makes the div focusable so onPaste fires */}
      <div
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`flex w-full max-w-md flex-col items-center rounded-lg border-2 border-dashed p-10 transition outline-none ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <svg
          className="mb-3 h-10 w-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mb-2 text-sm text-gray-600">
          Drag & drop or paste your CSV here
        </p>
        <p className="mb-3 text-xs text-gray-400">or</p>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Browse Files
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
        />
        <p className="mt-3 text-xs text-gray-400">
          Required columns: COMPANY_NAME, CONTACT_NAME, EMAIL, POSITION,
          TEMPLATE
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
