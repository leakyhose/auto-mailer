import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function SendingModal() {
  const progress = useAppStore((s) => s.sendProgress);
  const sendLog = useAppStore((s) => s.sendLog);
  const cancelSend = useAppStore((s) => s.cancelSend);
  const pollSendStatus = useAppStore((s) => s.pollSendStatus);
  const [showLog, setShowLog] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const completed = progress.sent + progress.failed;
  const pct = progress.total > 0 ? Math.round((completed / progress.total) * 100) : 0;

  // Auto-scroll log to bottom
  useEffect(() => {
    if (showLog && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sendLog, showLog]);

  // Re-trigger polling when tab becomes visible (recovers from sleep/suspension)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && progress.active) {
        pollSendStatus();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [progress.active, pollSendStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sending Emails
        </h2>

        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: progress.failed > 0
                ? "linear-gradient(90deg, #22c55e, #f97316)"
                : "#22c55e",
            }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-600">
            {completed} / {progress.total}
          </span>
          <span className="text-gray-500">{pct}%</span>
        </div>

        <div className="flex gap-4 mb-4 text-sm">
          <span>
            <span className="font-medium text-green-600">{progress.sent}</span> sent
          </span>
          {progress.failed > 0 && (
            <span>
              <span className="font-medium text-red-600">{progress.failed}</span> failed
            </span>
          )}
        </div>

        {/* Current email */}
        {progress.currentEmail && (
          <p className="text-xs text-gray-400 truncate mb-4">
            Sending to {progress.currentEmail}...
          </p>
        )}

        {/* Log toggle */}
        <button
          onClick={() => setShowLog((v) => !v)}
          className="mb-3 text-xs text-gray-400 hover:text-gray-600 underline"
        >
          {showLog ? "Hide log" : "Show debug log"}
        </button>

        {/* Log panel */}
        {showLog && (
          <div className="mb-4 max-h-48 overflow-auto rounded border bg-gray-900 p-3 font-mono text-xs">
            {sendLog.length === 0 && (
              <p className="text-gray-500">No log entries yet...</p>
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
            <div ref={logEndRef} />
          </div>
        )}

        {/* Cancel button */}
        <div className="flex justify-end">
          <button
            onClick={cancelSend}
            className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
