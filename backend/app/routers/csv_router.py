from fastapi import APIRouter, UploadFile, File, HTTPException

from ..models import CsvUploadResponse, CsvUpdateRequest
from ..services import csv_service

router = APIRouter()


@router.post("/upload", response_model=CsvUploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, "File must be a .csv")

    content = (await file.read()).decode("utf-8-sig")

    try:
        contacts, headers, template_names = csv_service.parse_csv(content)
    except ValueError as e:
        raise HTTPException(400, str(e))

    csv_service.set_contacts(contacts, headers, content)

    return CsvUploadResponse(
        contacts=contacts,
        headers=headers,
        template_names=template_names,
        raw_text=content,
    )


@router.get("/contacts")
async def get_contacts():
    if not csv_service.get_contacts():
        csv_service.load_persisted_contacts()

    contacts = csv_service.get_contacts()
    template_names = sorted(set(
        row.get("TEMPLATE", "") for row in contacts if row.get("TEMPLATE")
    ))
    return {
        "contacts": contacts,
        "headers": csv_service.get_headers(),
        "raw_text": csv_service.get_raw_text(),
        "template_names": template_names,
    }


@router.put("/contacts")
async def update_contacts(req: CsvUpdateRequest):
    try:
        contacts, headers, template_names = csv_service.parse_csv(req.raw_text)
    except ValueError as e:
        raise HTTPException(400, str(e))

    csv_service.set_contacts(contacts, headers, req.raw_text)

    return CsvUploadResponse(
        contacts=contacts,
        headers=headers,
        template_names=template_names,
        raw_text=req.raw_text,
    )
