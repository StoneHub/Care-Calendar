#!/bin/bash
cd "$(dirname "$0")"
export HOST=0.0.0.0
export PORT=8080
export FLASK_DEBUG=0
export FLASK_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
python3 main.py
