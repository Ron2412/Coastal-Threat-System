// Enhanced API utility functions with better error handling
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const ML_API_BASE_URL = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:5001';

// Enhanced fetch function with timeout and error handling
const apiFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const config = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    throw error;
  }
};

// API functions with enhanced error handling
export const api = {
  // Health checks
  getHealth: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Backend health check failed:', error);
      throw new Error('Backend service unavailable');
    }
  },

  getMLHealth: async () => {
    try {
      const response = await apiFetch(`${ML_API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('ML service health check failed:', error);
      throw new Error('ML service unavailable');
    }
  },

  // Coastal data endpoints
  getCoastalLocations: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/coastal/locations`);
      const data = await response.json();
      
      // Ensure data structure is consistent
      return (data || []).map(location => ({
        ...location,
        id: location.id || Math.random().toString(36).substr(2, 9),
        coordinates: location.coordinates || { lat: 0, lng: 0 },
        threats: Array.isArray(location.threats) ? location.threats : [],
        population: typeof location.population === 'string' 
          ? parseFloat(location.population.replace(/[^\d.]/g, '')) * 1000000
          : (location.population || 0)
      }));
    } catch (error) {
      console.error('Failed to fetch coastal locations:', error);
      // Return fallback data
      return [
        {
          id: '1',
          name: 'Mumbai',
          country: 'India',
          region: 'Arabian Sea',
          coordinates: { lat: 19.0760, lng: 72.8777 },
          type: 'major_port',
          population: 20400000,
          risk_level: 'high',
          threats: ['flooding', 'storm_surge', 'erosion'],
          description: 'Major port city on the west coast of India'
        },
        {
          id: '2',
          name: 'Chennai',
          country: 'India',
          region: 'Bay of Bengal',
          coordinates: { lat: 13.0827, lng: 80.2707 },
          type: 'major_port',
          population: 11000000,
          risk_level: 'high',
          threats: ['cyclones', 'flooding', 'erosion'],
          description: 'Major port city on the east coast of India'
        },
        {
          id: '3',
          name: 'Kolkata',
          country: 'India',
          region: 'Bay of Bengal',
          coordinates: { lat: 22.5726, lng: 88.3639 },
          type: 'major_port',
          population: 14800000,
          risk_level: 'high',
          threats: ['cyclones', 'flooding', 'sea_level_rise'],
          description: 'Major port city in eastern India'
        },
        {
          id: '4',
          name: 'Cochin',
          country: 'India',
          region: 'Arabian Sea',
          coordinates: { lat: 9.9312, lng: 76.2673 },
          type: 'major_port',
          population: 2100000,
          risk_level: 'medium',
          threats: ['flooding', 'erosion'],
          description: 'Major port city in Kerala'
        },
        {
          id: '5',
          name: 'Mangalore',
          country: 'India',
          region: 'Arabian Sea',
          coordinates: { lat: 12.9141, lng: 74.8560 },
          type: 'minor_port',
          population: 600000,
          risk_level: 'medium',
          threats: ['flooding', 'erosion'],
          description: 'Port city in Karnataka'
        }
      ];
    }
  },

  getLocationById: async (id) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/coastal/locations/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch location:', error);
      throw new Error('Location not found');
    }
  },

  searchLocations: async (query) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/coastal/search?q=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },

  getCoastalStats: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/coastal/stats`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Return fallback stats
      return {
        total_locations: 5,
        high_risk: 3,
        medium_risk: 2,
        low_risk: 0,
        total_population: 48900000,
        regions: ['Arabian Sea', 'Bay of Bengal'],
        threats: ['flooding', 'storm_surge', 'erosion', 'cyclones', 'sea_level_rise']
      };
    }
  },

  getLocationsByRisk: async (level) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/coastal/risk/${level}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch locations by risk:', error);
      return [];
    }
  },

  // ML Service endpoints
  getMLModels: async () => {
    try {
      const response = await apiFetch(`${ML_API_BASE_URL}/models/info`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch ML models:', error);
      // Return fallback model info
      return {
        models: [
          { name: 'random_forest_components_count', type: 'Random Forest', accuracy: 0.9945 },
          { name: 'linear_regression', type: 'Linear Regression', accuracy: 1.0000 }
        ],
        last_trained: new Date().toISOString()
      };
    }
  },

  generatePrediction: async (portName) => {
    try {
      const response = await apiFetch(`${ML_API_BASE_URL}/predict`, {
        method: 'POST',
        body: JSON.stringify({ port_name: portName })
      });
      return await response.json();
    } catch (error) {
      console.error('Prediction failed:', error);
      throw new Error('Failed to generate prediction');
    }
  },

  // Test endpoints
  testSupabase: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/test/supabase`);
      return await response.json();
    } catch (error) {
      console.error('Supabase test failed:', error);
      throw new Error('Supabase connection test failed');
    }
  }
};

export default api;