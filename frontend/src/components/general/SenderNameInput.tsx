import { useRef } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function SenderNameInput() {
  const senderName = useAppStore((s) => s.senderName);
  const setSenderName = useAppStore((s) => s.setSenderName);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleChange(value: string) {
    // Optimistic local update, debounced save
    useAppStore.setState({ senderName: value });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSenderName(value), 500);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Your Name
      </label>
      <input
        type="text"
        value={senderName}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="e.g. John Smith"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <p className="mt-1 text-xs text-gray-500">
        Used as {"{ NAME }"} in templates
      </p>
    </div>
  );
}
