from fastapi import APIRouter, HTTPException

from ..models import EmailPreview, SendResult, RetryRequest
from ..services import csv_service, template_service, gmail_service
from ..services.persistence import load_store

router = APIRouter()

# Store last send results for retry
_last_previews: list[EmailPreview] = []


def _generate_previews() -> list[EmailPreview]:
    contacts = csv_service.get_contacts()
    if not contacts:
        raise HTTPException(400, "No contacts loaded — please upload a CSV first")

    store = load_store()
    templates = store.get("templates", {})
    sender_name = store.get("sender_name", "")

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
                contact_index=i,
            ))
            continue

        tmpl = templates[template_name]
        subject, body = template_service.render_template(
            tmpl["subject"], tmpl["body"], contact, sender_name
        )

        previews.append(EmailPreview(
            to=contact.get("EMAIL", ""),
            contact_name=contact.get("CONTACT_NAME", ""),
            company_name=contact.get("COMPANY_NAME", ""),
            template_name=template_name,
            subject=subject,
            body=body,
            contact_index=i,
        ))

    return previews


@router.post("/preview", response_model=list[EmailPreview])
async def preview_emails():
    global _last_previews
    _last_previews = _generate_previews()
    return _last_previews


@router.post("/send", response_model=list[SendResult])
async def send_emails():
    global _last_previews
    _last_previews = _generate_previews()

    attachment_paths = gmail_service.get_global_attachment_paths()
    results = []

    for preview in _last_previews:
        if preview.subject.startswith("[MISSING TEMPLATE:"):
            results.append(SendResult(
                to=preview.to,
                contact_name=preview.contact_name,
                status="failed",
                error=f"Missing template: {preview.template_name}",
                contact_index=preview.contact_index,
            ))
            continue

        try:
            message_id = gmail_service.send_email(
                to=preview.to,
                subject=preview.subject,
                body=preview.body,
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


@router.post("/retry", response_model=list[SendResult])
async def retry_emails(req: RetryRequest):
    if not _last_previews:
        raise HTTPException(400, "No previous send — please send emails first")

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
