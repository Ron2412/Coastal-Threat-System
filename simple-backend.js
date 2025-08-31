import express from 'express';
import cors from 'cors';
const app = express();
const port = 3001;

// Enable CORS for all origins
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002', 
    'http://localhost:3005',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3005',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Mock coastal locations data
const coastalLocations = [
  {
    id: 1,
    name: 'Mumbai',
    country: 'India',
    region: 'West Coast',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    risk_level: 'high',
    threats: ['flooding', 'storm_surge', 'erosion'],
    population: 20411000,
    description: 'Major financial hub with high coastal vulnerability'
  },
  {
    id: 2,
    name: 'Chennai',
    country: 'India', 
    region: 'East Coast',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    risk_level: 'high',
    threats: ['cyclones', 'flooding', 'erosion'],
    population: 7088000,
    description: 'Major port city vulnerable to cyclones'
  },
  {
    id: 3,
    name: 'Kolkata',
    country: 'India',
    region: 'East Coast', 
    coordinates: { lat: 22.5726, lng: 88.3639 },
    risk_level: 'high',
    threats: ['cyclones', 'flooding', 'sea_level_rise'],
    population: 4496000,
    description: 'River delta city with multiple coastal threats'
  },
  {
    id: 4,
    name: 'Cochin',
    country: 'India',
    region: 'West Coast',
    coordinates: { lat: 9.9312, lng: 76.2673 },
    risk_level: 'medium',
    threats: ['flooding', 'erosion'],
    population: 677000,
    description: 'Important port with moderate risk levels'
  },
  {
    id: 5,
    name: 'Mangalore',
    country: 'India',
    region: 'West Coast',
    coordinates: { lat: 12.9141, lng: 74.8560 },
    risk_level: 'medium', 
    threats: ['flooding', 'erosion'],
    population: 488968,
    description: 'Coastal city with growing industrial activity'
  },
  {
    id: 6,
    name: 'Paradip',
    country: 'India',
    region: 'East Coast',
    coordinates: { lat: 20.3100, lng: 86.6094 },
    risk_level: 'high',
    threats: ['cyclones', 'storm_surge', 'erosion'],
    population: 75000,
    description: 'Major port vulnerable to severe cyclones'
  },
  {
    id: 7,
    name: 'Visakhapatnam',
    country: 'India',
    region: 'East Coast',
    coordinates: { lat: 17.6868, lng: 83.2185 },
    risk_level: 'high',
    threats: ['cyclones', 'flooding', 'erosion'],
    population: 2035922,
    description: 'Industrial port city with high cyclone risk'
  },
  {
    id: 8,
    name: 'Tuticorin',
    country: 'India',
    region: 'South Coast',
    coordinates: { lat: 8.7642, lng: 78.1348 },
    risk_level: 'medium',
    threats: ['flooding', 'erosion'],
    population: 237817,
    description: 'Pearl fishing port with moderate threats'
  },
  {
    id: 9,
    name: 'Kandla',
    country: 'India',
    region: 'West Coast',
    coordinates: { lat: 23.0333, lng: 70.2167 },
    risk_level: 'medium',
    threats: ['flooding', 'erosion'],
    population: 100000,
    description: 'Major cargo port in Gujarat'
  },
  {
    id: 10,
    name: 'Marmagao',
    country: 'India',
    region: 'West Coast',
    coordinates: { lat: 15.4000, lng: 73.8000 },
    risk_level: 'medium',
    threats: ['flooding', 'erosion'],
    population: 100000,
    description: 'Iron ore export port in Goa'
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'coastal-threat-backend',
    version: '1.0.0'
  });
});

// Get all coastal locations
app.get('/api/coastal/locations', (req, res) => {
  res.json(coastalLocations);
});

// Get location by ID
app.get('/api/coastal/locations/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const location = coastalLocations.find(loc => loc.id === id);
  
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  res.json(location);
});

// Search locations
app.get('/api/coastal/search', (req, res) => {
  const query = req.query.q?.toLowerCase();
  
  if (!query) {
    return res.json(coastalLocations);
  }
  
  const filtered = coastalLocations.filter(location => 
    location.name.toLowerCase().includes(query) ||
    location.country.toLowerCase().includes(query) ||
    location.region.toLowerCase().includes(query) ||
    location.description.toLowerCase().includes(query)
  );
  
  res.json(filtered);
});

// Get location statistics
app.get('/api/coastal/stats', (req, res) => {
  const stats = {
    total: coastalLocations.length,
    byCountry: {},
    byRegion: {},
    byRiskLevel: {},
    averagePopulation: 0
  };
  
  let totalPopulation = 0;
  
  coastalLocations.forEach(location => {
    // Count by country
    stats.byCountry[location.country] = (stats.byCountry[location.country] || 0) + 1;
    
    // Count by region
    stats.byRegion[location.region] = (stats.byRegion[location.region] || 0) + 1;
    
    // Count by risk level
    stats.byRiskLevel[location.risk_level] = (stats.byRiskLevel[location.risk_level] || 0) + 1;
    
    // Sum population
    totalPopulation += location.population || 0;
  });
  
  stats.averagePopulation = Math.round(totalPopulation / coastalLocations.length);
  
  res.json(stats);
});

// Get locations by risk level
app.get('/api/coastal/risk/:level', (req, res) => {
  const riskLevel = req.params.level.toLowerCase();
  const filtered = coastalLocations.filter(location => 
    location.risk_level === riskLevel
  );
  
  res.json(filtered);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`🌊 Coastal Threat Backend API running on http://localhost:${port}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   Health: http://localhost:${port}/health`);
  console.log(`   Locations: http://localhost:${port}/api/coastal/locations`);
  console.log(`   Search: http://localhost:${port}/api/coastal/search?q=mumbai`);
  console.log(`   Stats: http://localhost:${port}/api/coastal/stats`);
});
