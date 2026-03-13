#!/bin/zsh
# Mission Control Startup Script
# Starts the OpenClaw Dashboard server

# Configuration
PORT=${DASHBOARD_PORT:-19999}
TOKEN=${OPENCLAW_AUTH_TOKEN:-"change-me-insecure"}
WORKDIR="${HOME}/.openclaw/workspace/skills/openclaw-dashboard"

cd "$WORKDIR" || exit 1

# Start server
echo "Starting OpenClaw Dashboard on port $PORT..."
nohup env DASHBOARD_PORT="$PORT" OPENCLAW_AUTH_TOKEN="$TOKEN" node api-server.js > dashboard.log 2>&1 &
echo $! > dashboard.pid
echo "Dashboard started. PID: $(cat dashboard.pid)"
echo "Access URL: http://127.0.0.1:$PORT"
echo "Auth token: $TOKEN"
echo "Logs: $WORKDIR/dashboard.log"
