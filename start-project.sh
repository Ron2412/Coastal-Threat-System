#!/bin/bash

# 🌊 Coastal Threat Dashboard - Complete Startup Script
# This script starts all services: Backend, Frontend, and ML Service

echo "🚀 Starting Coastal Threat Dashboard..."

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

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ] || [ ! -d "ml-service" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Kill any existing processes on our ports
print_status "Cleaning up existing processes..."
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "python.*5001" 2>/dev/null || true
sleep 2

# Start Backend
print_status "Starting Backend API (Node.js)..."
cd backend
if [ ! -d "node_modules" ]; then
    print_warning "Installing backend dependencies..."
    npm install
fi

# Start backend in background
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
print_status "Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "Backend API is running on http://localhost:3001"
else
    print_warning "Backend may not be fully started yet"
fi

# Start ML Service
print_status "Starting ML Service (Python)..."
cd ml-service

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Setting up ML service environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements-simple.txt
    pip install fastapi uvicorn
else
    source venv/bin/activate
fi

# Check if models exist
if [ ! -f "models/linear_regression.joblib" ]; then
    print_warning "Training ML models..."
    python train_tide_models.py
fi

# Start ML service in background
python app.py > ../ml-service.log 2>&1 &
ML_PID=$!
cd ..

# Wait for ML service to start
print_status "Waiting for ML service to start..."
sleep 5

# Check if ML service is running
if curl -s http://localhost:5001/health > /dev/null; then
    print_success "ML Service is running on http://localhost:5001"
else
    print_warning "ML service may not be fully started yet"
fi

# Start Frontend
print_status "Starting Frontend (React)..."
cd frontend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
print_status "Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Frontend is running on http://localhost:3000"
else
    print_warning "Frontend may not be fully started yet"
fi

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $ML_PID > .ml-service.pid
echo $FRONTEND_PID > .frontend.pid

# Display status
echo ""
print_success "🎉 Coastal Threat Dashboard is starting up!"
echo ""
echo "📊 Services Status:"
echo "  • Backend API:    http://localhost:3001"
echo "  • Frontend:       http://localhost:3000"
echo "  • ML Service:     http://localhost:5001"
echo ""
echo "📁 Log Files:"
echo "  • Backend:        ./backend.log"
echo "  • Frontend:       ./frontend.log"
echo "  • ML Service:     ./ml-service.log"
echo ""
echo "🛑 To stop all services, run: ./stop-project.sh"
echo ""

# Wait for user input to stop
echo "Press Ctrl+C to stop all services..."
trap 'echo ""; print_status "Stopping all services..."; ./stop-project.sh; exit' INT

# Keep script running
while true; do
    sleep 10
    # Check if services are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend has stopped"
    fi
    if ! kill -0 $ML_PID 2>/dev/null; then
        print_error "ML Service has stopped"
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend has stopped"
    fi
done
