import { useAppStore } from "../../stores/useAppStore";
import { CsvUploader } from "../csv/CsvUploader";
import { CsvTableView } from "../csv/CsvTableView";
import { CsvTextView } from "../csv/CsvTextView";
import { ViewToggle } from "../csv/ViewToggle";

export function CenterPanel() {
  const contacts = useAppStore((s) => s.contacts);
  const viewMode = useAppStore((s) => s.viewMode);

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col overflow-hidden">
        <div className="flex items-center border-b px-4 py-2">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            CSV Contacts
          </h2>
        </div>
        <CsvUploader />
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          CSV Contacts
        </h2>
        <CsvUploader />
      </div>
      <ViewToggle />
      <div className="flex-1 overflow-auto">
        {viewMode === "table" ? <CsvTableView /> : <CsvTextView />}
      </div>
    </div>
  );
}
