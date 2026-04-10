import email.utils
import html
import mimetypes
import smtplib
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders
from pathlib import Path

from .auth_service import get_smtp_config
from ..config import ATTACHMENTS_DIR, SMTP_HOST, SMTP_PORT


def _body_to_html(body: str, signature: str) -> str:
    """Convert plain text body to HTML and append rich signature."""
    # Escape the plain text body, then convert newlines to <br>
    body_html = html.escape(body).replace("\n", "<br>\n")
    parts = [body_html]
    if signature.strip():
        parts.append('<br>\n<div style="margin-top:16px">-- <br>\n')
        parts.append(signature)
        parts.append("</div>")
    return "".join(parts)


def build_message(
    from_email: str,
    to: str,
    subject: str,
    body: str,
    signature: str = "",
    attachment_paths: list[Path] | None = None,
) -> MIMEMultipart | MIMEText:
    """Build a MIME message with optional attachments and signature."""
    body_html = _body_to_html(body, signature)

    if attachment_paths:
        msg = MIMEMultipart()
        msg.attach(MIMEText(body_html, "html"))

        for path in attachment_paths:
            content_type, _ = mimetypes.guess_type(str(path))
            if content_type is None:
                content_type = "application/octet-stream"
            main_type, sub_type = content_type.split("/", 1)

            with open(path, "rb") as f:
                attachment = MIMEBase(main_type, sub_type)
                attachment.set_payload(f.read())
            encoders.encode_base64(attachment)
            attachment.add_header("Content-Disposition", "attachment", filename=path.name)
            msg.attach(attachment)
    else:
        msg = MIMEText(body_html, "html")

    msg["From"] = from_email
    msg["To"] = to
    msg["Subject"] = subject
    msg["Message-ID"] = email.utils.make_msgid()
    return msg


def send_email_with_connection(
    server: smtplib.SMTP,
    from_email: str,
    to: str,
    subject: str,
    body: str,
    signature: str = "",
    attachment_paths: list[Path] | None = None,
) -> str:
    """Send a single email using an existing SMTP connection."""
    msg = build_message(from_email, to, subject, body, signature, attachment_paths)
    server.send_message(msg)
    return msg["Message-ID"] or ""


def open_smtp_connection(timeout: int = 30) -> tuple[smtplib.SMTP, str]:
    """Open and authenticate an SMTP connection. Returns (server, from_email)."""
    email_addr, app_password = get_smtp_config()
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=timeout)
    server.starttls()
    server.login(email_addr, app_password)
    return server, email_addr


def send_email(
    to: str,
    subject: str,
    body: str,
    signature: str = "",
    attachment_paths: list[Path] | None = None,
) -> str:
    """Send a single email (opens its own connection). Used for retries."""
    server, from_email = open_smtp_connection()
    try:
        return send_email_with_connection(
            server, from_email, to, subject, body, signature, attachment_paths
        )
    finally:
        server.quit()


def get_global_attachment_paths() -> list[Path]:
    """Return paths of all files in the attachments directory."""
    if not ATTACHMENTS_DIR.exists():
        return []
    return [p for p in ATTACHMENTS_DIR.iterdir() if p.is_file()]
