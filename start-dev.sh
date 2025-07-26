#!/bin/bash

echo "🚀 Starting Account Service Application..."
echo ""

# Check if required dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "apps/server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd apps/server && npm install && cd ../..
fi

if [ ! -d "apps/client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd apps/client && npm install && cd ../..
fi

echo "🔥 Starting both servers..."
echo ""
echo "🌐 Client will be available at: http://localhost:3000"
echo "🔧 Server API will be available at: http://localhost:5000"
echo "📊 Health check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers concurrently
npm run dev
