import email.utils
import mimetypes
import smtplib
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders
from pathlib import Path

from .auth_service import get_smtp_config
from ..config import ATTACHMENTS_DIR, SMTP_HOST, SMTP_PORT


def build_message(
    from_email: str,
    to: str,
    subject: str,
    body: str,
    attachment_paths: list[Path] | None = None,
) -> MIMEMultipart | MIMEText:
    """Build a MIME message with optional attachments."""
    if attachment_paths:
        msg = MIMEMultipart()
        msg.attach(MIMEText(body, "plain"))

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
        msg = MIMEText(body, "plain")

    msg["From"] = from_email
    msg["To"] = to
    msg["Subject"] = subject
    msg["Message-ID"] = email.utils.make_msgid()
    return msg


def send_email(
    to: str,
    subject: str,
    body: str,
    attachment_paths: list[Path] | None = None,
) -> str:
    """Send an email via SMTP and return the message ID."""
    email_addr, app_password = get_smtp_config()
    msg = build_message(email_addr, to, subject, body, attachment_paths)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(email_addr, app_password)
        server.send_message(msg)

    return msg["Message-ID"] or ""


def get_global_attachment_paths() -> list[Path]:
    """Return paths of all files in the attachments directory."""
    if not ATTACHMENTS_DIR.exists():
        return []
    return [p for p in ATTACHMENTS_DIR.iterdir() if p.is_file()]
