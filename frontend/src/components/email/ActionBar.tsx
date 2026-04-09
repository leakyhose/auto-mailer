import { useAppStore } from "../../stores/useAppStore";

export function ActionBar() {
  const contacts = useAppStore((s) => s.contacts);
  const previewEmails = useAppStore((s) => s.previewEmails);
  const isPreviewing = useAppStore((s) => s.isPreviewing);
  const authStatus = useAppStore((s) => s.authStatus);

  const hasContacts = contacts.length > 0;
  const isConnected = authStatus.connected;

  return (
    <div className="flex items-center justify-between border-t bg-white px-6 py-3">
      <div className="text-sm text-gray-500">
        {hasContacts
          ? `${contacts.length} contact(s) loaded`
          : "No contacts loaded"}
      </div>
      <div className="flex gap-3">
        <button
          onClick={previewEmails}
          disabled={!hasContacts || isPreviewing}
          className="rounded border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPreviewing ? "Loading..." : "Preview Emails"}
        </button>
        <button
          onClick={previewEmails}
          disabled={!hasContacts || !isConnected}
          className="rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          title={!isConnected ? "Connect Google account first" : ""}
        >
          Send All
        </button>
      </div>
    </div>
  );
}
