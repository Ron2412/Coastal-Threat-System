#!/usr/bin/env node

/**
 * Demo Test Script for Coastal Threat Backend
 * Tests all demo endpoints to show the system working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   Endpoint: ${endpoint}`);
    
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runDemoTests() {
  console.log('🚀 Coastal Threat Backend - Demo Test Suite');
  console.log('============================================');
  
  const tests = [
    { endpoint: '/health', description: 'Health Check' },
    { endpoint: '/demo', description: 'Demo Overview' },
    { endpoint: '/status', description: 'System Status' },
    { endpoint: '/demo/sensors', description: 'Sensor Data' },
    { endpoint: '/demo/alerts', description: 'Active Alerts' },
    { endpoint: '/demo/analytics', description: 'Threat Analytics' }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(test.endpoint, test.description);
    if (success) passed++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Your Coastal Threat Backend is working perfectly!');
    console.log('\n🌊 Demo Mode Features:');
    console.log('   • Real-time sensor data generation (every 30 seconds)');
    console.log('   • Citizen report generation (every 60 seconds)');
    console.log('   • Automated threat detection and alerting');
    console.log('   • Comprehensive analytics and risk assessment');
    console.log('   • No database setup required - pure mock data');
  } else {
    console.log('\n⚠️  Some tests failed. Check the server logs for details.');
  }
}

// Run the tests
runDemoTests().catch(console.error);
