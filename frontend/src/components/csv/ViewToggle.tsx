import { useAppStore } from "../../stores/useAppStore";

export function ViewToggle() {
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);

  return (
    <div className="flex border-b">
      <button
        onClick={() => setViewMode("table")}
        className={`px-4 py-2 text-sm font-medium transition ${
          viewMode === "table"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Table View
      </button>
      <button
        onClick={() => setViewMode("text")}
        className={`px-4 py-2 text-sm font-medium transition ${
          viewMode === "text"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Text View
      </button>
    </div>
  );
}
