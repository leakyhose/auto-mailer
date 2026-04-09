import csv
import io

from ..config import REQUIRED_CSV_COLUMNS
from .persistence import save_csv_data, load_csv_data

# In-memory storage for current session's contacts
_contacts: list[dict[str, str]] = []
_headers: list[str] = []
_raw_text: str = ""


def parse_csv(content: str) -> tuple[list[dict[str, str]], list[str], list[str]]:
    """Parse CSV text and return (contacts, headers, unique_template_names)."""
    reader = csv.DictReader(io.StringIO(content))
    headers = reader.fieldnames or []

    missing = REQUIRED_CSV_COLUMNS - set(headers)
    if missing:
        raise ValueError(f"CSV missing required columns: {', '.join(sorted(missing))}")

    contacts = [row for row in reader]
    template_names = sorted(set(row.get("TEMPLATE", "") for row in contacts if row.get("TEMPLATE")))

    return contacts, headers, template_names


def set_contacts(contacts: list[dict[str, str]], headers: list[str], raw_text: str):
    global _contacts, _headers, _raw_text
    _contacts = contacts
    _headers = headers
    _raw_text = raw_text
    save_csv_data(contacts, headers, raw_text)


def get_contacts() -> list[dict[str, str]]:
    return _contacts


def get_headers() -> list[str]:
    return _headers


def get_raw_text() -> str:
    return _raw_text


def load_persisted_contacts() -> bool:
    global _contacts, _headers, _raw_text
    data = load_csv_data()
    if data is None:
        return False
    _contacts = data["contacts"]
    _headers = data["headers"]
    _raw_text = data["raw_text"]
    return True
