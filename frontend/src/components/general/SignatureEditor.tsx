import { useRef, useCallback, useEffect, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function SignatureEditor() {
  const signature = useAppStore((s) => s.signature);
  const saveSignature = useAppStore((s) => s.saveSignature);
  const editorRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSetRef = useRef<string>("");

  // Link tooltip state
  const [linkPopup, setLinkPopup] = useState<{
    url: string;
    top: number;
    left: number;
    anchor: HTMLAnchorElement;
  } | null>(null);

  // Sync from store whenever signature changes externally (e.g. initial load)
  useEffect(() => {
    if (editorRef.current && signature !== lastSetRef.current) {
      editorRef.current.innerHTML = signature;
      lastSetRef.current = signature;
    }
  }, [signature]);

  const debouncedSave = useCallback(
    (html: string) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => saveSignature(html), 800);
    },
    [saveSignature]
  );

  function handleInput() {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastSetRef.current = html;
      debouncedSave(html);
    }
  }

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }

  function handleLink() {
    const sel = window.getSelection();
    // If cursor is inside an existing link, pre-fill the URL
    const existingAnchor = sel?.anchorNode
      ? (sel.anchorNode.nodeType === 1
          ? (sel.anchorNode as HTMLElement)
          : sel.anchorNode.parentElement
        )?.closest("a")
      : null;

    const url = prompt("Enter URL:", existingAnchor?.href ?? "https://");
    if (url) {
      exec("createLink", url);
    }
    setLinkPopup(null);
  }

  function handleUnlink() {
    if (linkPopup) {
      // Select the anchor text so unlink works
      const range = document.createRange();
      range.selectNodeContents(linkPopup.anchor);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    exec("unlink");
    setLinkPopup(null);
  }

  function handleEditorClick(e: React.MouseEvent) {
    const target = (e.target as HTMLElement).closest("a");
    if (target && editorRef.current?.contains(target)) {
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      const editorRect = editorRef.current!.getBoundingClientRect();
      setLinkPopup({
        url: (target as HTMLAnchorElement).href,
        top: rect.bottom - editorRect.top + 4,
        left: rect.left - editorRect.left,
        anchor: target as HTMLAnchorElement,
      });
    } else {
      setLinkPopup(null);
    }
  }

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (linkPopup && !(e.target as HTMLElement).closest("[data-link-popup]")) {
        setLinkPopup(null);
      }
    }
    if (linkPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [linkPopup]);

  return (
    <div className="flex flex-col h-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Signature
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Automatically appended to all emails.
      </p>
      {/* Toolbar */}
      <div className="flex gap-0.5 border border-b-0 border-gray-300 rounded-t bg-gray-50 px-1 py-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
          className="rounded px-2 py-0.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
          className="rounded px-2 py-0.5 text-xs italic text-gray-700 hover:bg-gray-200"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("underline")}
          className="rounded px-2 py-0.5 text-xs underline text-gray-700 hover:bg-gray-200"
          title="Underline"
        >
          U
        </button>
        <div className="mx-1 w-px bg-gray-300" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-gray-200"
          title="Insert Link"
        >
          Link
        </button>
      </div>
      {/* Editable area */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onClick={handleEditorClick}
          className="signature-editor flex-1 min-h-[200px] overflow-auto rounded-b border border-gray-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ lineHeight: 1.5 }}
        />
        {/* Gmail-style link popup */}
        {linkPopup && (
          <div
            data-link-popup
            className="absolute z-10 flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1.5 shadow-lg text-xs"
            style={{ top: linkPopup.top, left: linkPopup.left }}
          >
            <a
              href={linkPopup.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline max-w-[180px] truncate"
            >
              {linkPopup.url}
            </a>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleLink}
              className="text-gray-600 hover:text-gray-900"
              title="Change URL"
            >
              Edit
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUnlink}
              className="text-gray-600 hover:text-red-600"
              title="Remove link"
            >
              Remove
            </button>
          </div>
        )}
      </div>
      {/* Styles for links inside the editor */}
      <style>{`
        .signature-editor a {
          color: #2563eb;
          text-decoration: underline;
          cursor: text;
        }
      `}</style>
    </div>
  );
}
