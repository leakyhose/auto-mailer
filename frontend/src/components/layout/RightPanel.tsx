import { TemplateList } from "../templates/TemplateList";

export function RightPanel() {
  return (
    <div className="flex flex-col border-l overflow-auto">
      <div className="px-4 py-2 border-b">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Templates
        </h2>
      </div>
      <TemplateList />
    </div>
  );
}
