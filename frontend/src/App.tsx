import { useEffect } from "react";
import { useAppStore } from "./stores/useAppStore";
import { LeftPanel } from "./components/layout/LeftPanel";
import { CenterPanel } from "./components/layout/CenterPanel";
import { RightPanel } from "./components/layout/RightPanel";
import { ActionBar } from "./components/email/ActionBar";
import { PreviewModal } from "./components/email/PreviewModal";
import { ResultsModal } from "./components/email/ResultsModal";

function App() {
  const loadSettings = useAppStore((s) => s.loadSettings);
  const loadContacts = useAppStore((s) => s.loadContacts);
  const loadTemplates = useAppStore((s) => s.loadTemplates);
  const showPreviewModal = useAppStore((s) => s.showPreviewModal);
  const showResultsModal = useAppStore((s) => s.showResultsModal);

  useEffect(() => {
    loadSettings();
    loadContacts();
    loadTemplates();
  }, [loadSettings, loadContacts, loadTemplates]);

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b px-6 py-3">
        <h1 className="text-lg font-bold text-gray-900">Auto Mailer</h1>
      </header>

      {/* 3-column layout */}
      <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>

      {/* Bottom action bar */}
      <ActionBar />

      {/* Modals */}
      {showPreviewModal && <PreviewModal />}
      {showResultsModal && <ResultsModal />}
    </div>
  );
}

export default App;
