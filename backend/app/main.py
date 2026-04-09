import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import STATIC_DIR
from .routers import (
    csv_router,
    template_router,
    auth_router,
    email_router,
    attachment_router,
    settings_router,
)

app = FastAPI(title="Auto Mailer")

# CORS only needed in dev mode (frontend on separate Vite dev server)
if not getattr(sys, "frozen", False):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(csv_router.router, prefix="/api/csv", tags=["csv"])
app.include_router(template_router.router, prefix="/api/templates", tags=["templates"])
app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(email_router.router, prefix="/api/emails", tags=["email"])
app.include_router(attachment_router.router, prefix="/api/attachments", tags=["attachments"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])

# Serve built frontend (production / .exe mode)
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
