import { useEffect } from "react";
import { useAppStore } from "./stores/useAppStore";
import { Sidebar } from "./components/layout/Sidebar";
import { MainContent } from "./components/layout/MainContent";
import { ActionBar } from "./components/email/ActionBar";
import { PreviewModal } from "./components/email/PreviewModal";
import { SendingModal } from "./components/email/SendingModal";
import { ResultsModal } from "./components/email/ResultsModal";

function App() {
  const loadSettings = useAppStore((s) => s.loadSettings);
  const loadContacts = useAppStore((s) => s.loadContacts);
  const loadTemplates = useAppStore((s) => s.loadTemplates);
  const showPreviewModal = useAppStore((s) => s.showPreviewModal);
  const showSendingModal = useAppStore((s) => s.showSendingModal);
  const showResultsModal = useAppStore((s) => s.showResultsModal);
  const saveStatus = useAppStore((s) => s.saveStatus);

  useEffect(() => {
    loadSettings();
    loadContacts();
    loadTemplates();
  }, [loadSettings, loadContacts, loadTemplates]);

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-lg font-bold text-gray-900">Auto Mailer</h1>
        {saveStatus && (
          <span className="text-xs text-gray-400 italic">
            {saveStatus === "saving" ? "Saving..." : "Saved"}
          </span>
        )}
      </header>

      {/* 2-column layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>

      {/* Bottom action bar */}
      <ActionBar />

      {/* Modals */}
      {showPreviewModal && <PreviewModal />}
      {showSendingModal && <SendingModal />}
      {showResultsModal && <ResultsModal />}
    </div>
  );
}

export default App;
