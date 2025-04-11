#!/bin/bash

# Script to reset the database and test the application

echo "Resetting database and testing the application..."

# Navigate to the backend directory
cd backend

# Make the reset script executable
chmod +x reset-db.sh

# Run the reset script
./reset-db.sh

# Return to the project root
cd ..

# Start the application
npm run dev:all
