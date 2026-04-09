"""Build script to create AutoMailer.exe"""

import subprocess
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"
DIST_SRC = FRONTEND / "dist"
DIST_DEST = BACKEND / "dist_bundle"  # temp copy for PyInstaller


def build_frontend():
    print("=== [1/4] Building frontend ===")
    subprocess.run(["npm", "run", "build"], cwd=str(FRONTEND), check=True, shell=True)


def copy_dist():
    print("=== [2/4] Copying dist/ for bundling ===")
    if DIST_DEST.exists():
        shutil.rmtree(DIST_DEST)
    shutil.copytree(DIST_SRC, DIST_DEST)


def build_exe():
    print("=== [3/4] Running PyInstaller ===")
    subprocess.run(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "--onefile",
            "--name",
            "AutoMailer",
            "--add-data",
            f"{DIST_DEST};dist",
            "--hidden-import",
            "app",
            "--hidden-import",
            "app.main",
            "--hidden-import",
            "app.config",
            "--hidden-import",
            "app.models",
            "--hidden-import",
            "app.routers",
            "--hidden-import",
            "app.routers.csv_router",
            "--hidden-import",
            "app.routers.template_router",
            "--hidden-import",
            "app.routers.auth_router",
            "--hidden-import",
            "app.routers.email_router",
            "--hidden-import",
            "app.routers.attachment_router",
            "--hidden-import",
            "app.routers.settings_router",
            "--hidden-import",
            "app.services",
            "--hidden-import",
            "app.services.persistence",
            "--hidden-import",
            "app.services.csv_service",
            "--hidden-import",
            "app.services.template_service",
            "--hidden-import",
            "app.services.auth_service",
            "--hidden-import",
            "app.services.gmail_service",
            "--hidden-import",
            "uvicorn.logging",
            "--hidden-import",
            "uvicorn.loops",
            "--hidden-import",
            "uvicorn.loops.auto",
            "--hidden-import",
            "uvicorn.protocols",
            "--hidden-import",
            "uvicorn.protocols.http",
            "--hidden-import",
            "uvicorn.protocols.http.auto",
            "--hidden-import",
            "uvicorn.protocols.http.h11_impl",
            "--hidden-import",
            "uvicorn.protocols.websockets",
            "--hidden-import",
            "uvicorn.protocols.websockets.auto",
            "--hidden-import",
            "uvicorn.lifespan",
            "--hidden-import",
            "uvicorn.lifespan.on",
            "--hidden-import",
            "uvicorn.lifespan.off",
            "run.py",
        ],
        cwd=str(BACKEND),
        check=True,
    )


def cleanup():
    print("=== [4/4] Cleaning up ===")
    if DIST_DEST.exists():
        shutil.rmtree(DIST_DEST)


if __name__ == "__main__":
    build_frontend()
    copy_dist()
    build_exe()
    cleanup()
    exe_path = BACKEND / "dist" / "AutoMailer.exe"
    print(f"\nDone! Executable at: {exe_path}")
