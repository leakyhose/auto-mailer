# Auto-Mailer: Full Project Plan & Design Decisions

## Context

Build a local email outreach tool that lets a user upload a CSV of contacts, define templates per group, preview rendered emails, and send them all via Gmail. The goal is a simple, self-contained app that runs on localhost — no cloud deployment, no database, just a Python backend and React frontend.

---

## User Requirements (from initial discussion)

### Core Workflow
1. User uploads a single CSV file with contacts
2. CSV is displayed as a formatted table in the center panel, with a toggle to raw text mode for manual editing
3. The app extracts all unique template names from the CSV's `TEMPLATE` column
4. For each unique template name, the user defines a Subject + Body using placeholders
5. The user fills in their name (for `{NAME}` placeholder) and connects their Google account via OAuth
6. Optionally uploads global file attachments (attached to ALL emails regardless of template)
7. "Preview Emails" shows all rendered emails with placeholders filled in
8. "Send All" sends everything via Gmail API, showing per-email success/failure status with retry

### CSV Format
Required columns: `COMPANY_NAME`, `CONTACT_NAME`, `EMAIL`, `POSITION`, `TEMPLATE`
- One CSV at a time (uploaded fresh each session)
- Mixed templates in one CSV — the `TEMPLATE` column groups contacts
- CSV can be edited in raw text mode and re-parsed

### Template System
- The column is called `TEMPLATE` (not "TAG")
- Each unique template name extracted from the CSV needs a Subject + Body defined
- **Input method**: Single paste box with `Subject:` / `Body:` markers, which gets parsed into separate editable fields (subject input + body textarea)
- Placeholders: `{CONTACT_NAME}`, `{COMPANY_NAME}`, `{POSITION}`, `{EMAIL}`, `{NAME}` (sender name), plus any extra CSV column headers
- Templates are saved locally and persist between sessions

### Email Details
- **Plain text only** (no HTML/rich formatting)
- **Per-template subject lines** (each template has its own subject with placeholder support)
- **Global attachments** — files uploaded in the General Info panel are attached to ALL outgoing emails
- **Preview required** before sending — modal shows all rendered emails
- **Per-email status** after sending: green checkmark (sent) / red X (failed) with error message and retry button

### Persistence
- Templates + sender name saved locally in JSON (`store.json`)
- OAuth token saved locally (`token.json`)
- CSV contacts are in-memory only (fresh upload each session)
- Attachments stored on disk in `data/attachments/`

---

## Tech Stack

- **Backend**: Python 3.11+ / FastAPI / Uvicorn (port 8000)
- **Frontend**: React 19 / Vite / Tailwind CSS v4 / TypeScript / Zustand (port 5173)
- **Email**: Gmail API via `google-api-python-client` + OAuth 2.0
- **Persistence**: Local JSON file (`store.json`) + token file (`token.json`)
- **State management**: Zustand (lightweight, no boilerplate)
- **API client**: Axios with Vite proxy for `/api` prefix

---

## UI Layout (3-Column)

```
┌───────────────┬────────────────────────────┬────────────────┐
│  GENERAL INFO │      CSV CONTACTS          │   TEMPLATES    │
│               │                            │                │
│ Your Name:    │  [Table View] [Text View]  │ ▼ investor     │
│ [__________]  │                            │ Subject: [___] │
│               │  Company | Name | Email |  │ Body:          │
│ Google Auth:  │  Acme    | John | j@a.. |  │ [__________]   │
│ [Connected]   │  BigCo   | Jane | j@b.. |  │                │
│               │                            │ ▼ vendor       │
│ Attachments:  │                            │ Subject: [___] │
│ [+ Add file]  │                            │ Body:          │
│  pitch.pdf    │                            │ [__________]   │
├───────────────┴────────────────────────────┴────────────────┤
│          [Preview Emails]    [Send All]                     │
└─────────────────────────────────────────────────────────────┘
```

### Left Panel (260px) — General Info
- Sender name input (debounced save, used for `{NAME}`)
- Google OAuth connect/disconnect button with status
- Global attachment manager (upload, list, delete)

### Center Panel (flex) — CSV Contacts
- Drag-and-drop CSV uploader (when no CSV loaded)
- Table View / Text View toggle tabs
- Table View: read-only HTML table, TEMPLATE column highlighted in blue
- Text View: editable textarea with raw CSV, Save/Revert buttons
- Re-upload button when CSV already loaded

### Right Panel (320px) — Templates
- Collapsible sections, one per unique template name from CSV
- Green dot if template has content, orange "needs template" if empty
- Each section contains a TemplateEditor:
  - Subject input + Body textarea (editable, debounced save)
  - "Paste raw template" link to switch to paste mode
  - Paste mode: single textarea, Parse/Cancel buttons

### Bottom Bar — Actions
- Contact count display
- "Preview Emails" button (opens preview modal)
- "Send All" button (requires Google auth)

---

## Directory Structure

```
auto-mailer/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── config.py            # Paths, constants, scopes
│   │   ├── models.py            # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── csv_router.py        # POST upload, GET contacts, PUT contacts
│   │   │   ├── template_router.py   # GET all, GET/PUT/DELETE by name, POST parse
│   │   │   ├── auth_router.py       # GET status, POST connect, GET callback, POST disconnect
│   │   │   ├── email_router.py      # POST preview, POST send, POST retry
│   │   │   ├── attachment_router.py # GET list, POST upload, DELETE by name
│   │   │   └── settings_router.py   # GET/PUT sender name
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── csv_service.py       # CSV parse, validate, in-memory store
│   │   │   ├── template_service.py  # Parse raw template, render placeholders
│   │   │   ├── gmail_service.py     # Build MIME message, send via Gmail API
│   │   │   ├── auth_service.py      # OAuth flow, token refresh, credentials
│   │   │   └── persistence.py       # JSON store read/write with thread lock
│   │   └── data/                    # Runtime data (gitignored)
│   │       ├── store.json           # Persisted templates + sender name
│   │       ├── token.json           # OAuth token
│   │       └── attachments/         # Uploaded attachment files
│   ├── credentials.json             # User-provided Google OAuth creds (gitignored)
│   ├── requirements.txt
│   ├── venv/                        # Python virtual environment (gitignored)
│   └── run.py                       # Uvicorn launcher
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # 3-column grid layout + modals
│   │   ├── index.css                # Tailwind import
│   │   ├── api/client.ts            # Axios instance (baseURL: /api)
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   ├── stores/useAppStore.ts    # Zustand global state + all actions
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── LeftPanel.tsx
│   │   │   │   ├── CenterPanel.tsx
│   │   │   │   └── RightPanel.tsx
│   │   │   ├── general/
│   │   │   │   ├── SenderNameInput.tsx
│   │   │   │   ├── GoogleAuthButton.tsx
│   │   │   │   └── AttachmentManager.tsx
│   │   │   ├── csv/
│   │   │   │   ├── CsvUploader.tsx       # Drag-drop + file picker (full / compact mode)
│   │   │   │   ├── CsvTableView.tsx      # Read-only HTML table
│   │   │   │   ├── CsvTextView.tsx       # Editable raw CSV textarea
│   │   │   │   └── ViewToggle.tsx        # Table/Text tab switcher
│   │   │   ├── templates/
│   │   │   │   ├── TemplateList.tsx       # Collapsible sections per template name
│   │   │   │   └── TemplateEditor.tsx     # Subject/Body fields + paste mode
│   │   │   └── email/
│   │   │       ├── PreviewModal.tsx       # All rendered emails in scrollable modal
│   │   │       ├── ResultsModal.tsx       # Per-email sent/failed status + retry
│   │   │       └── ActionBar.tsx          # Bottom bar: Preview + Send All buttons
│   │   └── hooks/                   # (reserved for future custom hooks)
│   ├── vite.config.ts               # React + Tailwind plugins, /api proxy
│   ├── package.json
│   └── index.html
├── start.bat                        # Windows launcher (starts both servers)
├── .gitignore
├── README.md
└── plan.md                          # This file
```

---

## Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/settings` | Get sender name |
| `PUT` | `/api/settings` | Update sender name |
| `POST` | `/api/csv/upload` | Upload CSV file → returns contacts, headers, template names, raw text |
| `GET` | `/api/csv/contacts` | Get current in-memory contacts |
| `PUT` | `/api/csv/contacts` | Update contacts from edited raw CSV text |
| `GET` | `/api/templates` | Get all saved templates |
| `GET` | `/api/templates/{name}` | Get single template by name |
| `PUT` | `/api/templates/{name}` | Save/update template (subject + body) |
| `POST` | `/api/templates/{name}/parse` | Parse raw "Subject:/Body:" text into structured fields |
| `DELETE` | `/api/templates/{name}` | Delete a template |
| `GET` | `/api/auth/status` | Check OAuth connection status + email |
| `POST` | `/api/auth/connect` | Start OAuth flow → returns Google auth URL |
| `GET` | `/api/auth/callback` | OAuth redirect handler (exchanges code for token) |
| `POST` | `/api/auth/disconnect` | Delete stored token |
| `GET` | `/api/attachments` | List all uploaded attachments (filename + size) |
| `POST` | `/api/attachments` | Upload one or more attachment files |
| `DELETE` | `/api/attachments/{filename}` | Delete an attachment |
| `POST` | `/api/emails/preview` | Generate all rendered emails (placeholders filled) |
| `POST` | `/api/emails/send` | Send all emails, return per-email status |
| `POST` | `/api/emails/retry` | Retry specific failed emails by contact index |

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSV column name | `TEMPLATE` (not "TAG") | User preference — template names determine which template to use |
| Template input | Single paste box → parsed into fields | User wanted to paste `Subject:` / `Body:` blocks, then edit individually |
| Email format | Plain text only | User requirement — no HTML formatting needed |
| Attachments | Global (all emails) | Managed in General Info panel, not per-template |
| Persistence | JSON file (`store.json`) | Simple, no relational queries needed, human-readable |
| CSV storage | In-memory only | Fresh upload each session per requirements |
| OAuth flow | Server-side redirect (not `InstalledAppFlow`) | Avoids blocking FastAPI's async event loop |
| State management | Zustand | Lightweight, no boilerplate, single store pattern |
| Vite proxy | `/api` → `localhost:8000` | Eliminates CORS issues during development |
| Preview step | Required before sending | User wanted to review all rendered emails first |

---

## Data Flow

### CSV Upload → Template Editing → Preview → Send

```
1. User drops CSV file
   → POST /api/csv/upload
   → Backend parses, validates columns, extracts unique TEMPLATE values
   → Returns { contacts, headers, template_names, raw_text }
   → Frontend populates table + shows template sections

2. User expands template "investor", clicks "Paste raw template"
   → Pastes: "Subject: Hello {CONTACT_NAME}\nBody:\nDear {CONTACT_NAME}..."
   → POST /api/templates/investor/parse
   → Backend splits into { subject, body }
   → Frontend shows separate editable fields
   → Edits auto-save via debounced PUT /api/templates/investor

3. User clicks "Preview Emails"
   → POST /api/emails/preview
   → Backend: for each contact, looks up template by TEMPLATE column,
     replaces {PLACEHOLDER} tokens with contact data + sender name
   → Returns array of rendered emails
   → Frontend shows preview modal

4. User clicks "Send All" in preview modal
   → POST /api/emails/send
   → Backend: builds MIME messages, attaches global files, sends via Gmail API
   → Returns per-email results: { to, status, error?, message_id? }
   → Frontend shows results modal with green/red indicators

5. User clicks "Retry" on failed emails
   → POST /api/emails/retry { indices: [3, 7] }
   → Backend re-sends only those contacts
   → Frontend updates results in-place
```

---

## OAuth Flow

### Prerequisites (one-time setup)
1. Create Google Cloud project
2. Enable Gmail API
3. Create OAuth 2.0 credentials (Web application type)
4. Add `http://localhost:8000/api/auth/callback` as authorized redirect URI
5. Download credentials JSON → save as `backend/credentials.json`

### Runtime Flow
```
User clicks "Connect Google"
  → POST /api/auth/connect
  → Backend creates Flow from credentials.json, generates auth URL
  → Frontend opens auth URL in new browser tab

User authenticates with Google in browser tab
  → Google redirects to GET /api/auth/callback?code=...
  → Backend exchanges code for credentials, saves token.json
  → Returns HTML: "Authentication successful, close this tab"

Frontend polls GET /api/auth/status every 2 seconds
  → Once connected, shows email address + disconnect button
  → Token auto-refreshes on expiry
```

---

## How to Run

### Quick Start (Windows)
Double-click `start.bat` in the project root.

### Manual (two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate
python run.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173

---

## Sample CSV for Testing

```csv
COMPANY_NAME,CONTACT_NAME,EMAIL,POSITION,TEMPLATE
Acme Corp,John Smith,john@acme.com,CTO,investor
BigCo Inc,Jane Doe,jane@bigco.com,VP Engineering,vendor
StartupXYZ,Bob Wilson,bob@startupxyz.com,Founder,investor
MegaTech,Alice Brown,alice@megatech.com,Director,vendor
```

## Sample Template Paste

```
Subject: Partnership Opportunity with {COMPANY_NAME}
Body:
Hi {CONTACT_NAME},

I'm {NAME}, reaching out regarding a potential partnership with {COMPANY_NAME}.

Given your role as {POSITION}, I'd love to schedule a brief call to discuss how we might work together.

Best regards,
{NAME}
```
