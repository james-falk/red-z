#!/bin/bash

# Fantasy Red Zone - Quick Setup Script

set -e

echo "🚀 Fantasy Red Zone Setup"
echo "========================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null
then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✓ pnpm found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Build shared package
echo ""
echo "🔨 Building shared package..."
cd packages/shared
pnpm build
cd ../..

# Check if .env files exist
echo ""
echo "🔍 Checking environment files..."

if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  apps/api/.env not found. Creating from example..."
    cp apps/api/env.example apps/api/.env
    echo "   Please edit apps/api/.env with your configuration"
fi

if [ ! -f "apps/web/.env" ]; then
    echo "⚠️  apps/web/.env not found. Creating from example..."
    cp apps/web/env.example apps/web/.env
    echo "   Please edit apps/web/.env with your configuration"
fi

# Check if PostgreSQL is running
echo ""
echo "🔍 Checking PostgreSQL..."

if command -v docker &> /dev/null; then
    if ! docker ps | grep -q fantasy-red-zone-postgres; then
        echo "⚠️  PostgreSQL not detected. Starting with Docker..."
        docker run -d \
          --name fantasy-red-zone-postgres \
          -e POSTGRES_USER=postgres \
          -e POSTGRES_PASSWORD=postgres \
          -e POSTGRES_DB=fantasy_red_zone \
          -p 5432:5432 \
          postgres:15-alpine
        
        echo "   Waiting for PostgreSQL to be ready..."
        sleep 5
    else
        echo "✓ PostgreSQL already running"
    fi
else
    echo "⚠️  Docker not found. Please ensure PostgreSQL is running manually."
fi

# Set up database
echo ""
echo "🗄️  Setting up database..."
cd apps/api
pnpm db:generate
pnpm db:push
pnpm db:seed
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit apps/api/.env and apps/web/.env with your configuration"
echo "   2. Set up Google OAuth credentials in apps/web/.env"
echo "   3. Run 'pnpm dev' to start development servers"
echo ""
echo "🌐 Access:"
echo "   - Frontend: http://localhost:3000"
echo "   - API: http://localhost:4000"
echo ""
echo "📚 See SETUP.md for detailed instructions"
