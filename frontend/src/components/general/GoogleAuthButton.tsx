import { useEffect, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";
import axios from "axios";

function SetupGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Gmail App Password Setup
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">
            You need a Gmail App Password so this app can send emails through
            your account. It takes about 1 minute:
          </p>

          <ol className="list-decimal list-outside ml-4 space-y-3">
            <li>
              Make sure{" "}
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                2-Step Verification
              </a>{" "}
              is enabled on your Google account (required for app passwords).
            </li>
            <li>
              Go to{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                myaccount.google.com/apppasswords
              </a>
              .
            </li>
            <li>
              Enter an app name (e.g. <em>"Auto Mailer"</em>) and click{" "}
              <strong>Create</strong>.
            </li>
            <li>
              Copy the <strong>16-character password</strong> that appears.
            </li>
            <li>
              Paste it into the <strong>App Password</strong> field below along
              with your Gmail address, then click <strong>Connect</strong>.
            </li>
          </ol>

          <div className="rounded bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <strong>Note:</strong> App passwords require 2-Step Verification to
            be enabled. If you don't see the App Passwords page, enable 2-Step
            Verification first from your{" "}
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google security settings
            </a>
            .
          </div>
        </div>

        <div className="border-t px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function GoogleAuthButton() {
  const authStatus = useAppStore((s) => s.authStatus);
  const loadAuthStatus = useAppStore((s) => s.loadAuthStatus);
  const saveGmailConfig = useAppStore((s) => s.saveGmailConfig);
  const disconnectGoogle = useAppStore((s) => s.disconnectGoogle);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadAuthStatus();
  }, [loadAuthStatus]);

  async function handleConnect() {
    if (!email.trim() || !appPassword.trim()) {
      setError("Both email and app password are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveGmailConfig(email.trim(), appPassword.trim());
      setEmail("");
      setAppPassword("");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to save Gmail config.");
      }
    } finally {
      setSaving(false);
    }
  }

  // Connected
  if (authStatus.connected) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gmail Account
        </label>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-700 truncate">
            {authStatus.email}
          </span>
        </div>
        <button
          onClick={disconnectGoogle}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Not connected — show setup form
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Gmail Account
        </label>
        <button
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-300 hover:text-gray-700"
          title="How to get an app password"
        >
          ?
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        Enter your Gmail and{" "}
        <button
          onClick={() => setShowGuide(true)}
          className="text-blue-600 hover:underline"
        >
          app password
        </button>{" "}
        to send emails.
      </p>
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Gmail address"
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <input
          type="password"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
          placeholder="App password"
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleConnect}
          disabled={saving}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Connect"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {showGuide && <SetupGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
