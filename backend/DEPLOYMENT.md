# 🚀 Coastal Threat Backend - Deployment Guide

This guide will help you deploy the Coastal Threat Backend for your hackathon demo.

## 📋 Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed
- Supabase account and project
- Firebase project
- Git repository access

## 🏗️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd Coastal_Threat

# Install Node.js dependencies
npm install

# Install Python dependencies for ML service
cd ml-service
pip install -r requirements.txt
cd ..
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your credentials
nano .env
```

**Required Environment Variables:**

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_CLIENT_ID=your_firebase_client_id
FIREBASE_CLIENT_X509_CERT_URL=your_firebase_client_cert_url

# ML Service
FLASK_ML_SERVICE_URL=http://localhost:5000
```

### 3. Database Setup

```bash
# Run database setup script
npm run setup-db
```

This will create all necessary tables, indexes, and RLS policies in Supabase.

### 4. Generate Mock Data

```bash
# Generate historical and initial mock data
npm run generate-mock-data
```

This creates:
- 1 week of historical sensor data (hourly readings)
- Historical citizen reports
- Historical alerts
- Initial real-time data

## 🚀 Starting the Services

### 1. Start Express.js Backend

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:3000`

### 2. Start Flask ML Service

```bash
# In a new terminal
cd ml-service
python app.py
```

The ML service will be available at `http://localhost:5000`

### 3. Verify Services

```bash
# Test backend health
curl http://localhost:3000/health

# Test ML service health
curl http://localhost:5000/health
```

## 🧪 Testing the API

```bash
# Run API tests
npm test

# Or run the test script directly
node test/test-api.js
```

## 🌐 Production Deployment

### Option 1: Firebase Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init functions

# Deploy functions
firebase deploy --only functions
```

### Option 2: Railway/Render/Heroku

```bash
# Set environment variables in your platform dashboard
# Deploy using your platform's deployment method
```

### Option 3: Docker Deployment

```dockerfile
# Dockerfile for the backend
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t coastal-threat-backend .
docker run -p 3000:3000 coastal-threat-backend
```

## 🔧 Configuration for Different Environments

### Development
```bash
NODE_ENV=development
PORT=3000
FLASK_ML_SERVICE_URL=http://localhost:5000
```

### Staging
```bash
NODE_ENV=staging
PORT=3000
FLASK_ML_SERVICE_URL=https://your-staging-ml-service.com
```

### Production
```bash
NODE_ENV=production
PORT=3000
FLASK_ML_SERVICE_URL=https://your-production-ml-service.com
```

## 📊 Monitoring and Logs

### View Logs
```bash
# Backend logs
tail -f logs/combined.log
tail -f logs/error.log

# ML service logs (if using gunicorn)
tail -f ml-service/logs/app.log
```

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# ML service health
curl http://localhost:5000/health

# Database connection test
npm run test:db
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

2. **Supabase Connection Failed**
   - Verify your environment variables
   - Check Supabase project status
   - Ensure RLS policies are configured

3. **Firebase Auth Issues**
   - Verify service account credentials
   - Check Firebase project settings
   - Ensure Auth is enabled

4. **ML Service Not Responding**
   - Check if Python dependencies are installed
   - Verify port 5000 is available
   - Check ML service logs

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Enable ML service debug
FLASK_ENV=development python app.py
```

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use secure secret management in production
   - Rotate keys regularly

2. **API Security**
   - All endpoints require authentication
   - Role-based access control implemented
   - Input validation on all endpoints

3. **Database Security**
   - Row Level Security (RLS) enabled
   - Prepared statements used
   - Connection pooling configured

## 📈 Performance Optimization

1. **Database Indexes**
   - All queries are properly indexed
   - Composite indexes for complex queries
   - Spatial indexes for location-based queries

2. **Caching**
   - Redis can be added for session storage
   - Response caching for analytics
   - Database query result caching

3. **Scaling**
   - Stateless design for horizontal scaling
   - Load balancer ready
   - Microservice architecture

## 🎯 Hackathon Demo Checklist

- [ ] Backend running on port 3000
- [ ] ML service running on port 5000
- [ ] Database tables created and populated
- [ ] Mock data generated
- [ ] Health endpoints responding
- [ ] Authentication working
- [ ] API endpoints accessible
- [ ] Real-time data flowing
- [ ] Alerts being generated
- [ ] Predictions working

## 🆘 Getting Help

1. Check the logs for error messages
2. Verify environment variables
3. Test individual services
4. Check network connectivity
5. Review this deployment guide

## 🚀 Next Steps

After successful deployment:

1. **Frontend Integration**
   - Connect your React/Vue/Angular frontend
   - Implement real-time updates
   - Add interactive maps

2. **Advanced Features**
   - Custom ML models
   - Additional sensor types
   - Advanced analytics

3. **Production Readiness**
   - Load testing
   - Security audit
   - Performance monitoring

---

**🎉 Congratulations! Your Coastal Threat Backend is now deployed and ready for the hackathon demo!**
