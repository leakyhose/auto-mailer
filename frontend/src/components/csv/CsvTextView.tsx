import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function CsvTextView() {
  const csvRawText = useAppStore((s) => s.csvRawText);
  const updateCsvText = useAppStore((s) => s.updateCsvText);
  const [localText, setLocalText] = useState(csvRawText);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from store when external updates arrive (e.g. initial load)
  useEffect(() => {
    setLocalText(csvRawText);
  }, [csvRawText]);

  const debouncedSave = useCallback(
    (text: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          setError("");
          await updateCsvText(text);
        } catch (e: unknown) {
          const msg =
            e && typeof e === "object" && "response" in e
              ? (e as { response: { data: { detail: string } } }).response?.data
                  ?.detail
              : "Failed to parse CSV";
          setError(msg || "Failed to parse CSV");
        }
      }, 800);
    },
    [updateCsvText]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setLocalText(text);
    debouncedSave(text);
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <textarea
        value={localText}
        onChange={handleChange}
        placeholder={"Paste your CSV here\n\nRequired columns: COMPANY_NAME, CONTACT_NAME, EMAIL, POSITION, TEMPLATE"}
        className="h-full w-full resize-none font-mono text-sm p-3 border-0 focus:outline-none"
        spellCheck={false}
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      />
      {error && (
        <p className="px-3 py-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
