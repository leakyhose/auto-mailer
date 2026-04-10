from fastapi import APIRouter

from ..models import SettingsResponse, SettingsUpdate
from ..services.persistence import load_store, save_store

router = APIRouter()


@router.get("", response_model=SettingsResponse)
async def get_settings():
    store = load_store()
    # Migrate old sender_name to custom_tags
    if "sender_name" in store and "custom_tags" not in store:
        store["custom_tags"] = {"NAME": store.pop("sender_name")}
        save_store(store)
    return SettingsResponse(
        custom_tags=store.get("custom_tags", {}),
        signature=store.get("signature", ""),
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(settings: SettingsUpdate):
    store = load_store()
    store["custom_tags"] = settings.custom_tags
    store["signature"] = settings.signature
    save_store(store)
    return SettingsResponse(
        custom_tags=settings.custom_tags,
        signature=settings.signature,
    )
