const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensors');
const reportRoutes = require('./routes/reports');
const alertRoutes = require('./routes/alerts');
const predictionRoutes = require('./routes/predictions');
const analyticsRoutes = require('./routes/analytics');
const coastalRoutes = require('./routes/coastal');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Import services
const { initializeFirebase } = require('./services/firebase');
const { initializeSupabase } = require('./services/supabase');
const { startMockDataService } = require('./services/mockDataService');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'coastal-threat-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'coastal-threat-backend',
    version: '1.0.0'
  });
});

// Demo endpoint (no authentication required)
app.get('/demo', (req, res) => {
  res.status(200).json({
    message: 'Coastal Threat Backend Demo Mode',
    status: 'running',
    timestamp: new Date().toISOString(),
    features: {
      mockData: 'Generating sensor data every 30 seconds',
      mockReports: 'Generating citizen reports every 60 seconds',
      apiEndpoints: [
        '/api/data/sensors - Sensor data (requires auth)',
        '/api/data/reports - Citizen reports (requires auth)',
        '/api/alerts - Threat alerts (requires auth)',
        '/api/predictions - AI predictions (requires auth)',
        '/api/analytics - Analytics (requires auth)'
      ],
      demoMode: 'Running without Firebase/Supabase - all data is simulated'
    }
  });
});

// Demo sensor data endpoint (no authentication required)
app.get('/demo/sensors', async (req, res) => {
  try {
    const { getSensorData } = require('./services/supabase');
    const sensorData = await getSensorData({ limit: 10 });
    res.status(200).json({
      message: 'Latest Sensor Data (Demo Mode)',
      count: sensorData.length,
      data: sensorData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get sensor data',
      message: error.message
    });
  }
});

// Demo alerts endpoint (no authentication required)
app.get('/demo/alerts', async (req, res) => {
  try {
    const { getActiveAlerts } = require('./services/supabase');
    const alerts = await getActiveAlerts();
    res.status(200).json({
      message: 'Active Alerts (Demo Mode)',
      count: alerts.length,
      data: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get alerts',
      message: error.message
    });
  }
});

// Demo analytics endpoint (no authentication required)
app.get('/demo/analytics', async (req, res) => {
  try {
    const { getSensorData, getActiveAlerts } = require('./services/supabase');
    
    // Get latest sensor data
    const sensorData = await getSensorData({ limit: 50 });
    
    // Get active alerts
    const alerts = await getActiveAlerts();
    
    // Calculate analytics
    const waterLevels = sensorData.filter(d => d.type === 'water_level');
    const windData = sensorData.filter(d => d.type === 'wind');
    const rainfallData = sensorData.filter(d => d.type === 'rainfall');
    
    const analytics = {
      message: 'Coastal Threat Analytics (Demo Mode)',
      timestamp: new Date().toISOString(),
      overview: {
        totalSensors: sensorData.length,
        activeAlerts: alerts.length,
        lastUpdated: sensorData.length > 0 ? sensorData[0].timestamp : 'No data'
      },
      waterLevels: {
        count: waterLevels.length,
        average: waterLevels.length > 0 ? (waterLevels.reduce((sum, d) => sum + d.value, 0) / waterLevels.length).toFixed(3) : 0,
        max: waterLevels.length > 0 ? Math.max(...waterLevels.map(d => d.value)).toFixed(3) : 0,
        min: waterLevels.length > 0 ? Math.min(...waterLevels.map(d => d.value)).toFixed(3) : 0,
        threatLevel: waterLevels.length > 0 ? (waterLevels.some(d => d.value > 1.2) ? 'HIGH' : 'NORMAL') : 'UNKNOWN'
      },
      windConditions: {
        count: windData.length,
        average: windData.length > 0 ? (windData.reduce((sum, d) => sum + d.value, 0) / windData.length).toFixed(1) : 0,
        max: windData.length > 0 ? Math.max(...windData.map(d => d.value)).toFixed(1) : 0,
        threatLevel: windData.length > 0 ? (windData.some(d => d.value > 20) ? 'HIGH' : 'NORMAL') : 'UNKNOWN'
      },
      rainfall: {
        count: rainfallData.length,
        total: rainfallData.reduce((sum, d) => sum + d.value, 0).toFixed(1),
        max: rainfallData.length > 0 ? Math.max(...rainfallData.map(d => d.value)).toFixed(1) : 0,
        threatLevel: rainfallData.length > 0 ? (rainfallData.some(d => d.value > 50) ? 'HIGH' : 'NORMAL') : 'UNKNOWN'
      },
      threatAssessment: {
        overallRisk: alerts.length > 0 ? 'ELEVATED' : 'LOW',
        primaryThreats: alerts.map(a => a.type),
        recommendations: alerts.length > 0 ? [
          'Monitor water levels closely',
          'Prepare for potential flooding',
          'Stay informed about weather conditions'
        ] : [
          'Conditions are normal',
          'Continue routine monitoring',
          'No immediate threats detected'
        ]
      }
    };
    
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

// System status endpoint (no authentication required)
app.get('/status', (req, res) => {
  res.status(200).json({
    message: 'Coastal Threat Backend Status',
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    demoMode: {
      firebase: !process.env.FIREBASE_PROJECT_ID,
      supabase: !process.env.SUPABASE_URL,
      mockData: 'active',
      dataGeneration: 'every 30-60 seconds'
    },
    endpoints: {
      health: '/health',
      demo: '/demo',
      status: '/status',
      sensors: '/demo/sensors',
      alerts: '/demo/alerts',
      analytics: '/demo/analytics'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/coastal', coastalRoutes); // Public coastal data endpoints
app.use('/api/data/sensors', authenticateToken, sensorRoutes);
app.use('/api/data/reports', authenticateToken, reportRoutes);
app.use('/api/alerts', authenticateToken, alertRoutes);
app.use('/api/predictions', authenticateToken, predictionRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing Firebase...');
    const firebaseApp = await initializeFirebase();
    if (firebaseApp) {
      logger.info('Firebase initialized successfully');
    } else {
      logger.warn('Firebase not available - running in demo mode');
    }
    
    logger.info('Initializing Supabase...');
    const supabaseResult = await initializeSupabase();
    if (supabaseResult.supabase) {
      logger.info('Supabase initialized successfully');
    } else {
      logger.warn('Supabase not available - running in demo mode with mock data only');
    }
    
    logger.info('Starting mock data service...');
    startMockDataService();
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Coastal Threat Backend running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API Base: http://localhost:${PORT}/api`);
      logger.info(`🎯 Demo endpoints (no auth required):`);
      logger.info(`   - Demo overview: http://localhost:${PORT}/demo`);
      logger.info(`   - System status: http://localhost:${PORT}/status`);
      logger.info(`   - Sensor data: http://localhost:${PORT}/demo/sensors`);
      logger.info(`   - Active alerts: http://localhost:${PORT}/demo/alerts`);
      logger.info(`   - Analytics: http://localhost:${PORT}/demo/analytics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
