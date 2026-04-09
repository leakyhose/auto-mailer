import { useEffect, useRef } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function AttachmentManager() {
  const attachments = useAppStore((s) => s.attachments);
  const loadAttachments = useAppStore((s) => s.loadAttachments);
  const uploadAttachments = useAppStore((s) => s.uploadAttachments);
  const deleteAttachment = useAppStore((s) => s.deleteAttachment);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      uploadAttachments(e.target.files);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Attachments
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Attached to all outgoing emails
      </p>

      {attachments.length > 0 && (
        <ul className="mb-2 space-y-1">
          {attachments.map((a) => (
            <li
              key={a.filename}
              className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-sm"
            >
              <span className="truncate mr-2">
                {a.filename}{" "}
                <span className="text-gray-400">({formatSize(a.size)})</span>
              </span>
              <button
                onClick={() => deleteAttachment(a.filename)}
                className="shrink-0 text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"
      >
        + Add Files
      </button>
    </div>
  );
}
