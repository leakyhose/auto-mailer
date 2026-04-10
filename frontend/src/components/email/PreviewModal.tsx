import { useAppStore } from "../../stores/useAppStore";

export function PreviewModal() {
  const previews = useAppStore((s) => s.previews);
  const setShowPreviewModal = useAppStore((s) => s.setShowPreviewModal);
  const sendEmails = useAppStore((s) => s.sendEmails);
  const isSending = useAppStore((s) => s.isSending);

  const missingTemplates = previews.filter((p) =>
    p.subject.startsWith("[MISSING TEMPLATE:")
  );
  const validPreviews = previews.filter(
    (p) => !p.subject.startsWith("[MISSING TEMPLATE:")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Email Preview ({previews.length} emails)
          </h2>
          <button
            onClick={() => setShowPreviewModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Warnings */}
        {missingTemplates.length > 0 && (
          <div className="mx-6 mt-4 rounded bg-orange-50 border border-orange-200 px-4 py-2 text-sm text-orange-700">
            {missingTemplates.length} contact(s) have missing templates and will
            fail to send.
          </div>
        )}

        {/* Previews list */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {previews.map((p) => (
            <div
              key={p.contact_index}
              className={`rounded border p-4 ${
                p.subject.startsWith("[MISSING TEMPLATE:")
                  ? "border-orange-300 bg-orange-50"
                  : "border-gray-200"
              }`}
            >
              <div className="mb-2 flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-700">To:</span>
                <span>
                  {p.contact_name} &lt;{p.to}&gt;
                </span>
                <span className="ml-auto rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {p.template_name}
                </span>
              </div>
              <div className="mb-2 text-sm">
                <span className="font-medium text-gray-700">Subject:</span>{" "}
                {p.subject}
              </div>
              <div
                className="rounded bg-gray-50 p-3 text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: p.body_html }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <span className="text-sm text-gray-500">
            {validPreviews.length} ready to send
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={sendEmails}
              disabled={isSending || validPreviews.length === 0}
              className="rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSending ? "Sending..." : `Send ${validPreviews.length} Emails`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
