import json
from threading import Lock

from ..config import DATA_DIR, STORE_PATH, ATTACHMENTS_DIR

_lock = Lock()

DEFAULT_STORE = {"custom_tags": {}, "templates": {}, "csv": None}


def _ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)
    if not STORE_PATH.exists():
        STORE_PATH.write_text(json.dumps(DEFAULT_STORE, indent=2))


def load_store() -> dict:
    _ensure_data_dir()
    with _lock:
        return json.loads(STORE_PATH.read_text())


def save_store(data: dict):
    _ensure_data_dir()
    with _lock:
        STORE_PATH.write_text(json.dumps(data, indent=2))


def save_csv_data(contacts: list[dict], headers: list[str], raw_text: str):
    store = load_store()
    store["csv"] = {"contacts": contacts, "headers": headers, "raw_text": raw_text}
    save_store(store)


def load_csv_data() -> dict | None:
    store = load_store()
    return store.get("csv")
