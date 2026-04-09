from fastapi import APIRouter, UploadFile, File, HTTPException

from ..models import AttachmentInfo
from ..config import ATTACHMENTS_DIR

router = APIRouter()


@router.get("", response_model=list[AttachmentInfo])
async def list_attachments():
    ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)
    attachments = []
    for p in ATTACHMENTS_DIR.iterdir():
        if p.is_file():
            attachments.append(AttachmentInfo(filename=p.name, size=p.stat().st_size))
    return attachments


@router.post("", response_model=list[AttachmentInfo])
async def upload_attachments(files: list[UploadFile] = File(...)):
    ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)
    uploaded = []
    for f in files:
        if not f.filename:
            continue
        dest = ATTACHMENTS_DIR / f.filename
        content = await f.read()
        dest.write_bytes(content)
        uploaded.append(AttachmentInfo(filename=f.filename, size=len(content)))
    return uploaded


@router.delete("/{filename}")
async def delete_attachment(filename: str):
    path = ATTACHMENTS_DIR / filename
    if not path.exists():
        raise HTTPException(404, "Attachment not found")
    path.unlink()
    return {"status": "ok"}
