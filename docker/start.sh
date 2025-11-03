#!/bin/sh
set -e

echo "🚀 Starting ChainBill Application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until nc -z ${DATABASE_HOST:-localhost} ${DATABASE_PORT:-5432}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
cd /app/backend
npx prisma migrate deploy --schema=./Prisma/schema.prisma

# Start backend in background
echo "🔧 Starting backend server..."
cd /app/backend
node dist/main.js &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 10

# Start frontend
echo "🎨 Starting frontend server..."
cd /app/frontend
npm start &
FRONTEND_PID=$!

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID