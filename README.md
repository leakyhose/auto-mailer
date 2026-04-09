# Auto Mailer

Local email outreach tool. Upload a CSV of contacts, define templates per group, preview, and send via Gmail.

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Google Cloud project with the Gmail API enabled

## Google OAuth Setup (one-time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the **Gmail API** (APIs & Services > Library > search "Gmail API")
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth client ID**
6. Application type: **Web application**
7. Add `http://localhost:8000/api/auth/callback` as an **Authorized redirect URI**
8. Download the JSON and save it as `backend/credentials.json`

## Quick Start

### Windows

Double-click `start.bat` — it launches both servers.

### Manual

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
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
