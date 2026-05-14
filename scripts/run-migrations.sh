#!/bin/sh
# Run Drizzle migrations against the target database
# Usage: DATABASE_URL=... ./scripts/run-migrations.sh
set -e
echo "Running Drizzle migrations..."
npx drizzle-kit migrate
echo "Migrations complete."
