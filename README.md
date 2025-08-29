# 🌊 Coastal Threat Backend MVP

A real-time coastal monitoring system backend that ingests sensor data, citizen reports, and provides AI-driven predictions for coastal threats like flooding, erosion, and storms.

## 🚀 Features

- **Real-time Data Ingestion**: Mock sensor data streams (water levels, wind, rainfall)
- **Citizen Reports**: Text, media, and geotagged reports from citizens
- **AI Predictions**: Flask ML service with Prophet forecasting and anomaly detection
- **Real-time Alerts**: Firebase Cloud Messaging integration
- **Role-based Access**: Citizen and authority authentication
- **Cloud-Ready**: Supabase database with real-time sync

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Express.js    │    │   Flask ML      │
│   Dashboard     │◄──►│   Backend       │◄──►│   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Supabase      │
                       │   Database      │
                       └─────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Firebase Auth
- **ML Service**: Flask + Python
- **Real-time**: Supabase Realtime
- **Notifications**: Firebase Cloud Messaging

## 📋 Prerequisites

- Node.js 18+
- Python 3.8+
- Supabase account
- Firebase project

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Coastal_Threat
npm install
```

### 2. Environment Setup

```bash
cp env.example .env
# Fill in your Supabase and Firebase credentials
```

### 3. Database Setup

```bash
npm run setup-db
```

### 4. Start Backend

```bash
npm run dev
```

### 5. Start ML Service

```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

### 6. Generate Mock Data

```bash
npm run generate-mock-data
```

## 📚 API Endpoints

### Data APIs
- `GET/POST /api/data/sensors` - Sensor data management
- `GET/POST /api/data/reports` - Citizen reports
- `GET /api/data/events` - Unified event schema

### Intelligence APIs
- `GET /api/alerts` - Active alerts
- `GET /api/predictions` - AI predictions
- `GET /api/analytics` - Threat analytics

### Auth APIs
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FLASK_ML_SERVICE_URL`: ML service endpoint

### Mock Data Settings

- `MOCK_DATA_INTERVAL`: Sensor data generation interval (ms)
- `MOCK_SENSORS_COUNT`: Number of mock sensors
- `MOCK_REPORTS_INTERVAL`: Citizen report generation interval

## 🧪 Testing

```bash
npm test
```

## 📊 Data Schema

### Sensor Data
```json
{
  "sensor_id": "string",
  "type": "water_level|wind|rainfall",
  "value": "number",
  "unit": "string",
  "location": "geojson",
  "timestamp": "iso8601"
}
```

### Citizen Report
```json
{
  "report_id": "string",
  "citizen_id": "string",
  "type": "flooding|erosion|storm_damage",
  "description": "string",
  "media_urls": ["string"],
  "location": "geojson",
  "severity": "low|medium|high|critical",
  "timestamp": "iso8601"
}
```

## 🔮 AI Predictions

The Flask ML service provides:
- **Flood Forecasting**: Time-series prediction using Prophet
- **Anomaly Detection**: Isolation Forest for abnormal patterns
- **Cause Analysis**: Pattern correlation analysis

## 🚨 Alert System

- Real-time threat detection
- Severity-based alerting
- Push notifications via FCM
- Email alerts for authorities

## 🌐 Deployment

### Firebase Functions
```bash
firebase deploy --only functions
```

### Supabase
- Database automatically deployed
- Real-time subscriptions enabled
- Row Level Security configured

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For hackathon support, check the project issues or contact the team.
