import { useEffect, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function ResultsModal() {
  const sendResults = useAppStore((s) => s.sendResults);
  const sendLog = useAppStore((s) => s.sendLog);
  const setShowResultsModal = useAppStore((s) => s.setShowResultsModal);
  const retryEmails = useAppStore((s) => s.retryEmails);
  const fetchSendLog = useAppStore((s) => s.fetchSendLog);
  const isSending = useAppStore((s) => s.isSending);
  const [showLog, setShowLog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const sent = sendResults.filter((r) => r.status === "sent");
  const failed = sendResults.filter((r) => r.status === "failed");
  const allSuccess = failed.length === 0;

  useEffect(() => {
    fetchSendLog();
  }, [fetchSendLog]);

  function handleRetryAll() {
    retryEmails(failed.map((r) => r.contact_index));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Success / Recap Header */}
        <div className={`px-6 py-8 text-center ${allSuccess ? "bg-green-50" : "bg-orange-50"}`}>
          <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${allSuccess ? "bg-green-100" : "bg-orange-100"}`}>
            <span className={`text-3xl ${allSuccess ? "text-green-600" : "text-orange-600"}`}>
              {allSuccess ? "\u2713" : "!"}
            </span>
          </div>
          <h2 className={`text-xl font-semibold ${allSuccess ? "text-green-800" : "text-orange-800"}`}>
            {allSuccess ? "All Emails Sent" : "Sending Complete"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {sendResults.length} email{sendResults.length !== 1 ? "s" : ""} processed
          </p>

          {/* Stats */}
          <div className="mt-4 flex justify-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sent.length}</div>
              <div className="text-xs text-gray-500">Sent</div>
            </div>
            {failed.length > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failed.length}</div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{sendResults.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>

        {/* Toggle bar */}
        <div className="flex items-center gap-4 border-b px-6 py-2">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>
          <button
            onClick={() => setShowLog((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {showLog ? "Hide log" : "Debug log"}
          </button>
        </div>

        {/* Debug log */}
        {showLog && (
          <div className="max-h-40 overflow-auto border-b bg-gray-900 px-4 py-3 font-mono text-xs">
            {sendLog.length === 0 && (
              <p className="text-gray-500">No log entries.</p>
            )}
            {sendLog.map((entry, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-gray-500">{entry.time}</span>{" "}
                <span
                  className={
                    entry.level === "error"
                      ? "text-red-400"
                      : entry.level === "warning"
                        ? "text-yellow-400"
                        : "text-green-400"
                  }
                >
                  {entry.level.toUpperCase()}
                </span>{" "}
                <span className="text-gray-200">{entry.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Detailed results list */}
        {showDetails && (
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
        )}

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
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
