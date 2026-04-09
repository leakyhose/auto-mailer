from ..models import AuthStatusResponse
from .persistence import load_store, save_store


def get_auth_status() -> AuthStatusResponse:
    store = load_store()
    email = store.get("gmail_email", "")
    password = store.get("gmail_app_password", "")
    if email and password:
        return AuthStatusResponse(connected=True, email=email)
    return AuthStatusResponse(connected=False)


def save_gmail_config(email: str, app_password: str) -> None:
    store = load_store()
    store["gmail_email"] = email
    store["gmail_app_password"] = app_password.replace(" ", "")
    save_store(store)


def get_smtp_config() -> tuple[str, str]:
    store = load_store()
    email = store.get("gmail_email", "")
    password = store.get("gmail_app_password", "")
    if not email or not password:
        raise RuntimeError("Gmail not configured — please enter your email and app password")
    return email, password


def disconnect() -> None:
    store = load_store()
    store.pop("gmail_email", None)
    store.pop("gmail_app_password", None)
    save_store(store)
