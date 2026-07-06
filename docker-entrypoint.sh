#!/bin/sh
set -e

# Run prisma db push on startup
echo "Running database migrations..."
npx prisma db push --skip-generate 2>/dev/null || echo "Migration skipped (prisma not available or DB already synced)"

echo "Starting application..."
exec node server.js
