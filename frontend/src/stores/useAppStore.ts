import { create } from "zustand";
import api from "../api/client";
import type {
  Contact,
  TemplateContent,
  AttachmentInfo,
  EmailPreview,
  SendResult,
  AuthStatus,
} from "../types";

export interface SendLogEntry {
  time: string;
  level: string;
  message: string;
}

interface AppState {
  // General
  customTags: Record<string, string>;
  signature: string;
  authStatus: AuthStatus;
  attachments: AttachmentInfo[];

  // CSV
  contacts: Contact[];
  csvRawText: string;
  csvHeaders: string[];
  templateNames: string[];
  viewMode: "table" | "text";

  // Templates
  templates: Record<string, TemplateContent>;

  // Email
  previews: EmailPreview[];
  sendResults: SendResult[];
  isSending: boolean;
  isPreviewing: boolean;
  sendProgress: {
    active: boolean;
    total: number;
    sent: number;
    failed: number;
    currentEmail: string;
  };
  sendLog: SendLogEntry[];

  // UI
  showPreviewModal: boolean;
  showResultsModal: boolean;
  showSendingModal: boolean;
  saveStatus: "" | "saving" | "saved";
  activeEditorTab: string;

  // Actions
  loadSettings: () => Promise<void>;
  saveCustomTags: (tags: Record<string, string>) => Promise<void>;
  saveSignature: (html: string) => Promise<void>;
  loadAuthStatus: () => Promise<void>;
  saveGmailConfig: (email: string, appPassword: string) => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  loadAttachments: () => Promise<void>;
  uploadAttachments: (files: FileList) => Promise<void>;
  deleteAttachment: (filename: string) => Promise<void>;
  updateCsvText: (text: string) => Promise<void>;
  setViewMode: (mode: "table" | "text") => void;
  loadContacts: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  saveTemplate: (name: string, content: TemplateContent) => Promise<void>;
  previewEmails: () => Promise<void>;
  sendEmails: () => Promise<void>;
  cancelSend: () => Promise<void>;
  pollSendStatus: () => Promise<void>;
  fetchSendLog: () => Promise<void>;
  retryEmails: (indices: number[]) => Promise<void>;
  setShowPreviewModal: (show: boolean) => void;
  setShowResultsModal: (show: boolean) => void;
  setShowSendingModal: (show: boolean) => void;
  setActiveEditorTab: (tab: string) => void;
}

let _savedTimer: ReturnType<typeof setTimeout> | undefined;
function markSaving(set: (s: Partial<AppState>) => void) {
  clearTimeout(_savedTimer);
  set({ saveStatus: "saving" });
}
function markSaved(set: (s: Partial<AppState>) => void) {
  clearTimeout(_savedTimer);
  set({ saveStatus: "saved" });
  _savedTimer = setTimeout(() => set({ saveStatus: "" }), 1500);
}

export const useAppStore = create<AppState>((set, get) => ({
  customTags: {},
  signature: "",
  authStatus: { connected: false },
  attachments: [],
  contacts: [],
  csvRawText: "",
  csvHeaders: [],
  templateNames: [],
  viewMode: "table",
  templates: {},
  previews: [],
  sendResults: [],
  isSending: false,
  isPreviewing: false,
  sendProgress: { active: false, total: 0, sent: 0, failed: 0, currentEmail: "" },
  sendLog: [],
  showPreviewModal: false,
  showResultsModal: false,
  showSendingModal: false,
  saveStatus: "",
  activeEditorTab: "__contacts__",

  loadSettings: async () => {
    const { data } = await api.get("/settings");
    set({ customTags: data.custom_tags, signature: data.signature });
  },

  saveCustomTags: async (tags: Record<string, string>) => {
    set({ customTags: tags });
    markSaving(set);
    const { signature } = get();
    await api.put("/settings", { custom_tags: tags, signature });
    markSaved(set);
  },

  saveSignature: async (html: string) => {
    set({ signature: html });
    markSaving(set);
    const { customTags } = get();
    await api.put("/settings", { custom_tags: customTags, signature: html });
    markSaved(set);
  },

  loadAuthStatus: async () => {
    const { data } = await api.get("/auth/status");
    set({ authStatus: data });
  },

  saveGmailConfig: async (email: string, appPassword: string) => {
    await api.post("/auth/save", { email, app_password: appPassword });
    await get().loadAuthStatus();
  },

  disconnectGoogle: async () => {
    await api.post("/auth/disconnect");
    set({ authStatus: { connected: false } });
  },

  loadAttachments: async () => {
    const { data } = await api.get("/attachments");
    set({ attachments: data });
  },

  uploadAttachments: async (files: FileList) => {
    const formData = new FormData();
    for (const f of files) {
      formData.append("files", f);
    }
    await api.post("/attachments", formData);
    await get().loadAttachments();
  },

  deleteAttachment: async (filename: string) => {
    await api.delete(`/attachments/${encodeURIComponent(filename)}`);
    await get().loadAttachments();
  },

  updateCsvText: async (text: string) => {
    markSaving(set);
    const { data } = await api.put("/csv/contacts", { raw_text: text });
    set({
      contacts: data.contacts,
      csvHeaders: data.headers,
      templateNames: data.template_names,
      csvRawText: data.raw_text,
    });
    await get().loadTemplates();
    markSaved(set);
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  loadContacts: async () => {
    const { data } = await api.get("/csv/contacts");
    if (data.contacts && data.contacts.length > 0) {
      set({
        contacts: data.contacts,
        csvHeaders: data.headers,
        csvRawText: data.raw_text,
        templateNames: data.template_names ?? [],
      });
    }
  },

  loadTemplates: async () => {
    const { data } = await api.get("/templates");
    set({ templates: data });
  },

  saveTemplate: async (name: string, content: TemplateContent) => {
    set((state) => ({
      templates: { ...state.templates, [name]: content },
    }));
    markSaving(set);
    await api.put(`/templates/${encodeURIComponent(name)}`, content);
    markSaved(set);
  },

  previewEmails: async () => {
    set({ isPreviewing: true });
    try {
      const { data } = await api.post("/emails/preview");
      set({ previews: data, showPreviewModal: true });
    } finally {
      set({ isPreviewing: false });
    }
  },

  sendEmails: async () => {
    set({ showPreviewModal: false, isSending: true, showSendingModal: true });
    await api.post("/emails/send");
    // Start polling
    get().pollSendStatus();
  },

  cancelSend: async () => {
    await api.post("/emails/cancel");
  },

  fetchSendLog: async () => {
    try {
      const { data } = await api.get("/emails/log");
      set({ sendLog: data });
    } catch {
      // ignore
    }
  },

  pollSendStatus: async () => {
    const poll = async () => {
      try {
        const { data } = await api.get("/emails/status");
        set({
          sendProgress: {
            active: data.active,
            total: data.total,
            sent: data.sent,
            failed: data.failed,
            currentEmail: data.current_email,
          },
        });
        // Also fetch log
        get().fetchSendLog();
        if (!data.active) {
          // Done — convert results and show results modal
          set({
            isSending: false,
            showSendingModal: false,
            sendResults: data.results,
            showResultsModal: true,
          });
          return;
        }
      } catch {
        // If poll fails, keep trying
      }
      setTimeout(poll, 1000);
    };
    poll();
  },

  retryEmails: async (indices: number[]) => {
    set({ isSending: true });
    try {
      const { data } = await api.post("/emails/retry", { indices });
      set((state) => {
        const updated = [...state.sendResults];
        for (const result of data) {
          const idx = updated.findIndex(
            (r) => r.contact_index === result.contact_index
          );
          if (idx >= 0) updated[idx] = result;
        }
        return { sendResults: updated };
      });
    } finally {
      set({ isSending: false });
    }
  },

  setShowPreviewModal: (show) => set({ showPreviewModal: show }),
  setShowResultsModal: (show) => set({ showResultsModal: show }),
  setShowSendingModal: (show) => set({ showSendingModal: show }),
  setActiveEditorTab: (tab) => set({ activeEditorTab: tab }),
}));
