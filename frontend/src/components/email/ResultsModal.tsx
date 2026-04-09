import { useAppStore } from "../../stores/useAppStore";

export function ResultsModal() {
  const sendResults = useAppStore((s) => s.sendResults);
  const setShowResultsModal = useAppStore((s) => s.setShowResultsModal);
  const retryEmails = useAppStore((s) => s.retryEmails);
  const isSending = useAppStore((s) => s.isSending);

  const sent = sendResults.filter((r) => r.status === "sent");
  const failed = sendResults.filter((r) => r.status === "failed");

  function handleRetryAll() {
    retryEmails(failed.map((r) => r.contact_index));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Send Results
          </h2>
          <button
            onClick={() => setShowResultsModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Summary */}
        <div className="flex gap-4 px-6 py-3 border-b bg-gray-50">
          <span className="text-sm">
            <span className="font-medium text-green-600">{sent.length}</span>{" "}
            sent
          </span>
          <span className="text-sm">
            <span className="font-medium text-red-600">{failed.length}</span>{" "}
            failed
          </span>
          <span className="text-sm text-gray-500">
            {sendResults.length} total
          </span>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-auto">
          {sendResults.map((r) => (
            <div
              key={r.contact_index}
              className="flex items-center gap-3 border-b px-6 py-3 text-sm"
            >
              {r.status === "sent" ? (
                <span className="text-green-500 text-lg">&#10003;</span>
              ) : (
                <span className="text-red-500 text-lg">&#10007;</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {r.contact_name} &lt;{r.to}&gt;
                </div>
                {r.error && (
                  <div className="text-xs text-red-500 truncate">
                    {r.error}
                  </div>
                )}
              </div>
              {r.status === "failed" && (
                <button
                  onClick={() => retryEmails([r.contact_index])}
                  disabled={isSending}
                  className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                >
                  Retry
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          {failed.length > 0 && (
            <button
              onClick={handleRetryAll}
              disabled={isSending}
              className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {isSending ? "Retrying..." : `Retry All Failed (${failed.length})`}
            </button>
          )}
          <button
            onClick={() => setShowResultsModal(false)}
            className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
