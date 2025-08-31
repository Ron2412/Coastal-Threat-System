#!/bin/bash

echo "🌊 Starting Coastal Threat Dashboard Services..."

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to start service if not running
start_service() {
    local service_name=$1
    local port=$2
    local directory=$3
    local command=$4
    
    if check_port $port; then
        echo "✅ $service_name already running on port $port"
    else
        echo "🚀 Starting $service_name on port $port..."
        cd $directory
        eval $command
        sleep 2
        if check_port $port; then
            echo "✅ $service_name started successfully"
        else
            echo "❌ Failed to start $service_name"
        fi
        cd - >/dev/null
    fi
}

# Start Backend API
start_service "Backend API" 3001 "backend" "nohup npm start > ../backend.log 2>&1 &"

# Start ML Service
start_service "ML Service" 5001 "ml-service" "nohup python3 simple_app.py > ../ml-service.log 2>&1 &"

# Start Frontend
echo "🚀 Starting Frontend..."
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
sleep 3

# Check which port frontend is using
FRONTEND_PORT=$(grep -o "http://localhost:[0-9]*" ../frontend.log | head -1 | grep -o "[0-9]*")
if [ ! -z "$FRONTEND_PORT" ]; then
    echo "✅ Frontend started on port $FRONTEND_PORT"
    echo ""
    echo "🎉 All services are running!"
    echo ""
    echo "📊 Service URLs:"
    echo "   Frontend:    http://localhost:$FRONTEND_PORT"
    echo "   Backend API: http://localhost:3001"
    echo "   ML Service:  http://localhost:5001"
    echo ""
    echo "🔍 API Endpoints:"
    echo "   Health:      http://localhost:3001/health"
    echo "   Locations:   http://localhost:3001/api/coastal/locations"
    echo "   ML Health:   http://localhost:5001/health"
    echo "   ML Models:   http://localhost:5001/models/info"
    echo ""
    echo "📋 Dashboard Features:"
    echo "   ✅ Interactive coastal threat map with real locations"
    echo "   ✅ AI-powered risk analysis and insights"
    echo "   ✅ Real-time system status monitoring"
    echo "   ✅ ML predictions for tide data"
    echo "   ✅ Location-based threat assessments"
    echo ""
    echo "🚀 Open http://localhost:$FRONTEND_PORT in your browser to view the dashboard!"
else
    echo "❌ Frontend failed to start"
fi

cd - >/dev/null