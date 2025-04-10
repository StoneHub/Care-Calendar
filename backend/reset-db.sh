#!/bin/bash

# Script to reset the database by deleting the existing one and running setup

echo "Resetting database..."

# Navigate to the script directory
cd "$(dirname "$0")"

# Check if the database file exists
DB_FILE="db/care_calendar.sqlite3"
if [ -f "$DB_FILE" ]; then
    echo "Removing existing database file..."
    rm "$DB_FILE"
    echo "Database file removed."
else
    echo "No existing database file found."
fi

# Run the setup script
echo "Running database setup..."
npm run setup-db

# Run additional setup scripts
echo "Setting up history table..."
npm run setup-history

echo "Setting up unavailability table..."
npm run setup-unavailability

echo "Database reset completed successfully!"
echo "You can now restart the application with 'npm run dev:all'"
