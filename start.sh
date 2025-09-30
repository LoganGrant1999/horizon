#!/bin/bash

echo "🚀 Starting Health Heatmap Tracker..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Start Docker services
echo "📦 Starting Docker services (PostgreSQL + MinIO)..."
docker compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
cd apps/api
npm run prisma:migrate

# Seed database
echo "🌱 Seeding database with demo data..."
npm run prisma:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Now run these commands in separate terminal windows:"
echo ""
echo "  Terminal 1 (API):"
echo "  cd /Users/logangrant/Desktop/strat/horizon/apps/api && npm run dev"
echo ""
echo "  Terminal 2 (Web):"
echo "  cd /Users/logangrant/Desktop/strat/horizon/apps/web && npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser"
echo ""