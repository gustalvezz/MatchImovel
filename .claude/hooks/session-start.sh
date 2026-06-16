#!/bin/bash
set -euo pipefail

# Only run in remote (web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

# Backend: create venv and install Python deps
cd "$CLAUDE_PROJECT_DIR/backend"
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt

# Frontend: install Node deps
cd "$CLAUDE_PROJECT_DIR/frontend"
yarn install --silent --network-timeout 60000 || true
