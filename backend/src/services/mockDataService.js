const cron = require('node-cron');
const winston = require('winston');
const { insertSensorData, insertCitizenReport, insertAlert } = require('./supabase');
const { sendCoastalThreatAlert } = require('./firebase');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// Mock sensor configurations
const mockSensors = [
  { id: 'sensor_001', type: 'water_level', location: 'Miami Beach Pier', lat: 25.7617, lng: -80.1918 },
  { id: 'sensor_002', type: 'water_level', location: 'South Beach', lat: 25.7825, lng: -80.1344 },
  { id: 'sensor_003', type: 'wind', location: 'Key Biscayne', lat: 25.6925, lng: -80.1625 },
  { id: 'sensor_004', type: 'rainfall', location: 'Coconut Grove', lat: 25.7195, lng: -80.2473 },
  { id: 'sensor_005', type: 'water_level', location: 'Virginia Key', lat: 25.7314, lng: -80.1625 },
  { id: 'sensor_006', type: 'wind', location: 'Fisher Island', lat: 25.7600, lng: -80.1500 },
  { id: 'sensor_007', type: 'rainfall', location: 'Brickell', lat: 25.7617, lng: -80.1918 },
  { id: 'sensor_008', type: 'water_level', location: 'Downtown Miami', lat: 25.7617, lng: -80.1918 },
  { id: 'sensor_009', type: 'wind', location: 'North Beach', lat: 25.8600, lng: -80.1200 },
  { id: 'sensor_010', type: 'rainfall', location: 'Bal Harbour', lat: 25.8900, lng: -80.1200 }
];

// Mock citizen IDs
const mockCitizens = [
  'citizen_001', 'citizen_002', 'citizen_003', 'citizen_004', 'citizen_005',
  'citizen_006', 'citizen_007', 'citizen_008', 'citizen_009', 'citizen_010'
];

// Threat types and descriptions
const threatTypes = [
  { type: 'flooding', descriptions: [
    'Water levels rising rapidly in the area',
    'Street flooding observed near the beach',
    'Drainage system overwhelmed by rainfall',
    'Coastal flooding affecting local businesses'
  ]},
  { type: 'erosion', descriptions: [
    'Beach erosion noticed along the shoreline',
    'Sand dunes showing signs of degradation',
    'Coastal vegetation being washed away',
    'Property line moving inland due to erosion'
  ]},
  { type: 'storm_damage', descriptions: [
    'High winds causing damage to beach structures',
    'Storm surge affecting coastal properties',
    'Heavy rainfall causing localized flooding',
    'Coastal infrastructure showing storm damage'
  ]}
];

// Severity levels
const severityLevels = ['low', 'medium', 'high', 'critical'];

/**
 * Generate realistic water level data
 */
const generateWaterLevelData = (sensor) => {
  const baseLevel = 0.5; // Base water level in meters
  const tideVariation = Math.sin(Date.now() / (12 * 60 * 60 * 1000)) * 0.3; // 12-hour tide cycle
  const randomVariation = (Math.random() - 0.5) * 0.1; // Random noise
  
  let waterLevel = baseLevel + tideVariation + randomVariation;
  
  // Add storm surge effect (randomly)
  if (Math.random() < 0.05) { // 5% chance of storm surge
    waterLevel += (Math.random() * 0.5) + 0.3;
  }
  
  // Add seasonal variation
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const seasonalVariation = Math.sin(dayOfYear / 365 * 2 * Math.PI) * 0.1;
  waterLevel += seasonalVariation;
  
  return {
    sensor_id: sensor.id,
    type: 'water_level',
    value: Math.max(0, waterLevel),
    unit: 'meters',
    location: sensor.location,
    coordinates: { lat: sensor.lat, lng: sensor.lng },
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate realistic wind data
 */
const generateWindData = (sensor) => {
  const baseSpeed = 8; // Base wind speed in m/s
  const gustFactor = Math.random() < 0.1 ? (Math.random() * 5) + 2 : 0; // 10% chance of gust
  
  let windSpeed = baseSpeed + (Math.random() - 0.5) * 4 + gustFactor;
  
  // Add storm conditions (randomly)
  if (Math.random() < 0.03) { // 3% chance of storm
    windSpeed += (Math.random() * 15) + 10;
  }
  
  // Add time-based variation (stronger winds during day)
  const now = new Date();
  const hour = now.getHours();
  const timeVariation = (hour >= 6 && hour <= 18) ? 2 : -1; // Stronger during day
  windSpeed += timeVariation;
  
  return {
    sensor_id: sensor.id,
    type: 'wind',
    value: Math.max(0, windSpeed),
    unit: 'm/s',
    direction: Math.floor(Math.random() * 360), // Wind direction in degrees
    location: sensor.location,
    coordinates: { lat: sensor.lat, lng: sensor.lng },
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate realistic rainfall data
 */
const generateRainfallData = (sensor) => {
  const baseRainfall = 0; // Base rainfall in mm/h
  
  let rainfall = baseRainfall;
  
  // Add seasonal rainfall patterns (more rain in summer/fall)
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const seasonalFactor = (month >= 5 && month <= 10) ? 1.5 : 0.8; // More rain in summer/fall
  
  // Add random rainfall events
  if (Math.random() < 0.15 * seasonalFactor) { // Seasonal chance of rain
    rainfall = (Math.random() * 20) + 5; // 5-25 mm/h
    
    // Add heavy rainfall events (rare)
    if (Math.random() < 0.1) { // 10% chance of heavy rain
      rainfall += (Math.random() * 50) + 25; // Additional 25-75 mm/h
    }
    
    // Add tropical storm effects (very rare)
    if (Math.random() < 0.02) { // 2% chance of tropical storm
      rainfall += (Math.random() * 100) + 50; // Additional 50-150 mm/h
    }
  }
  
  return {
    sensor_id: sensor.id,
    type: 'rainfall',
    value: Math.max(0, rainfall),
    unit: 'mm/h',
    location: sensor.location,
    coordinates: { lat: sensor.lat, lng: sensor.lng },
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate sensor data based on type
 */
const generateSensorData = (sensor) => {
  switch (sensor.type) {
    case 'water_level':
      return generateWaterLevelData(sensor);
    case 'wind':
      return generateWindData(sensor);
    case 'rainfall':
      return generateRainfallData(sensor);
    default:
      return null;
  }
};

/**
 * Generate citizen report
 */
const generateCitizenReport = () => {
  const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
  const description = threatType.descriptions[Math.floor(Math.random() * threatType.descriptions.length)];
  const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
  const citizenId = mockCitizens[Math.floor(Math.random() * mockCitizens.length)];
  
  // Random coastal location in Miami area
  const lat = 25.7 + (Math.random() - 0.5) * 0.4; // 25.5 to 25.9
  const lng = -80.2 + (Math.random() - 0.5) * 0.2; // -80.3 to -80.1
  
  return {
    citizen_id: citizenId,
    type: threatType.type,
    description: description,
    severity: severity,
    location: `Miami Coastal Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    coordinates: { lat, lng },
    media_urls: [], // Mock reports don't have media for now
    timestamp: new Date().toISOString()
  };
};

/**
 * Check for threat conditions and generate alerts
 */
const checkThreatConditions = async (sensorData) => {
  try {
    // Check water level threats
    const waterLevelData = sensorData.filter(d => d.type === 'water_level');
    for (const data of waterLevelData) {
      if (data.value > 1.2) { // High water level threshold
        const alert = {
          type: 'flooding',
          severity: data.value > 1.5 ? 'critical' : 'high',
          description: `High water levels detected at ${data.location}: ${data.value.toFixed(2)}m`,
          location: data.location,
          coordinates: data.coordinates,
          source: 'sensor',
          source_id: data.sensor_id,
          status: 'active',
          created_at: new Date().toISOString()
        };
        
        const alertResult = await insertAlert(alert);
        if (alertResult && alertResult.id) {
          logger.info(`Flood alert stored: ${alertResult.id}`);
        } else {
          logger.info(`Flood alert generated (mock mode): ${alert.description}`);
        }
        
        const notificationResult = await sendCoastalThreatAlert(alert);
        if (notificationResult && notificationResult.success === false) {
          logger.info('Alert notification not sent (Firebase not available)');
        } else {
          logger.info('Alert notification sent successfully');
        }
      }
    }
    
    // Check wind threats
    const windData = sensorData.filter(d => d.type === 'wind');
    for (const data of windData) {
      if (data.value > 20) { // High wind threshold
        const alert = {
          type: 'storm_damage',
          severity: data.value > 30 ? 'critical' : 'high',
          description: `High winds detected at ${data.location}: ${data.value.toFixed(1)} m/s`,
          location: data.location,
          coordinates: data.coordinates,
          source: 'sensor',
          source_id: data.sensor_id,
          status: 'active',
          created_at: new Date().toISOString()
        };
        
        const alertResult = await insertAlert(alert);
        if (alertResult && alertResult.id) {
          logger.info(`Wind alert stored: ${alertResult.id}`);
        } else {
          logger.info(`Wind alert generated (mock mode): ${alert.description}`);
        }
        
        const notificationResult = await sendCoastalThreatAlert(alert);
        if (notificationResult && notificationResult.success === false) {
          logger.info('Alert notification not sent (Firebase not available)');
        } else {
          logger.info('Alert notification sent successfully');
        }
      }
    }
    
    // Check rainfall threats
    const rainfallData = sensorData.filter(d => d.type === 'rainfall');
    for (const data of rainfallData) {
      if (data.value > 50) { // Heavy rainfall threshold
        const alert = {
          type: 'flooding',
          severity: data.value > 80 ? 'critical' : 'high',
          description: `Heavy rainfall detected at ${data.location}: ${data.value.toFixed(1)} mm/h`,
          location: data.location,
          coordinates: data.coordinates,
          source: 'sensor',
          source_id: data.sensor_id,
          status: 'active',
          created_at: new Date().toISOString()
        };
        
        const alertResult = await insertAlert(alert);
        if (alertResult && alertResult.id) {
          logger.info(`Rainfall alert stored: ${alertResult.id}`);
        } else {
          logger.info(`Rainfall alert generated (mock mode): ${alert.description}`);
        }
        
        const notificationResult = await sendCoastalThreatAlert(alert);
        if (notificationResult && notificationResult.success === false) {
          logger.info('Alert notification not sent (Firebase not available)');
        } else {
          logger.info('Alert notification sent successfully');
        }
      }
    }
  } catch (error) {
    logger.error('Error checking threat conditions:', error);
  }
};

/**
 * Generate and store sensor data
 */
const generateSensorDataBatch = async () => {
  try {
    const sensorDataBatch = [];
    
    // Generate data for each sensor
    for (const sensor of mockSensors) {
      const data = generateSensorData(sensor);
      if (data) {
        sensorDataBatch.push(data);
      }
    }
    
    // Store all sensor data
    for (const data of sensorDataBatch) {
      const result = await insertSensorData(data);
      if (result && result.id) {
        logger.info(`Sensor data stored: ${result.id}`);
      } else {
        logger.info(`Sensor data generated (mock mode): ${data.sensor_id}`);
      }
    }
    
    logger.info(`Generated ${sensorDataBatch.length} sensor readings`);
    
    // Check for threat conditions
    await checkThreatConditions(sensorDataBatch);
    
  } catch (error) {
    logger.error('Error generating sensor data batch:', error);
  }
};

/**
 * Generate and store citizen reports
 */
const generateCitizenReportsBatch = async () => {
  try {
    const reportCount = Math.floor(Math.random() * 3) + 1; // 1-3 reports
    const reports = [];
    
    for (let i = 0; i < reportCount; i++) {
      const report = generateCitizenReport();
      reports.push(report);
    }
    
    // Store all reports
    for (const report of reports) {
      const result = await insertCitizenReport(report);
      if (result && result.id) {
        logger.info(`Citizen report stored: ${result.id}`);
      } else {
        logger.info(`Citizen report generated (mock mode): ${report.type}`);
      }
    }
    
    logger.info(`Generated ${reports.length} citizen reports`);
    
  } catch (error) {
    logger.error('Error generating citizen reports batch:', error);
  }
};

/**
 * Start the mock data service
 */
const startMockDataService = () => {
  logger.info('Starting mock data service...');
  
  // Schedule sensor data generation every 30 seconds (less frequent)
  cron.schedule('*/30 * * * * *', async () => {
    await generateSensorDataBatch();
  });
  
  // Schedule citizen reports generation every 60 seconds (less frequent)
  cron.schedule('*/60 * * * * *', async () => {
    await generateCitizenReportsBatch();
  });
  
  logger.info('Mock data service started successfully');
  logger.info('Sensor data: every 30 seconds');
  logger.info('Citizen reports: every 60 seconds');
  logger.info('Initial data generated - system ready for API calls');
};

/**
 * Stop the mock data service
 */
const stopMockDataService = () => {
  logger.info('Stopping mock data service...');
  // Note: cron jobs will continue until process ends
  // In production, you'd want to store cron job references and stop them
};

/**
 * Generate initial data set
 */
const generateInitialData = async () => {
  try {
    logger.info('Generating initial data set...');
    
    // Generate initial sensor data
    await generateSensorDataBatch();
    
    // Generate initial citizen reports
    await generateCitizenReportsBatch();
    
    logger.info('Initial data set generated successfully');
  } catch (error) {
    logger.error('Error generating initial data:', error);
  }
};

module.exports = {
  startMockDataService,
  stopMockDataService,
  generateInitialData,
  generateSensorDataBatch,
  generateCitizenReportsBatch
};
