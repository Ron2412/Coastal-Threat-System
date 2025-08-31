import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = 3001;

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://vswnzvzmbbbscctuyfzu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzd256dnptYmJic2NjdHV5Znp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1ODcwNDMsImV4cCI6MjA1MjE2MzA0M30.qKLKKZFBfJKJGJKJGJKJGJKJGJKJGJKJGJKJGJKJGJK';


// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Enable CORS for all origins
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002', 
    'http://localhost:3003',
    'http://localhost:3005',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3005',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With']
}));

app.use(express.json());


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'coastal-threat-backend',
    version: '1.0.0'
  });
});

// Get all coastal locations (public for testing)
app.get('/api/coastal/locations', async (req, res) => {
  try {
    const { data: locations, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error fetching locations:', error);
      return res.status(500).json({ error: 'Failed to fetch locations' });
    }

    res.json(locations || []);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Get location by ID (public for testing)
app.get('/api/coastal/locations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data: location, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Search locations (public for testing)
app.get('/api/coastal/search', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase();
    
    if (!query) {
      const { data: locations, error } = await supabase
        .from('coastal_locations')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return res.json(locations || []);
    }
    
    const { data: filtered, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .or(`name.ilike.%${query}%,country.ilike.%${query}%,region.ilike.%${query}%,description.ilike.%${query}%`)
      .order('id');
    
    if (error) throw error;
    res.json(filtered || []);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get location statistics
app.get('/api/coastal/stats', async (req, res) => {
  try {
    const { data: locations, error } = await supabase
      .from('coastal_locations')
      .select('*');

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    const stats = {
      total_locations: locations?.length || 0,
      high_risk: locations?.filter(loc => loc.risk_level === 'high').length || 0,
      medium_risk: locations?.filter(loc => loc.risk_level === 'medium').length || 0,
      low_risk: locations?.filter(loc => loc.risk_level === 'low').length || 0,
      total_population: locations?.reduce((sum, loc) => sum + (loc.population || 0), 0) || 0,
      regions: [...new Set(locations?.map(loc => loc.region).filter(Boolean) || [])],
      threats: [...new Set(locations?.flatMap(loc => loc.threats || []).filter(Boolean) || [])]
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get locations by risk level
app.get('/api/coastal/risk/:level', async (req, res) => {
  try {
    const level = req.params.level.toLowerCase();
    const { data: filteredLocations, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .eq('risk_level', level)
      .order('id');
    
    if (error) throw error;
    
    if (!filteredLocations || filteredLocations.length === 0) {
      return res.status(404).json({ error: `No locations found with risk level: ${level}` });
    }
    
    res.json(filteredLocations);
  } catch (error) {
    console.error('Risk level filter error:', error);
    res.status(500).json({ error: 'Failed to filter by risk level' });
  }
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
