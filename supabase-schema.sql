-- Coastal Threat Dashboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create coastal_locations table
CREATE TABLE IF NOT EXISTS coastal_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    coordinates JSONB NOT NULL, -- {lat: number, lng: number}
    region VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- major_port, minor_port, oil_terminal, island_port
    population VARCHAR(50),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    threats TEXT[] NOT NULL DEFAULT '{}', -- Array of threat types
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coastal_locations_country ON coastal_locations(country);
CREATE INDEX IF NOT EXISTS idx_coastal_locations_region ON coastal_locations(region);
CREATE INDEX IF NOT EXISTS idx_coastal_locations_risk_level ON coastal_locations(risk_level);
CREATE INDEX IF NOT EXISTS idx_coastal_locations_type ON coastal_locations(type);
CREATE INDEX IF NOT EXISTS idx_coastal_locations_threats ON coastal_locations USING GIN(threats);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coastal_locations_updated_at 
    BEFORE UPDATE ON coastal_locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - you can replace this with your CSV data)
INSERT INTO coastal_locations (name, country, coordinates, region, type, population, risk_level, threats, description) VALUES
('Mumbai', 'India', '{"lat": 19.0760, "lng": 72.8777}', 'Arabian Sea', 'major_port', '20.4M', 'high', ARRAY['flooding', 'storm_surge', 'erosion'], 'Major port city on the west coast of India'),
('Chennai', 'India', '{"lat": 13.0827, "lng": 80.2707}', 'Bay of Bengal', 'major_port', '11.0M', 'high', ARRAY['cyclones', 'flooding', 'erosion'], 'Major port city on the east coast of India'),
('Kolkata', 'India', '{"lat": 22.5726, "lng": 88.3639}', 'Bay of Bengal', 'major_port', '14.8M', 'high', ARRAY['cyclones', 'flooding', 'sea_level_rise'], 'Major port city in eastern India'),
('Cochin', 'India', '{"lat": 9.9312, "lng": 76.2673}', 'Arabian Sea', 'major_port', '2.1M', 'medium', ARRAY['flooding', 'erosion'], 'Major port city in Kerala'),
('Mangalore', 'India', '{"lat": 12.9141, "lng": 74.8560}', 'Arabian Sea', 'minor_port', '0.6M', 'medium', ARRAY['flooding', 'erosion'], 'Port city in Karnataka');

-- Create RLS (Row Level Security) policies
ALTER TABLE coastal_locations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to coastal locations
CREATE POLICY "Allow public read access to coastal_locations" ON coastal_locations
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete (optional - for admin features)
CREATE POLICY "Allow authenticated users to manage coastal_locations" ON coastal_locations
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a view for location statistics
CREATE OR REPLACE VIEW coastal_location_stats AS
SELECT 
    COUNT(*) as total_locations,
    COUNT(DISTINCT country) as total_countries,
    COUNT(DISTINCT region) as total_regions,
    COUNT(DISTINCT type) as total_types,
    COUNT(DISTINCT risk_level) as total_risk_levels,
    jsonb_object_agg(
        risk_level, 
        COUNT(*)::text
    ) FILTER (WHERE risk_level IS NOT NULL) as risk_level_distribution,
    jsonb_object_agg(
        type, 
        COUNT(*)::text
    ) FILTER (WHERE type IS NOT NULL) as type_distribution
FROM coastal_locations;

-- Grant access to the view
GRANT SELECT ON coastal_location_stats TO anon;
GRANT SELECT ON coastal_location_stats TO authenticated;
