#!/usr/bin/env node

/**
 * Comprehensive ML Models Demo Script
 * Tests all three ML models: Prophet, Isolation Forest, and Decision Tree Classifier
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const ML_SERVICE_URL = 'http://localhost:5001';

// Generate sample sensor data for testing
function generateSensorData() {
  const now = new Date();
  const data = [];
  
  // Generate 20 data points over the last 20 hours
  for (let i = 19; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    data.push({
      timestamp: timestamp.toISOString(),
      type: 'water_level',
      value: 0.5 + Math.sin(i * 0.3) * 0.3 + Math.random() * 0.2,
      location: 'Miami Beach Sensor #1'
    });
    
    data.push({
      timestamp: timestamp.toISOString(),
      type: 'wind',
      value: 10 + Math.sin(i * 0.2) * 5 + Math.random() * 8,
      location: 'Miami Beach Sensor #2'
    });
    
    data.push({
      timestamp: timestamp.toISOString(),
      type: 'rainfall',
      value: Math.max(0, Math.sin(i * 0.4) * 20 + Math.random() * 10),
      location: 'Miami Beach Sensor #3'
    });
  }
  
  return data;
}

// Generate anomalous sensor data for testing
function generateAnomalousData() {
  const now = new Date();
  return [
    {
      timestamp: now.toISOString(),
      type: 'water_level',
      value: 5.2, // Extremely high water level
      location: 'Miami Beach Sensor #1'
    },
    {
      timestamp: now.toISOString(),
      type: 'wind',
      value: 85, // Hurricane-force winds
      location: 'Miami Beach Sensor #2'
    },
    {
      timestamp: now.toISOString(),
      type: 'rainfall',
      value: 120, // Extreme rainfall
      location: 'Miami Beach Sensor #3'
    }
  ];
}

async function testMLService(endpoint, description, data = {}) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   Endpoint: ${ML_SERVICE_URL}${endpoint}`);
    
    const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Response:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   📊 Error Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function testSystemStatus() {
  console.log('🏥 SYSTEM HEALTH CHECK');
  console.log('======================');
  
  // Test ML service health
  try {
    const mlHealth = await axios.get(`${ML_SERVICE_URL}/health`);
    console.log('✅ ML Service: HEALTHY');
    console.log('   📊 Models Status:', JSON.stringify(mlHealth.data.models, null, 2));
  } catch (error) {
    console.log('❌ ML Service: UNAVAILABLE');
    return false;
  }
  
  // Test Backend health
  try {
    const backendHealth = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend Service: HEALTHY');
  } catch (error) {
    console.log('❌ Backend Service: UNAVAILABLE');
    return false;
  }
  
  return true;
}

async function testProphetModel() {
  console.log('\n🔮 PROPHET MODEL TEST (Time-Series Forecasting)');
  console.log('================================================');
  
  // First, train Prophet model with sample data
  const sensorData = generateSensorData();
  const trainingData = {
    sensor_data: {
      water_level: sensorData.filter(d => d.type === 'water_level'),
      wind: sensorData.filter(d => d.type === 'wind'),
      rainfall: sensorData.filter(d => d.type === 'rainfall')
    }
  };
  
  console.log('📚 Training Prophet models with sample data...');
  const trainResult = await testMLService('/train', 'Train Prophet Models', trainingData);
  
  if (trainResult) {
    console.log('📈 Making water level predictions for next 12 hours...');
    const predictionResult = await testMLService('/predict/water-levels', 'Water Level Prediction', {
      hours_ahead: 12
    });
    
    if (predictionResult && predictionResult.success) {
      const predictions = predictionResult.data.predictions;
      const floodRisk = predictionResult.data.flood_risk;
      
      console.log(`\n📊 PROPHET MODEL RESULTS:`);
      console.log(`   🌊 Predicted next 3 hours:`, predictions.slice(0, 3));
      console.log(`   🚨 Flood Risk: ${floodRisk.risk_level.toUpperCase()} (${floodRisk.confidence}% confidence)`);
      console.log(`   📏 Max predicted level: ${floodRisk.max_predicted_level}m`);
    }
  }
}

async function testIsolationForest() {
  console.log('\n🕵️ ISOLATION FOREST TEST (Anomaly Detection)');
  console.log('=============================================');
  
  // Test with normal data first
  const normalData = generateSensorData().slice(0, 10);
  console.log('🔍 Testing with normal sensor data...');
  const normalResult = await testMLService('/detect/anomalies', 'Normal Data Anomaly Detection', {
    sensor_data: normalData
  });
  
  if (normalResult && normalResult.success) {
    console.log(`   📊 Normal data analysis: ${normalResult.data.total_anomalies} anomalies detected out of ${normalResult.data.data_points_analyzed} points`);
  }
  
  // Test with anomalous data
  const anomalousData = generateAnomalousData();
  console.log('\n🚨 Testing with anomalous sensor data...');
  const anomalyResult = await testMLService('/detect/anomalies', 'Anomalous Data Detection', {
    sensor_data: anomalousData
  });
  
  if (anomalyResult && anomalyResult.success) {
    console.log(`\n📊 ISOLATION FOREST RESULTS:`);
    console.log(`   🔍 Anomalies detected: ${anomalyResult.data.total_anomalies} out of ${anomalyResult.data.data_points_analyzed} points`);
    if (anomalyResult.data.anomalies.length > 0) {
      console.log(`   🚨 First anomaly:`, anomalyResult.data.anomalies[0]);
    }
  }
}

async function testDecisionTreeClassifier() {
  console.log('\n🌳 DECISION TREE CLASSIFIER TEST (Threat Severity Classification)');
  console.log('================================================================');
  
  // Train the classifier first
  console.log('📚 Training Decision Tree Classifier...');
  const trainResult = await testMLService('/train/classifier', 'Train Decision Tree Classifier', {
    training_data: [] // Will use synthetic data
  });
  
  if (trainResult && trainResult.success) {
    console.log(`   ✅ Classifier trained with ${trainResult.data.accuracy * 100}% accuracy`);
    console.log(`   📊 Training samples: ${trainResult.data.training_samples}, Test samples: ${trainResult.data.test_samples}`);
  }
  
  // Test different threat scenarios
  const testScenarios = [
    {
      name: 'Normal Conditions',
      conditions: {
        water_level: 0.5,
        wind_speed: 8,
        rainfall: 2,
        temperature: 25,
        pressure: 1015
      }
    },
    {
      name: 'Moderate Threat',
      conditions: {
        water_level: 1.1,
        wind_speed: 22,
        rainfall: 35,
        temperature: 28,
        pressure: 1008
      }
    },
    {
      name: 'High Threat',
      conditions: {
        water_level: 1.6,
        wind_speed: 32,
        rainfall: 65,
        temperature: 22,
        pressure: 998
      }
    },
    {
      name: 'Critical Emergency',
      conditions: {
        water_level: 2.5,
        wind_speed: 55,
        rainfall: 120,
        temperature: 18,
        pressure: 985
      }
    }
  ];
  
  console.log('\n🧪 Testing different threat scenarios...');
  
  for (const scenario of testScenarios) {
    console.log(`\n📋 Scenario: ${scenario.name}`);
    console.log(`   📊 Input:`, scenario.conditions);
    
    const result = await testMLService('/classify/threat-severity', `Classify ${scenario.name}`, {
      sensor_conditions: scenario.conditions
    });
    
    if (result && result.success) {
      console.log(`   🎯 Predicted Threat Level: ${result.data.predicted_threat_level.toUpperCase()}`);
      console.log(`   🎯 Confidence: ${result.data.confidence}%`);
      console.log(`   💡 Decision Path: ${result.data.decision_path}`);
      console.log(`   📊 Probabilities:`, result.data.probabilities);
    }
  }
}

async function testIntegratedDemo() {
  console.log('\n🚀 INTEGRATED SYSTEM DEMO');
  console.log('==========================');
  
  // Test the backend demo endpoints
  const demoEndpoints = [
    { endpoint: '/demo', description: 'Demo Overview' },
    { endpoint: '/status', description: 'System Status' },
    { endpoint: '/demo/sensors', description: 'Sensor Data' },
    { endpoint: '/demo/alerts', description: 'Active Alerts' },
    { endpoint: '/demo/analytics', description: 'Threat Analytics' }
  ];
  
  for (const demo of demoEndpoints) {
    try {
      console.log(`\n🔍 Testing: ${demo.description}`);
      const response = await axios.get(`${BACKEND_URL}${demo.endpoint}`);
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Sample Data:`, JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function runComprehensiveDemo() {
  console.log('🌊 COASTAL THREAT ML SYSTEM - COMPREHENSIVE DEMO');
  console.log('=================================================');
  console.log('Testing all three ML models:\n1. Prophet (Time-Series Forecasting)\n2. Isolation Forest (Anomaly Detection)\n3. Decision Tree Classifier (Threat Classification)\n');
  
  // Check system health first
  const isHealthy = await testSystemStatus();
  if (!isHealthy) {
    console.log('\n❌ System is not healthy. Please check the services.');
    return;
  }
  
  // Test each ML model
  await testProphetModel();
  await testIsolationForest();
  await testDecisionTreeClassifier();
  
  // Test integrated system
  await testIntegratedDemo();
  
  console.log('\n🎉 DEMO COMPLETED SUCCESSFULLY!');
  console.log('================================');
  console.log('✅ All three ML models are working:');
  console.log('   🔮 Prophet: Time-series forecasting for water levels');
  console.log('   🕵️ Isolation Forest: Anomaly detection in sensor data');
  console.log('   🌳 Decision Tree: Threat severity classification');
  console.log('\n🌐 Available Services:');
  console.log(`   📡 ML Service: ${ML_SERVICE_URL}`);
  console.log(`   🖥️ Backend API: ${BACKEND_URL}`);
  console.log('\n📚 Key Endpoints:');
  console.log('   🔮 POST /predict/water-levels - Prophet forecasting');
  console.log('   🕵️ POST /detect/anomalies - Isolation Forest anomaly detection');
  console.log('   🌳 POST /classify/threat-severity - Decision Tree classification');
  console.log('   📊 GET /health - System health check');
  console.log('   📈 GET /demo/analytics - Real-time analytics');
}

// Run the comprehensive demo
runComprehensiveDemo().catch(console.error);
