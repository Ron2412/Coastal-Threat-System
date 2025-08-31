// API utility functions
const API_BASE_URL = 'http://localhost:3001';

// Simple fetch function
const apiFetch = async (url, options = {}) => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const response = await fetch(url, config);
  return response;
};

// API functions
export const api = {
  // Coastal data endpoints
  getCoastalLocations: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/coastal/locations`);
    return response.json();
  },

  getLocationById: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/api/coastal/locations/${id}`);
    return response.json();
  },

  searchLocations: async (query) => {
    const response = await apiFetch(`${API_BASE_URL}/api/coastal/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  getCoastalStats: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/coastal/stats`);
    return response.json();
  },

  getLocationsByRisk: async (level) => {
    const response = await apiFetch(`${API_BASE_URL}/api/coastal/risk/${level}`);
    return response.json();
  },

  // Health check
  getHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
};

export default api;
