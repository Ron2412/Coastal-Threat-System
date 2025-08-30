#!/bin/bash

# 🌊 Coastal Threat Backend - Quick Start Script
# This script will set up your backend for the hackathon demo

set -e

echo "🚀 Starting Coastal Threat Backend Setup..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo "   Node.js: $(node -v)"
echo "   Python: $(python3 --version)"
echo ""

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo "📦 Installing Python dependencies..."
cd ml-service
pip3 install -r requirements.txt
cd ..

echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Please create one from env.example:"
    echo "   cp env.example .env"
    echo "   # Then edit .env with your Supabase and Firebase credentials"
    echo ""
    echo "📋 Required environment variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - FIREBASE_PROJECT_ID"
    echo "   - FIREBASE_PRIVATE_KEY_ID"
    echo "   - FIREBASE_PRIVATE_KEY"
    echo "   - FIREBASE_CLIENT_EMAIL"
    echo "   - FIREBASE_CLIENT_ID"
    echo "   - FIREBASE_CLIENT_X509_CERT_URL"
    echo ""
    echo "🔗 Get these from:"
    echo "   - Supabase: https://supabase.com"
    echo "   - Firebase: https://firebase.google.com"
    echo ""
    
    read -p "Do you want to continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Please configure your .env file and run this script again."
        exit 1
    fi
else
    echo "✅ .env file found"
fi

echo ""

# Database setup
echo "🗄️  Setting up database..."
if npm run setup-db &> /dev/null; then
    echo "✅ Database setup completed"
else
    echo "⚠️  Database setup may need manual verification"
    echo "   Check the output above for any errors"
fi

echo ""

# Generate mock data
echo "📊 Generating mock data..."
if npm run generate-mock-data &> /dev/null; then
    echo "✅ Mock data generated"
else
    echo "⚠️  Mock data generation may need manual verification"
    echo "   Check the output above for any errors"
fi

echo ""

# Create logs directory
mkdir -p logs

echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend: npm run dev"
echo "2. Start the ML service: cd ml-service && python3 app.py"
echo "3. Test the API: npm test"
echo ""
echo "🔗 Your services will be available at:"
echo "   - Backend: http://localhost:3000"
echo "   - ML Service: http://localhost:5000"
echo "   - Health Check: http://localhost:3000/health"
echo ""
echo "📚 For more information, see:"
echo "   - README.md - Project overview"
echo "   - DEPLOYMENT.md - Detailed deployment guide"
echo "   - test/test-api.js - API testing"
echo ""
echo "🚀 Happy hacking!"
