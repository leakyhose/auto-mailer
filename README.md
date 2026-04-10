# Auto Mailer

Local email outreach tool. Upload a CSV of contacts, define templates per group, preview, and send via Gmail.

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833)

## Quick Start

Run `./start.sh` — it launches both backend and frontend servers.

Open http://localhost:5173 in your browser.

### Manual

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Build

Run `./build.sh` to create a standalone executable at `backend/dist/AutoMailer`.

## CSV Format

```csv
COMPANY_NAME,CONTACT_NAME,EMAIL,POSITION,TEMPLATE
Acme Corp,John Smith,john@acme.com,CTO,investor
BigCo Inc,Jane Doe,jane@bigco.com,VP Engineering,vendor
```

Required columns: `COMPANY_NAME`, `CONTACT_NAME`, `EMAIL`, `POSITION`, `TEMPLATE`

## Template Placeholders

Use `{COLUMN_NAME}` in templates to auto-fill values:

- `{CONTACT_NAME}` — from CSV
- `{COMPANY_NAME}` — from CSV
- `{POSITION}` — from CSV
- `{EMAIL}` — from CSV
- `{NAME}` — your name (from General Info panel)
- Any additional CSV column headers also work as placeholders

## Template Input Format

Paste a raw template block:

```
Subject: Partnership with {COMPANY_NAME}
Body:
Hi {CONTACT_NAME},

I'm {NAME} and I'd love to discuss a partnership.

Best regards,
{NAME}
```

The app parses `Subject:` and `Body:` markers into separate editable fields.
