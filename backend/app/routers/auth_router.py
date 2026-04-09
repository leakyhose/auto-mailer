from fastapi import APIRouter, HTTPException

from ..models import AuthStatusResponse, GmailConfigRequest
from ..services.auth_service import get_auth_status, save_gmail_config, disconnect

router = APIRouter()


@router.get("/status", response_model=AuthStatusResponse)
def auth_status():
    return get_auth_status()


@router.post("/save")
def auth_save(req: GmailConfigRequest):
    try:
        save_gmail_config(req.email, req.app_password)
    except Exception as e:
        raise HTTPException(400, f"Failed to save Gmail config: {e}")
    return {"status": "ok"}


@router.post("/disconnect")
def auth_disconnect():
    disconnect()
    return {"status": "ok"}
