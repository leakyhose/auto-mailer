import { useAppStore } from "../../stores/useAppStore";
import { GoogleAuthButton } from "../general/GoogleAuthButton";
import { CustomTagsEditor } from "../general/CustomTagsEditor";
import { AttachmentManager } from "../general/AttachmentManager";

export function Sidebar() {
  const csvHeaders = useAppStore((s) => s.csvHeaders);
  const customTags = useAppStore((s) => s.customTags);
  const contacts = useAppStore((s) => s.contacts);

  return (
    <div className="flex w-[280px] shrink-0 flex-col border-r bg-gray-50/50">
      {/* Placeholder reference + contact count */}
      {(csvHeaders.length > 0 || Object.keys(customTags).length > 0) && (
        <div className="border-b px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">
              Available Placeholders
            </p>
            <span className="text-[10px] text-gray-400">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {csvHeaders
              .filter((h) => h.toUpperCase() !== "TEMPLATE")
              .map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                >
                  {`{${h.toUpperCase()}}`}
                </span>
              ))}
            {Object.keys(customTags).map((k) => (
              <span
                key={k}
                className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700"
              >
                {`{${k}}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <GoogleAuthButton />
        <CustomTagsEditor />
        <AttachmentManager />
      </div>
    </div>
  );
}
