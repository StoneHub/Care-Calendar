#!/bin/bash

# Script to reset the LowDB JSON database by deleting all JSON files and running setup

echo "Resetting LowDB JSON database..."

# Navigate to the script directory
cd "$(dirname "$0")"

# Remove all JSON files in db/
echo "Removing all JSON files in db/..."
rm -f db/*.json

echo "All JSON database files removed."

# Run the setup script
echo "Running database setup..."
npm run setup-db

echo "Database reset completed successfully!"
echo "You can now restart the application with 'npm run dev:all'"
