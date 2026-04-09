import { useState, useRef, useMemo } from "react";
import { useAppStore } from "../../stores/useAppStore";

const PLACEHOLDER_RE = /\{([^}]+)\}/g;

function extractPlaceholders(text: string): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER_RE.exec(text)) !== null) {
    if (!matches.includes(m[1])) matches.push(m[1]);
  }
  return matches;
}

interface Props {
  name: string;
}

export function TemplateEditor({ name }: Props) {
  const template = useAppStore((s) => s.templates[name]);
  const saveTemplate = useAppStore((s) => s.saveTemplate);
  const parseTemplate = useAppStore((s) => s.parseTemplate);
  const csvHeaders = useAppStore((s) => s.csvHeaders);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parseError, setParseError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const subject = template?.subject ?? "";
  const body = template?.body ?? "";

  const validPlaceholders = useMemo(() => {
    const set = new Set(csvHeaders.map((h) => h.toUpperCase()));
    set.add("NAME");
    return set;
  }, [csvHeaders]);

  const allPlaceholders = useMemo(
    () => extractPlaceholders(subject + " " + body),
    [subject, body]
  );

  function debouncedSave(s: string, b: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveTemplate(name, { subject: s, body: b });
    }, 500);
  }

  function handleSubjectChange(value: string) {
    useAppStore.setState((state) => ({
      templates: {
        ...state.templates,
        [name]: { subject: value, body },
      },
    }));
    debouncedSave(value, body);
  }

  function handleBodyChange(value: string) {
    useAppStore.setState((state) => ({
      templates: {
        ...state.templates,
        [name]: { subject, body: value },
      },
    }));
    debouncedSave(subject, value);
  }

  async function handleParse() {
    setParseError("");
    try {
      await parseTemplate(name, pasteText);
      setShowPaste(false);
      setPasteText("");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response: { data: { detail: string } } }).response?.data
              ?.detail
          : "Failed to parse template";
      setParseError(msg || "Failed to parse template");
    }
  }

  return (
    <div className="space-y-2">
      {showPaste ? (
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Subject: Your subject here\nBody:\nHello {CONTACT_NAME},\n\nYour message here...\n\nBest,\n{NAME}`}
            className="w-full rounded border border-gray-300 p-2 font-mono text-xs h-40 resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {parseError && (
            <p className="text-xs text-red-600">{parseError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleParse}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Parse
            </button>
            <button
              onClick={() => {
                setShowPaste(false);
                setPasteText("");
                setParseError("");
              }}
              className="rounded px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              placeholder="e.g. Partnership with {COMPANY_NAME}"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder={`Hi {CONTACT_NAME},\n\nI'm {NAME} from...\n\nBest regards,\n{NAME}`}
              className="w-full rounded border border-gray-300 p-2 text-sm h-32 resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {/* Detected placeholder pills */}
          {allPlaceholders.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allPlaceholders.map((p) => {
                const valid = validPlaceholders.has(p);
                return (
                  <span
                    key={p}
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      valid
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {valid ? (
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                        />
                      </svg>
                    )}
                    {`{${p}}`}
                  </span>
                );
              })}
            </div>
          )}
          <button
            onClick={() => setShowPaste(true)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Paste raw template
          </button>
        </>
      )}
    </div>
  );
}
