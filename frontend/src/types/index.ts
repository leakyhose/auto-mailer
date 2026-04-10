export interface Contact {
  [key: string]: string;
}

export interface TemplateContent {
  subject: string;
  body: string;
}

export interface AttachmentInfo {
  filename: string;
  size: number;
}

export interface EmailPreview {
  to: string;
  contact_name: string;
  company_name: string;
  template_name: string;
  subject: string;
  body: string;
  body_html: string;
  contact_index: number;
}

export interface SendResult {
  to: string;
  contact_name: string;
  status: "sent" | "failed";
  error?: string;
  message_id?: string;
  contact_index: number;
}

export interface AuthStatus {
  connected: boolean;
  email?: string;
}
