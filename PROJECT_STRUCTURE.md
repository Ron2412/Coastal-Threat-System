# 📁 Coastal Threat Backend - Project Structure

This document provides an overview of the project structure and key files.

## 🏗️ Root Directory

```
Coastal_Threat/
├── 📄 README.md                    # Project overview and setup instructions
├── 📄 package.json                 # Node.js dependencies and scripts
├── 📄 env.example                  # Environment variables template
├── 📄 quick-start.sh               # Automated setup script
├── 📄 DEPLOYMENT.md                # Detailed deployment guide
├── 📄 PROJECT_STRUCTURE.md         # This file
└── 📁 src/                         # Main source code
```

## 📁 Source Code (`src/`)

### 🔐 Authentication & Middleware
```
src/
├── 📁 middleware/
│   ├── 🔐 auth.js                  # JWT authentication & role-based access
│   └── 🚨 errorHandler.js          # Global error handling & validation
├── 📁 routes/                      # API route handlers
│   ├── 🔑 auth.js                  # User authentication endpoints
│   ├── 📊 sensors.js               # Sensor data management
│   ├── 📝 reports.js               # Citizen report management
│   ├── 🚨 alerts.js                # Threat alert management
│   ├── 🔮 predictions.js           # AI prediction endpoints
│   └── 📈 analytics.js             # Data analytics endpoints
└── 📁 services/                    # Business logic & external integrations
    ├── 🔥 firebase.js              # Firebase Auth & notifications
    ├── 🗄️ supabase.js              # Database operations & real-time
    └── 📡 mockDataService.js       # Mock data generation service
```

### 🚀 Main Application
```
src/
└── 🖥️ server.js                    # Express.js server & middleware setup
```

## 🤖 Machine Learning Service (`ml-service/`)

```
ml-service/
├── 📄 app.py                       # Flask ML service with Prophet & anomaly detection
├── 📄 requirements.txt              # Python dependencies
└── 📁 models/                      # Trained ML models (auto-created)
```

## 🛠️ Scripts & Utilities

```
scripts/
├── 🗄️ setup-database.js            # Database schema & RLS setup
└── 📊 generate-mock-data.js        # Historical & initial mock data generation

test/
└── 🧪 test-api.js                  # API endpoint testing script
```

## 📊 Key Features by Directory

### 🔐 **Authentication & Security** (`src/middleware/`)
- JWT token validation with Firebase
- Role-based access control (citizen, authority, admin)
- Input validation and sanitization
- Comprehensive error handling

### 📡 **Data Management** (`src/routes/`)
- **Sensors**: Real-time sensor data ingestion and retrieval
- **Reports**: Citizen threat reporting with media support
- **Alerts**: Automated threat detection and alerting
- **Predictions**: AI-driven flood and threat predictions
- **Analytics**: Comprehensive data analysis and insights

### 🔥 **External Services** (`src/services/`)
- **Firebase**: Authentication, push notifications, user management
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Mock Data**: Realistic coastal threat simulation

### 🤖 **AI & ML** (`ml-service/`)
- **Prophet**: Time-series forecasting for water levels
- **Isolation Forest**: Anomaly detection in sensor data
- **Risk Assessment**: Multi-factor threat evaluation
- **Real-time Predictions**: Live coastal threat analysis

## 🚀 Quick Start Commands

```bash
# 1. Automated setup (recommended)
./quick-start.sh

# 2. Manual setup
npm install
cp env.example .env
# Edit .env with your credentials
npm run setup-db
npm run generate-mock-data

# 3. Start services
npm run dev                    # Backend (port 3000)
cd ml-service && python app.py # ML service (port 5000)

# 4. Test everything
npm test
```

## 🔗 API Endpoints Overview

### Public Endpoints
- `GET /health` - Service health check

### Protected Endpoints (require authentication)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - User profile

### Data Endpoints
- `GET/POST /api/data/sensors` - Sensor data management
- `GET/POST /api/data/reports` - Citizen reports
- `GET /api/alerts` - Threat alerts
- `GET /api/predictions` - AI predictions
- `GET /api/analytics/*` - Data analytics

## 📊 Database Schema

### Core Tables
- **sensor_data** - Real-time sensor readings
- **citizen_reports** - User-submitted threat reports
- **alerts** - Automated threat alerts
- **predictions** - AI-generated predictions
- **users** - User profiles and roles
- **sensor_locations** - Sensor metadata
- **threat_zones** - Geographic risk areas

### Key Features
- Row Level Security (RLS) enabled
- Real-time subscriptions
- Spatial indexing for location queries
- Automatic timestamp management

## 🔧 Configuration Files

### Environment Variables (`.env`)
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
# ... other Firebase config

# ML Service
FLASK_ML_SERVICE_URL=http://localhost:5000
```

## 🧪 Testing & Development

### Test Scripts
```bash
npm test                    # Run API tests
node test/test-api.js      # Manual API testing
npm run setup-db           # Database setup
npm run generate-mock-data # Generate demo data
```

### Development Tools
- **Nodemon**: Auto-restart on file changes
- **Winston**: Comprehensive logging
- **Joi**: Input validation
- **Helmet**: Security middleware

## 🚨 Monitoring & Logs

### Log Files
```
logs/
├── 📄 combined.log        # All application logs
└── 📄 error.log          # Error-only logs
```

### Health Checks
- `GET /health` - Backend health
- `GET /ml-service/health` - ML service health
- Database connection monitoring
- Service dependency checks

## 🌐 Deployment Options

### Local Development
- Backend: `http://localhost:3000`
- ML Service: `http://localhost:5000`

### Production Deployment
- **Firebase Functions**: Serverless deployment
- **Railway/Render**: Platform-as-a-Service
- **Docker**: Containerized deployment
- **Traditional VPS**: Manual server setup

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Rate limiting ready
- Environment variable protection

## 📈 Performance Features

- Database connection pooling
- Optimized queries with indexes
- Real-time data streaming
- Efficient data pagination
- Caching-ready architecture
- Horizontal scaling support

---

**🎯 This structure provides a solid foundation for your hackathon demo with room for future enhancements!**
