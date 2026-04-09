import sys
from pathlib import Path


def _get_data_parent() -> Path:
    """When frozen (PyInstaller .exe), store data next to the executable.
    In dev mode, use the source directory as before."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def _get_static_dir() -> Path:
    """Location of the built frontend files."""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "dist"
    return Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


BASE_DIR = _get_data_parent()
DATA_DIR = BASE_DIR / "data"
ATTACHMENTS_DIR = DATA_DIR / "attachments"
STORE_PATH = DATA_DIR / "store.json"
STATIC_DIR = _get_static_dir()

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

REQUIRED_CSV_COLUMNS = {"COMPANY_NAME", "CONTACT_NAME", "EMAIL", "POSITION", "TEMPLATE"}
