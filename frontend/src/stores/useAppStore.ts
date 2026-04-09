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

interface AppState {
  // General
  senderName: string;
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

  // UI
  showPreviewModal: boolean;
  showResultsModal: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  setSenderName: (name: string) => Promise<void>;
  loadAuthStatus: () => Promise<void>;
  saveGmailConfig: (email: string, appPassword: string) => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  loadAttachments: () => Promise<void>;
  uploadAttachments: (files: FileList) => Promise<void>;
  deleteAttachment: (filename: string) => Promise<void>;
  uploadCsv: (file: File) => Promise<void>;
  updateCsvText: (text: string) => Promise<void>;
  setViewMode: (mode: "table" | "text") => void;
  loadContacts: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  saveTemplate: (name: string, content: TemplateContent) => Promise<void>;
  parseTemplate: (name: string, rawText: string) => Promise<TemplateContent>;
  previewEmails: () => Promise<void>;
  sendEmails: () => Promise<void>;
  retryEmails: (indices: number[]) => Promise<void>;
  setShowPreviewModal: (show: boolean) => void;
  setShowResultsModal: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  senderName: "",
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
  showPreviewModal: false,
  showResultsModal: false,

  loadSettings: async () => {
    const { data } = await api.get("/settings");
    set({ senderName: data.sender_name });
  },

  setSenderName: async (name: string) => {
    set({ senderName: name });
    await api.put("/settings", { sender_name: name });
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

  uploadCsv: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/csv/upload", formData);
    set({
      contacts: data.contacts,
      csvHeaders: data.headers,
      templateNames: data.template_names,
      csvRawText: data.raw_text,
    });
    // Load saved templates
    await get().loadTemplates();
  },

  updateCsvText: async (text: string) => {
    const { data } = await api.put("/csv/contacts", { raw_text: text });
    set({
      contacts: data.contacts,
      csvHeaders: data.headers,
      templateNames: data.template_names,
      csvRawText: data.raw_text,
    });
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
    await api.put(`/templates/${encodeURIComponent(name)}`, content);
  },

  parseTemplate: async (name: string, rawText: string) => {
    const { data } = await api.post(
      `/templates/${encodeURIComponent(name)}/parse`,
      { raw_text: rawText }
    );
    const content: TemplateContent = { subject: data.subject, body: data.body };
    set((state) => ({
      templates: { ...state.templates, [name]: content },
    }));
    await api.put(`/templates/${encodeURIComponent(name)}`, content);
    return content;
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
    set({ isSending: true, showPreviewModal: false });
    try {
      const { data } = await api.post("/emails/send");
      set({ sendResults: data, showResultsModal: true });
    } finally {
      set({ isSending: false });
    }
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
}));
