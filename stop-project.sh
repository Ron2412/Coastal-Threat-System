#!/bin/bash

# 🌊 Coastal Threat Dashboard - Stop Script
# This script stops all running services

echo "🛑 Stopping Coastal Threat Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop processes by PID files
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_status "Stopping Backend API (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID
        fi
        print_success "Backend API stopped"
    else
        print_warning "Backend API was not running"
    fi
    rm -f .backend.pid
fi

if [ -f ".ml-service.pid" ]; then
    ML_PID=$(cat .ml-service.pid)
    if kill -0 $ML_PID 2>/dev/null; then
        print_status "Stopping ML Service (PID: $ML_PID)..."
        kill $ML_PID
        sleep 2
        if kill -0 $ML_PID 2>/dev/null; then
            kill -9 $ML_PID
        fi
        print_success "ML Service stopped"
    else
        print_warning "ML Service was not running"
    fi
    rm -f .ml-service.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        print_status "Stopping Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill -9 $FRONTEND_PID
        fi
        print_success "Frontend stopped"
    else
        print_warning "Frontend was not running"
    fi
    rm -f .frontend.pid
fi

# Kill any remaining processes by name
print_status "Cleaning up any remaining processes..."

# Kill Node.js processes on our ports
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "python.*5001" 2>/dev/null || true

# Kill any remaining processes by port
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

print_success "🎉 All services stopped successfully!"
echo ""
echo "📊 Services Status:"
echo "  • Backend API:    ❌ Stopped"
echo "  • Frontend:       ❌ Stopped"
echo "  • ML Service:     ❌ Stopped"
echo ""
echo "🚀 To start again, run: ./start-project.sh"
