#!/bin/bash
set -e
echo "Starting Auto Mailer..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/2] Starting backend on http://localhost:8000"
(
  cd "$SCRIPT_DIR/backend"
  python3 -m venv venv 2>/dev/null || true
  source venv/bin/activate
  pip install -r requirements.txt -q
  python run.py
) &
BACKEND_PID=$!

echo "[2/2] Starting frontend on http://localhost:5173"
(
  cd "$SCRIPT_DIR/frontend"
  npm install --silent
  npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "Both servers starting. Open http://localhost:5173 in your browser."
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
