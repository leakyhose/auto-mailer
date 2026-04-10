import logging
import subprocess
import threading
import time
from collections import deque
from datetime import datetime

from fastapi import APIRouter, HTTPException

from ..models import EmailPreview, SendResult, RetryRequest
from ..services import csv_service, template_service, gmail_service
from ..services.gmail_service import _body_to_html
from ..services.persistence import load_store

logger = logging.getLogger("automailer.send")

router = APIRouter()

# Store last send results for retry
_last_previews: list[EmailPreview] = []

# Background send state
_send_lock = threading.Lock()
_send_state: dict = {
    "active": False,
    "cancelled": False,
    "total": 0,
    "sent": 0,
    "failed": 0,
    "current_email": "",
    "results": [],
}

# Send log — ring buffer of recent events
_send_log: deque[dict] = deque(maxlen=500)


def _log_event(level: str, message: str):
    """Add an event to both the ring buffer and Python logger."""
    entry = {
        "time": datetime.now().strftime("%H:%M:%S"),
        "level": level,
        "message": message,
    }
    _send_log.append(entry)
    getattr(logger, level, logger.info)(message)


def _generate_previews() -> list[EmailPreview]:
    contacts = csv_service.get_contacts()
    if not contacts:
        raise HTTPException(400, "No contacts loaded — please upload a CSV first")

    store = load_store()
    templates = store.get("templates", {})
    custom_tags = store.get("custom_tags", {})
    signature = store.get("signature", "")

    previews = []
    for i, contact in enumerate(contacts):
        template_name = contact.get("TEMPLATE", "")
        if template_name not in templates:
            previews.append(EmailPreview(
                to=contact.get("EMAIL", ""),
                contact_name=contact.get("CONTACT_NAME", ""),
                company_name=contact.get("COMPANY_NAME", ""),
                template_name=template_name,
                subject=f"[MISSING TEMPLATE: {template_name}]",
                body="",
                body_html="",
                contact_index=i,
            ))
            continue

        tmpl = templates[template_name]
        subject, body = template_service.render_template(
            tmpl["subject"], tmpl["body"], contact, custom_tags
        )

        previews.append(EmailPreview(
            to=contact.get("EMAIL", ""),
            contact_name=contact.get("CONTACT_NAME", ""),
            company_name=contact.get("COMPANY_NAME", ""),
            template_name=template_name,
            subject=subject,
            body=body,
            body_html=_body_to_html(body, signature),
            contact_index=i,
        ))

    return previews


def _send_worker(previews: list[EmailPreview], signature: str, attachment_paths: list):
    """Background worker that sends emails with a shared SMTP connection."""
    global _send_state
    results: list[dict] = []

    # Prevent Mac from sleeping during send
    caffeinate = None
    try:
        caffeinate = subprocess.Popen(["caffeinate", "-i"])
        _log_event("info", "Sleep prevention enabled (caffeinate)")
    except Exception:
        _log_event("warning", "Could not start caffeinate — Mac may sleep during send")

    _log_event("info", f"Starting send of {len(previews)} emails")

    # Mark missing templates as failed immediately
    valid = []
    for preview in previews:
        if preview.subject.startswith("[MISSING TEMPLATE:"):
            results.append({
                "to": preview.to,
                "contact_name": preview.contact_name,
                "status": "failed",
                "error": f"Missing template: {preview.template_name}",
                "contact_index": preview.contact_index,
            })
            with _send_lock:
                _send_state["failed"] += 1
                _send_state["results"] = list(results)
            _log_event("warning", f"Skipped {preview.to} — missing template '{preview.template_name}'")
        else:
            valid.append(preview)

    if not valid:
        _log_event("info", "No valid emails to send")
        with _send_lock:
            _send_state["active"] = False
        return

    # Open one SMTP connection for the entire batch
    server = None
    from_email = ""
    max_reconnect_attempts = 3

    def connect_smtp():
        nonlocal server, from_email
        _log_event("info", "Opening SMTP connection...")
        server, from_email = gmail_service.open_smtp_connection(timeout=30)
        _log_event("info", f"SMTP connected as {from_email}")

    try:
        connect_smtp()
    except Exception as e:
        _log_event("error", f"SMTP connection failed: {e}")
        for preview in valid:
            results.append({
                "to": preview.to,
                "contact_name": preview.contact_name,
                "status": "failed",
                "error": f"SMTP connection failed: {e}",
                "contact_index": preview.contact_index,
            })
        with _send_lock:
            _send_state["failed"] += len(valid)
            _send_state["results"] = list(results)
            _send_state["active"] = False
        return

    try:
        for i, preview in enumerate(valid):
            # Check for cancellation
            with _send_lock:
                if _send_state["cancelled"]:
                    _log_event("warning", f"Cancelled — {len(valid) - i} emails remaining")
                    for remaining in valid[i:]:
                        results.append({
                            "to": remaining.to,
                            "contact_name": remaining.contact_name,
                            "status": "failed",
                            "error": "Cancelled",
                            "contact_index": remaining.contact_index,
                        })
                    _send_state["failed"] += len(valid) - i
                    _send_state["results"] = list(results)
                    _send_state["active"] = False
                    return
                _send_state["current_email"] = f"{preview.contact_name} <{preview.to}>"

            # Try sending with reconnection on failure
            sent = False
            last_error = ""
            for attempt in range(max_reconnect_attempts):
                try:
                    message_id = gmail_service.send_email_with_connection(
                        server, from_email,
                        to=preview.to,
                        subject=preview.subject,
                        body=preview.body,
                        signature=signature,
                        attachment_paths=attachment_paths or None,
                    )
                    results.append({
                        "to": preview.to,
                        "contact_name": preview.contact_name,
                        "status": "sent",
                        "message_id": message_id,
                        "contact_index": preview.contact_index,
                    })
                    with _send_lock:
                        _send_state["sent"] += 1
                        _send_state["results"] = list(results)
                    sent = True

                    if (i + 1) % 50 == 0:
                        _log_event("info", f"Progress: {i + 1}/{len(valid)} sent")
                    break

                except Exception as e:
                    last_error = str(e)
                    if attempt < max_reconnect_attempts - 1:
                        _log_event("warning", f"Send failed for {preview.to} (attempt {attempt + 1}): {e} — reconnecting...")
                        try:
                            try:
                                server.quit()
                            except Exception:
                                pass
                            connect_smtp()
                        except Exception as reconn_err:
                            _log_event("error", f"Reconnect failed: {reconn_err}")
                            last_error = f"Reconnect failed: {reconn_err}"
                            continue
                    else:
                        _log_event("error", f"Failed to send to {preview.to} after {max_reconnect_attempts} attempts: {last_error}")

            if not sent:
                results.append({
                    "to": preview.to,
                    "contact_name": preview.contact_name,
                    "status": "failed",
                    "error": last_error,
                    "contact_index": preview.contact_index,
                })
                with _send_lock:
                    _send_state["failed"] += 1
                    _send_state["results"] = list(results)

            # Delay between sends to avoid Gmail rate limits
            if i < len(valid) - 1:
                time.sleep(1.0)
    finally:
        try:
            server.quit()
        except Exception:
            pass
        if caffeinate:
            caffeinate.terminate()
            _log_event("info", "Sleep prevention released")
        with _send_lock:
            _send_state["active"] = False
            _send_state["current_email"] = ""
        sent_count = sum(1 for r in results if r["status"] == "sent")
        failed_count = sum(1 for r in results if r["status"] == "failed")
        _log_event("info", f"Send complete — {sent_count} sent, {failed_count} failed")


@router.post("/preview", response_model=list[EmailPreview])
async def preview_emails():
    global _last_previews
    _last_previews = _generate_previews()
    return _last_previews


@router.post("/send")
async def send_emails():
    global _last_previews, _send_state

    with _send_lock:
        if _send_state["active"]:
            raise HTTPException(409, "A send is already in progress")

    _send_log.clear()
    _last_previews = _generate_previews()

    store = load_store()
    signature = store.get("signature", "")
    attachment_paths = gmail_service.get_global_attachment_paths()

    valid_count = sum(1 for p in _last_previews if not p.subject.startswith("[MISSING TEMPLATE:"))

    with _send_lock:
        _send_state = {
            "active": True,
            "cancelled": False,
            "total": len(_last_previews),
            "sent": 0,
            "failed": 0,
            "current_email": "",
            "results": [],
        }

    thread = threading.Thread(
        target=_send_worker,
        args=(_last_previews, signature, attachment_paths),
        daemon=True,
    )
    thread.start()

    return {"status": "started", "total": len(_last_previews), "valid": valid_count}


@router.get("/status")
async def send_status():
    with _send_lock:
        return dict(_send_state)


@router.get("/log")
async def send_log():
    """Return recent send log entries."""
    return list(_send_log)


@router.post("/cancel")
async def cancel_send():
    with _send_lock:
        if not _send_state["active"]:
            raise HTTPException(400, "No active send to cancel")
        _send_state["cancelled"] = True
    _log_event("warning", "Cancel requested by user")
    return {"status": "cancelling"}


@router.post("/retry", response_model=list[SendResult])
async def retry_emails(req: RetryRequest):
    if not _last_previews:
        raise HTTPException(400, "No previous send — please send emails first")

    store = load_store()
    signature = store.get("signature", "")
    attachment_paths = gmail_service.get_global_attachment_paths()
    results = []

    for idx in req.indices:
        preview = next((p for p in _last_previews if p.contact_index == idx), None)
        if not preview:
            results.append(SendResult(
                to="unknown",
                contact_name="unknown",
                status="failed",
                error=f"Contact index {idx} not found",
                contact_index=idx,
            ))
            continue

        try:
            message_id = gmail_service.send_email(
                to=preview.to,
                subject=preview.subject,
                body=preview.body,
                signature=signature,
                attachment_paths=attachment_paths or None,
            )
            results.append(SendResult(
                to=preview.to,
                contact_name=preview.contact_name,
                status="sent",
                message_id=message_id,
                contact_index=preview.contact_index,
            ))
        except Exception as e:
            results.append(SendResult(
                to=preview.to,
                contact_name=preview.contact_name,
                status="failed",
                error=str(e),
                contact_index=preview.contact_index,
            ))

    return results
