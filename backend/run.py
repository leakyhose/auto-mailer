import sys
import socket
import webbrowser
import threading

import uvicorn


def _find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


if __name__ == "__main__":
    if getattr(sys, "frozen", False):
        # Production / .exe mode
        from app.main import app as application

        port = _find_free_port()
        timer = threading.Timer(1.5, webbrowser.open, args=[f"http://localhost:{port}"])
        timer.daemon = True
        timer.start()
        uvicorn.run(application, host="127.0.0.1", port=port, log_level="info")
    else:
        # Development mode
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
