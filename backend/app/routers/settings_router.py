from fastapi import APIRouter

from ..models import SettingsResponse, SettingsUpdate
from ..services.persistence import load_store, save_store

router = APIRouter()


@router.get("", response_model=SettingsResponse)
async def get_settings():
    store = load_store()
    return SettingsResponse(sender_name=store.get("sender_name", ""))


@router.put("", response_model=SettingsResponse)
async def update_settings(settings: SettingsUpdate):
    store = load_store()
    store["sender_name"] = settings.sender_name
    save_store(store)
    return SettingsResponse(sender_name=settings.sender_name)
