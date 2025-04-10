#!/bin/bash

# Script to fix port conflicts and restart the application

echo "Fixing port conflicts and restarting the application..."

# Kill processes using port 5173 (frontend)
echo "Checking for processes using port 5173..."
FRONTEND_PID=$(lsof -t -i:5173 2>/dev/null)
if [ -n "$FRONTEND_PID" ]; then
    echo "Killing process $FRONTEND_PID using port 5173..."
    kill -9 $FRONTEND_PID
    echo "Process killed."
else
    echo "No process found using port 5173."
fi

# Kill processes using port 3001 (backend)
echo "Checking for processes using port 3001..."
BACKEND_PID=$(lsof -t -i:3001 2>/dev/null)
if [ -n "$BACKEND_PID" ]; then
    echo "Killing process $BACKEND_PID using port 3001..."
    kill -9 $BACKEND_PID
    echo "Process killed."
else
    echo "No process found using port 3001."
fi

echo "Ports cleared. Starting the application..."
npm run dev:all
