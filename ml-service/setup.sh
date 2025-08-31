#!/bin/bash

# 🌊 Tide Prediction ML Service Setup Script
# This script sets up the ML service environment

echo "🚀 Setting up Tide Prediction ML Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ pip3 found: $(pip3 --version)"

# Create virtual environment
echo "🔧 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p models
mkdir -p reports
mkdir -p logs

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << EOF
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ML Service Configuration
MODEL_OUTPUT_DIR=models
REPORT_OUTPUT_DIR=reports
LOG_LEVEL=INFO
EOF
    echo "📝 Please edit .env file with your Supabase credentials"
else
    echo "✅ .env file found"
fi

# Test Supabase connection
echo "🔌 Testing Supabase connection..."
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()

if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
    print('❌ Supabase credentials not configured in .env file')
    print('💡 Please add your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env')
    exit(1)
else:
    print('✅ Supabase credentials found in .env')
"

if [ $? -eq 0 ]; then
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Make sure your Supabase tide_data table is set up"
    echo "   2. Upload your CSV tide data to Supabase"
    echo "   3. Run: python train_tide_models.py"
    echo ""
    echo "📚 For more information, see README.md"
else
    echo "❌ Setup failed. Please check the errors above."
    exit 1
fi
