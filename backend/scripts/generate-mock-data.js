#!/usr/bin/env node

/**
 * Mock Data Generator for Coastal Threat Backend
 * Generates initial mock data for hackathon demo
 */

const { initializeSupabase, insertSensorData, insertCitizenReport, insertAlert } = require('../src/services/supabase');
const { generateInitialData } = require('../src/services/mockDataService');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Generate historical sensor data for the past week
 */
async function generateHistoricalSensorData() {
  console.log('📊 Generating historical sensor data...');
  
  const sensorConfigs = [
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

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  let totalReadings = 0;
  
  for (const sensor of sensorConfigs) {
    // Generate data every hour for the past week
    for (let time = new Date(oneWeekAgo); time <= now; time.setHours(time.getHours() + 1)) {
      const reading = generateHistoricalReading(sensor, new Date(time));
      
      try {
        await insertSensorData(reading);
        totalReadings++;
      } catch (error) {
        console.warn(`Failed to insert reading for ${sensor.id}: ${error.message}`);
      }
    }
  }
  
  console.log(`✅ Generated ${totalReadings} historical sensor readings`);
}

/**
 * Generate a single historical sensor reading
 */
function generateHistoricalReading(sensor, timestamp) {
  const baseTime = timestamp.getTime();
  
  switch (sensor.type) {
    case 'water_level':
      return generateHistoricalWaterLevel(sensor, timestamp, baseTime);
    case 'wind':
      return generateHistoricalWind(sensor, timestamp, baseTime);
    case 'rainfall':
      return generateHistoricalRainfall(sensor, timestamp, baseTime);
    default:
      return null;
  }
}

/**
 * Generate historical water level data
 */
function generateHistoricalWaterLevel(sensor, timestamp, baseTime) {
  const baseLevel = 0.5; // Base water level in meters
  
  // Add tide variation (12-hour cycle)
  const tideVariation = Math.sin((baseTime % (12 * 60 * 60 * 1000)) / (12 * 60 * 60 * 1000) * 2 * Math.PI) * 0.3;
  
  // Add seasonal variation (subtle)
  const seasonalVariation = Math.sin((baseTime / (365 * 24 * 60 * 60 * 1000)) * 2 * Math.PI) * 0.1;
  
  // Add random noise
  const randomVariation = (Math.random() - 0.5) * 0.05;
  
  // Add storm surge effect (randomly, more likely during certain hours)
  let stormSurge = 0;
  if (Math.random() < 0.02) { // 2% chance
    stormSurge = (Math.random() * 0.4) + 0.2;
  }
  
  const waterLevel = baseLevel + tideVariation + seasonalVariation + randomVariation + stormSurge;
  
  return {
    sensor_id: sensor.id,
    type: 'water_level',
    value: Math.max(0, waterLevel),
    unit: 'meters',
    location: sensor.location,
    coordinates: { lat: sensor.lat, lng: sensor.lng },
    timestamp: timestamp.toISOString()
  };
}

/**
 * Generate historical wind data
 */
function generateHistoricalWind(sensor, timestamp, baseTime) {
  const baseSpeed = 8; // Base wind speed in m/s
  
  // Add daily variation (stronger during day)
  const hour = timestamp.getHours();
  const dailyVariation = Math.sin((hour / 24) * 2 * Math.PI) * 2;
  
  // Add random variation
  const randomVariation = (Math.random() - 0.5) * 3;
  
  // Add gust factor (more likely during certain hours)
  let gustFactor = 0;
  if (Math.random() < 0.1) { // 10% chance
    gustFactor = (Math.random() * 4) + 2;
  }
  
  // Add storm conditions (rare, more likely during certain hours)
  let stormFactor = 0;
  if (Math.random() < 0.01) { // 1% chance
    stormFactor = (Math.random() * 12) + 8;
  }
  
  const windSpeed = baseSpeed + dailyVariation + randomVariation + gustFactor + stormFactor;
  
  return {
    sensor_id: sensor.id,
    type: 'wind',
    value: Math.max(0, windSpeed),
    unit: 'm/s',
    direction: Math.floor(Math.random() * 360),
    location: sensor.location,
    coordinates: { lat: sensor.lat, lng: sensor.lng },
    timestamp: timestamp.toISOString()
  };
}

/**
 * Generate historical rainfall data
 */
function generateHistoricalRainfall(sensor, timestamp, baseTime) {
  const baseRainfall = 0; // Base rainfall in mm/h
  
  // Add seasonal variation (more rain in summer)
  const month = timestamp.getMonth();
  const seasonalFactor = month >= 5 && month <= 9 ? 1.5 : 0.8; // Summer months
  
  // Add daily variation (more rain in afternoon)
  const hour = timestamp.getHours();
  const dailyFactor = hour >= 12 && hour <= 18 ? 1.3 : 0.7; // Afternoon
  
  let rainfall = baseRainfall;
  
  // Add random rainfall events
  if (Math.random() < 0.15 * seasonalFactor * dailyFactor) { // 15% base chance, modified by factors
    rainfall = (Math.random() * 20) + 5; // 5-25 mm/h
    
    // Add heavy rainfall events (rare)
    if (Math.random() < 0.1) { // 10% chance of heavy rain
      rainfall += (Math.random() * 50) + 25; // Additional 25-75 mm/h
    }
  }
  
  return {
    sensor_id: sensor.id,
    type: 'rainfall',
    value: Math.max(0, rainfall),
    unit: 'mm/h',
    location: sensor.location,
    coordinates: { lat: sensor.lat, lng: sensor.lng },
    timestamp: timestamp.toISOString()
  };
}

/**
 * Generate historical citizen reports
 */
async function generateHistoricalCitizenReports() {
  console.log('📝 Generating historical citizen reports...');
  
  const threatTypes = [
    { type: 'flooding', descriptions: [
      'Water levels rising rapidly in the area',
      'Street flooding observed near the beach',
      'Drainage system overwhelmed by rainfall',
      'Coastal flooding affecting local businesses',
      'Water seeping into basement of coastal property'
    ]},
    { type: 'erosion', descriptions: [
      'Beach erosion noticed along the shoreline',
      'Sand dunes showing signs of degradation',
      'Coastal vegetation being washed away',
      'Property line moving inland due to erosion',
      'Coastal walkway showing signs of instability'
    ]},
    { type: 'storm_damage', descriptions: [
      'High winds causing damage to beach structures',
      'Storm surge affecting coastal properties',
      'Heavy rainfall causing localized flooding',
      'Coastal infrastructure showing storm damage',
      'Beach furniture and equipment damaged by winds'
    ]}
  ];
  
  const mockCitizens = [
    'citizen_001', 'citizen_002', 'citizen_003', 'citizen_004', 'citizen_005',
    'citizen_006', 'citizen_007', 'citizen_008', 'citizen_009', 'citizen_010'
  ];
  
  const locations = [
    'Miami Beach Pier', 'South Beach', 'Key Biscayne', 'Coconut Grove',
    'Virginia Key', 'Fisher Island', 'Brickell', 'Downtown Miami',
    'North Beach', 'Bal Harbour'
  ];
  
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  let totalReports = 0;
  
  // Generate reports every 4-8 hours for the past week
  for (let time = new Date(oneWeekAgo); time <= now; time.setHours(time.getHours() + (4 + Math.random() * 4))) {
    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    const description = threatType.descriptions[Math.floor(Math.random() * threatType.descriptions.length)];
    const severity = Math.random() < 0.7 ? 'low' : Math.random() < 0.8 ? 'medium' : Math.random() < 0.95 ? 'high' : 'critical';
    const citizenId = mockCitizens[Math.floor(Math.random() * mockCitizens.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // Random coastal coordinates in Miami area
    const lat = 25.7 + (Math.random() - 0.5) * 0.4; // 25.5 to 25.9
    const lng = -80.2 + (Math.random() - 0.5) * 0.2; // -80.3 to -80.1
    
    const report = {
      citizen_id: citizenId,
      type: threatType.type,
      description: description,
      severity: severity,
      location: location,
      coordinates: { lat, lng },
      media_urls: [],
      timestamp: new Date(time).toISOString()
    };
    
    try {
      await insertCitizenReport(report);
      totalReports++;
    } catch (error) {
      console.warn(`Failed to insert report: ${error.message}`);
    }
  }
  
  console.log(`✅ Generated ${totalReports} historical citizen reports`);
}

/**
 * Generate historical alerts
 */
async function generateHistoricalAlerts() {
  console.log('🚨 Generating historical alerts...');
  
  const alertTypes = [
    { type: 'flooding', descriptions: [
      'High water levels detected in coastal area',
      'Flooding reported by multiple sensors',
      'Storm surge affecting coastal properties',
      'Heavy rainfall causing drainage issues'
    ]},
    { type: 'storm_damage', descriptions: [
      'High winds detected across coastal region',
      'Storm conditions affecting beach infrastructure',
      'Multiple wind sensors reporting dangerous speeds',
      'Coastal erosion accelerated by storm conditions'
    ]},
    { type: 'water_quality', descriptions: [
      'Water quality degradation detected',
      'Contamination reported in coastal waters',
      'Multiple reports of water quality issues',
      'Environmental monitoring showing concerns'
    ]}
  ];
  
  const locations = [
    'Miami Beach Pier', 'South Beach', 'Key Biscayne', 'Coconut Grove',
    'Virginia Key', 'Fisher Island', 'Brickell', 'Downtown Miami'
  ];
  
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  let totalAlerts = 0;
  
  // Generate alerts every 12-24 hours for the past week
  for (let time = new Date(oneWeekAgo); time <= now; time.setHours(time.getHours() + (12 + Math.random() * 12))) {
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const description = alertType.descriptions[Math.floor(Math.random() * alertType.descriptions.length)];
    const severity = Math.random() < 0.6 ? 'low' : Math.random() < 0.8 ? 'medium' : Math.random() < 0.95 ? 'high' : 'critical';
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // Random coastal coordinates
    const lat = 25.7 + (Math.random() - 0.5) * 0.4;
    const lng = -80.2 + (Math.random() - 0.5) * 0.2;
    
    const alert = {
      type: alertType.type,
      severity: severity,
      description: description,
      location: location,
      coordinates: { lat, lng },
      source: Math.random() < 0.7 ? 'sensor' : 'citizen',
      source_id: Math.random() < 0.7 ? `sensor_${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}` : null,
      status: Math.random() < 0.3 ? 'resolved' : 'active',
      created_at: new Date(time).toISOString()
    };
    
    try {
      await insertAlert(alert);
      totalAlerts++;
    } catch (error) {
      console.warn(`Failed to insert alert: ${error.message}`);
    }
  }
  
  console.log(`✅ Generated ${totalAlerts} historical alerts`);
}

/**
 * Main function to generate all mock data
 */
async function generateAllMockData() {
  try {
    console.log('🚀 Starting Coastal Threat Mock Data Generation...\n');
    
    // Initialize Supabase
    console.log('🔌 Initializing Supabase connection...');
    await initializeSupabase();
    console.log('✅ Supabase connected successfully\n');
    
    // Generate historical data
    await generateHistoricalSensorData();
    console.log('');
    
    await generateHistoricalCitizenReports();
    console.log('');
    
    await generateHistoricalAlerts();
    console.log('');
    
    // Generate initial real-time data
    console.log('🔄 Generating initial real-time data...');
    await generateInitialData();
    console.log('✅ Initial real-time data generated\n');
    
    console.log('🎉 Mock data generation completed successfully!');
    console.log('\n📊 Generated data includes:');
    console.log('   • 1 week of historical sensor readings (hourly)');
    console.log('   • Historical citizen reports (every 4-8 hours)');
    console.log('   • Historical alerts (every 12-24 hours)');
    console.log('   • Initial real-time data for current session');
    console.log('\n🚀 Your Coastal Threat Backend is ready for the hackathon demo!');
    
  } catch (error) {
    console.error('\n❌ Mock data generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateAllMockData();
}

module.exports = { generateAllMockData };
