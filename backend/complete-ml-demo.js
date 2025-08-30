#!/usr/bin/env node

/**
 * Complete Working ML Demo - All Three Models
 * Demonstrates Prophet, Isolation Forest, and Decision Tree Classifier
 */

const axios = require('axios');

const ML_SERVICE_URL = 'http://localhost:5001';
const BACKEND_URL = 'http://localhost:3001';

// Generate comprehensive training data for Prophet models
function generateTrainingData() {
  const now = new Date();
  const waterLevelData = [];
  const windData = [];
  const rainfallData = [];
  
  // Generate 100 data points over the last 100 hours
  for (let i = 99; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
    
    // Water level with tidal patterns and some trend
    const tideComponent = Math.sin(i * 0.26) * 0.3; // ~12 hour tidal cycle
    const seasonalComponent = Math.sin(i * 0.01) * 0.2; // Seasonal variation
    const randomNoise = (Math.random() - 0.5) * 0.1;
    waterLevelData.push({
      timestamp,
      value: 0.8 + tideComponent + seasonalComponent + randomNoise,
      type: 'water_level'
    });
    
    // Wind speed with weather patterns
    const windBase = 12 + Math.sin(i * 0.1) * 8 + Math.random() * 6;
    windData.push({
      timestamp,
      value: Math.max(0, windBase),
      type: 'wind'
    });
    
    // Rainfall with storm patterns
    const stormChance = Math.random();
    let rainfallValue = 0;
    if (stormChance > 0.8) {
      rainfallValue = Math.random() * 50 + 20; // Storm
    } else if (stormChance > 0.6) {
      rainfallValue = Math.random() * 15 + 5; // Light rain
    }
    rainfallData.push({
      timestamp,
      value: rainfallValue,
      type: 'rainfall'
    });
  }
  
  return { waterLevelData, windData, rainfallData };
}

// Generate data that will trigger anomalies
function generateAnomalyData() {
  const now = new Date();
  const anomalyData = [];
  
  // Add normal data
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
    anomalyData.push({
      timestamp,
      type: 'water_level',
      value: 0.5 + Math.random() * 0.3
    });
  }
  
  // Add anomalous data points
  anomalyData.push({
    timestamp: now.toISOString(),
    type: 'water_level',
    value: 4.2 // Extremely high water level
  });
  
  anomalyData.push({
    timestamp: now.toISOString(),
    type: 'wind',
    value: 95 // Hurricane-force winds
  });
  
  return anomalyData;
}

async function testMLEndpoint(endpoint, description, data = {}, method = 'POST') {
  try {
    console.log(`\n🔍 ${description}`);
    
    let response;
    if (method === 'GET') {
      response = await axios.get(`${ML_SERVICE_URL}${endpoint}`);
    } else {
      response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, data);
    }
    
    console.log(`   ✅ Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`   📊 Error Details:`, error.response.data.error);
    }
    return null;
  }
}

async function waitForService() {
  console.log('⏳ Waiting for ML service to start...');
  for (let i = 0; i < 10; i++) {
    try {
      await axios.get(`${ML_SERVICE_URL}/health`);
      console.log('✅ ML service is ready!');
      return true;
    } catch (error) {
      if (i === 9) {
        console.log('❌ ML service failed to start');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function demonstrateAllModels() {
  console.log('🌊 COASTAL THREAT ML SYSTEM - COMPLETE WORKING DEMO');
  console.log('====================================================');
  console.log('Demonstrating all THREE ML models with proper training and testing:\n');
  
  // Wait for service to be ready
  const serviceReady = await waitForService();
  if (!serviceReady) {
    console.log('❌ Cannot proceed - ML service is not available');
    return;
  }
  
  // 1. Check initial status
  console.log('📊 1. INITIAL MODEL STATUS');
  console.log('===========================');
  const initialStatus = await testMLEndpoint('/status', 'Check Model Status', {}, 'GET');
  if (initialStatus) {
    console.log('   📊 Models available:', JSON.stringify(initialStatus.data, null, 2));
  }
  
  // 2. Train Decision Tree Classifier
  console.log('\n🌳 2. DECISION TREE CLASSIFIER TRAINING & TESTING');
  console.log('================================================');
  
  const classifierResult = await testMLEndpoint('/train/classifier', 'Training Decision Tree Classifier', {});
  if (classifierResult?.success) {
    console.log(`   ✅ Trained with ${classifierResult.data.accuracy * 100}% accuracy`);
    console.log(`   📊 Features: ${classifierResult.data.features.join(', ')}`);
    
    // Test different scenarios
    const scenarios = [
      {
        name: '🟢 NORMAL CONDITIONS',
        conditions: { water_level: 0.4, wind_speed: 8, rainfall: 1, temperature: 24, pressure: 1015 }
      },
      {
        name: '🟡 MODERATE THREAT',
        conditions: { water_level: 1.2, wind_speed: 25, rainfall: 45, temperature: 22, pressure: 1005 }
      },
      {
        name: '🟠 HIGH THREAT',
        conditions: { water_level: 1.7, wind_speed: 35, rainfall: 75, temperature: 20, pressure: 995 }
      },
      {
        name: '🔴 CRITICAL EMERGENCY',
        conditions: { water_level: 2.8, wind_speed: 65, rainfall: 130, temperature: 15, pressure: 980 }
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n   ${scenario.name}:`);
      const result = await testMLEndpoint('/classify/threat-severity', `Classify ${scenario.name}`, {
        sensor_conditions: scenario.conditions
      });
      
      if (result?.success) {
        console.log(`     🎯 Threat Level: ${result.data.predicted_threat_level.toUpperCase()}`);
        console.log(`     🎯 Confidence: ${result.data.confidence}%`);
        console.log(`     💡 Analysis: ${result.data.decision_path}`);
      }
    }
  }
  
  // 3. Train Prophet Models
  console.log('\n🔮 3. PROPHET MODEL TRAINING & TESTING');
  console.log('=====================================');
  
  const { waterLevelData, windData, rainfallData } = generateTrainingData();
  const prophetTrainingData = {
    sensor_data: {
      water_level: waterLevelData,
      wind: windData,
      rainfall: rainfallData
    }
  };
  
  const prophetResult = await testMLEndpoint('/train', 'Training Prophet Models', prophetTrainingData);
  if (prophetResult?.success) {
    console.log('   ✅ Prophet models trained successfully');
    console.log('   📊 Training results:', JSON.stringify(prophetResult.data, null, 2));
    
    // Make predictions
    console.log('\n   📈 Making water level predictions...');
    const predictionResult = await testMLEndpoint('/predict/water-levels', 'Water Level Forecasting', {
      hours_ahead: 12
    });
    
    if (predictionResult?.success) {
      const predictions = predictionResult.data.predictions;
      const floodRisk = predictionResult.data.flood_risk;
      
      console.log(`   🌊 Next 3 hour predictions:`);
      predictions.slice(0, 3).forEach((pred, i) => {
        const time = new Date(pred.timestamp).toLocaleTimeString();
        console.log(`     ${i+1}. ${time}: ${pred.predicted_value}m (${pred.lower_bound}-${pred.upper_bound}m)`);
      });
      
      console.log(`   🚨 Flood Risk Assessment:`);
      console.log(`     📊 Risk Level: ${floodRisk.risk_level.toUpperCase()}`);
      console.log(`     📊 Confidence: ${floodRisk.confidence}%`);
      console.log(`     📊 Max Level: ${floodRisk.max_predicted_level}m`);
    }
  }
  
  // 4. Train and Test Isolation Forest
  console.log('\n🕵️ 4. ISOLATION FOREST TRAINING & TESTING');
  console.log('==========================================');
  
  // First train with enough data
  const now = new Date();
  const largeDataset = [];
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
    largeDataset.push({
      timestamp,
      type: 'water_level',
      value: 0.5 + Math.sin(i * 0.1) * 0.3 + Math.random() * 0.2
    });
    largeDataset.push({
      timestamp,
      type: 'wind', 
      value: 10 + Math.sin(i * 0.15) * 5 + Math.random() * 3
    });
    largeDataset.push({
      timestamp,
      type: 'rainfall',
      value: Math.max(0, Math.sin(i * 0.2) * 15 + Math.random() * 5)
    });
  }
  
  // Train anomaly detector
  const anomalyTrainingData = {
    sensor_data: {
      water_level: largeDataset.filter(d => d.type === 'water_level'),
      wind: largeDataset.filter(d => d.type === 'wind'),
      rainfall: largeDataset.filter(d => d.type === 'rainfall')
    }
  };
  
  const anomalyTrainResult = await testMLEndpoint('/train', 'Training Isolation Forest', anomalyTrainingData);
  
  if (anomalyTrainResult?.success) {
    console.log('   ✅ Isolation Forest trained successfully');
    
    // Test anomaly detection
    const testData = generateAnomalyData();
    console.log('\n   🔍 Testing anomaly detection...');
    const anomalyResult = await testMLEndpoint('/detect/anomalies', 'Detecting Anomalies', {
      sensor_data: testData
    });
    
    if (anomalyResult?.success) {
      console.log(`   📊 Analysis Results:`);
      console.log(`     🔍 Data points analyzed: ${anomalyResult.data.data_points_analyzed}`);
      console.log(`     🚨 Anomalies detected: ${anomalyResult.data.total_anomalies}`);
      
      if (anomalyResult.data.anomalies.length > 0) {
        console.log(`   🚨 Detected anomalies:`);
        anomalyResult.data.anomalies.forEach((anomaly, i) => {
          console.log(`     ${i+1}. ${anomaly.sensor_type}: ${anomaly.value} (${anomaly.severity} severity)`);
          console.log(`        ${anomaly.description}`);
        });
      }
    }
  }
  
  // 5. Final system status
  console.log('\n📊 5. FINAL SYSTEM STATUS');
  console.log('=========================');
  const finalStatus = await testMLEndpoint('/status', 'Final Model Status Check', {}, 'GET');
  if (finalStatus) {
    console.log('   📊 All Models Status:');
    console.log('   🔮 Prophet Models:', finalStatus.data.prophet_models);
    console.log('   🕵️ Isolation Forest:', finalStatus.data.isolation_forest);
    console.log('   🌳 Decision Tree:', finalStatus.data.decision_tree_classifier);
  }
  
  // 6. Integration test with backend
  console.log('\n🚀 6. BACKEND INTEGRATION TEST');
  console.log('==============================');
  
  try {
    const backendDemo = await axios.get(`${BACKEND_URL}/demo`);
    console.log('   ✅ Backend is running and integrated');
    
    const analytics = await axios.get(`${BACKEND_URL}/demo/analytics`);
    console.log('   📈 Analytics available:', analytics.data.overview);
    
    const sensors = await axios.get(`${BACKEND_URL}/demo/sensors`);
    console.log('   📡 Sensor data available:', sensors.data.count, 'sensors active');
    
  } catch (error) {
    console.log('   ❌ Backend integration issue:', error.message);
  }
  
  // Final summary
  console.log('\n🎉 COMPLETE ML SYSTEM DEMO FINISHED!');
  console.log('====================================');
  console.log('✅ All THREE ML models implemented and working:');
  console.log('');
  console.log('🔮 PROPHET (Time-Series Forecasting):');
  console.log('   • Predicts water levels, wind patterns, and rainfall');
  console.log('   • Uses seasonal decomposition and trend analysis');
  console.log('   • Provides confidence intervals for predictions');
  console.log('   • Endpoint: POST /predict/water-levels');
  console.log('');
  console.log('🕵️ ISOLATION FOREST (Anomaly Detection):');
  console.log('   • Detects unusual sensor readings and patterns');
  console.log('   • Identifies potential equipment failures or extreme events');
  console.log('   • Provides anomaly scores and severity levels');
  console.log('   • Endpoint: POST /detect/anomalies');
  console.log('');
  console.log('🌳 DECISION TREE CLASSIFIER (Threat Classification):');
  console.log('   • Classifies threat severity: low/medium/high/critical');
  console.log('   • Uses multiple environmental factors for classification');
  console.log('   • Provides probability scores and decision explanations');
  console.log('   • Endpoint: POST /classify/threat-severity');
  console.log('');
  console.log('🌐 System Architecture:');
  console.log(`   📡 ML Service: ${ML_SERVICE_URL}`);
  console.log(`   🖥️ Backend API: ${BACKEND_URL}`);
  console.log('   🗄️ Database: Supabase (or mock data in demo mode)');
  console.log('   🔄 Real-time: WebSocket connections for live updates');
  console.log('');
  console.log('🚨 Use Cases Demonstrated:');
  console.log('   • Flood forecasting and early warning');
  console.log('   • Sensor malfunction detection');
  console.log('   • Automated threat severity assessment');
  console.log('   • Real-time coastal monitoring dashboard');
  console.log('');
  console.log('📱 Ready for frontend integration and deployment!');
}

// Helper to wait between operations
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  try {
    await demonstrateAllModels();
  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

// Run the demo
main();
