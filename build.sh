#!/bin/bash
set -e
echo "Building Auto Mailer..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/backend"
source venv/bin/activate
pip install pyinstaller -q
cd "$SCRIPT_DIR"
python3 build.py

echo ""
echo "Build complete! The executable is at backend/dist/AutoMailer"
