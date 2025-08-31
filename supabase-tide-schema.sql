-- Tide Data Schema for Coastal Threat Dashboard
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tide_data table for time-series tide information
CREATE TABLE IF NOT EXISTS tide_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    port_name VARCHAR(100) NOT NULL,
    line_number INTEGER,
    raw_line TEXT,
    date_1 DATE,
    date_2 DATE,
    day_1 VARCHAR(10),
    day_2 VARCHAR(10),
    time_1 VARCHAR(10),
    time_2 VARCHAR(10),
    time_3 VARCHAR(10),
    time_4 VARCHAR(10),
    height_1 NUMERIC(5,2),
    height_2 NUMERIC(5,2),
    height_3 NUMERIC(5,2),
    height_4 NUMERIC(5,2),
    component_1 VARCHAR(50),
    component_2 VARCHAR(50),
    component_3 VARCHAR(50),
    component_4 VARCHAR(50),
    component_5 VARCHAR(50),
    component_6 VARCHAR(50),
    component_7 VARCHAR(50),
    component_8 VARCHAR(50),
    component_9 VARCHAR(50),
    component_10 VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tide_data_port_name ON tide_data(port_name);
CREATE INDEX IF NOT EXISTS idx_tide_data_date_1 ON tide_data(date_1);
CREATE INDEX IF NOT EXISTS idx_tide_data_date_2 ON tide_data(date_2);
CREATE INDEX IF NOT EXISTS idx_tide_data_line_number ON tide_data(line_number);

-- Create a normalized view for easier querying
CREATE OR REPLACE VIEW tide_data_normalized AS
SELECT 
    id,
    port_name,
    line_number,
    raw_line,
    date_1,
    date_2,
    day_1,
    day_2,
    tide_num,
    time,
    height,
    component,
    created_at
FROM (
    SELECT 
        id, port_name, line_number, raw_line, 
        date_1, date_2, day_1, day_2,
        1 as tide_num, time_1 as time, height_1 as height, component_1 as component,
        created_at
    FROM tide_data WHERE time_1 IS NOT NULL AND height_1 IS NOT NULL
    
    UNION ALL
    
    SELECT 
        id, port_name, line_number, raw_line, 
        date_1, date_2, day_1, day_2,
        2 as tide_num, time_2 as time, height_2 as height, component_2 as component,
        created_at
    FROM tide_data WHERE time_2 IS NOT NULL AND height_2 IS NOT NULL
    
    UNION ALL
    
    SELECT 
        id, port_name, line_number, raw_line, 
        date_1, date_2, day_1, day_2,
        3 as tide_num, time_3 as time, height_3 as height, component_3 as component,
        created_at
    FROM tide_data WHERE time_3 IS NOT NULL AND height_3 IS NOT NULL
    
    UNION ALL
    
    SELECT 
        id, port_name, line_number, raw_line, 
        date_1, date_2, day_1, day_2,
        4 as tide_num, time_4 as time, height_4 as height, component_4 as component,
        created_at
    FROM tide_data WHERE time_4 IS NOT NULL AND height_4 IS NOT NULL
) normalized_data;

-- Create RLS (Row Level Security) policies
ALTER TABLE tide_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access to tide data
CREATE POLICY "Allow public read access to tide_data" ON tide_data
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete (optional - for admin features)
CREATE POLICY "Allow authenticated users to manage tide_data" ON tide_data
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a view for tide statistics
CREATE OR REPLACE VIEW tide_statistics AS
SELECT 
    port_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT date_1) as total_dates,
    MIN(date_1) as earliest_date,
    MAX(date_1) as latest_date,
    AVG(height_1) as avg_height_1,
    AVG(height_2) as avg_height_2,
    AVG(height_3) as avg_height_3,
    AVG(height_4) as avg_height_4,
    MIN(LEAST(height_1, height_2, height_3, height_4)) as min_height,
    MAX(GREATEST(height_1, height_2, height_3, height_4)) as max_height
FROM tide_data 
WHERE date_1 IS NOT NULL
GROUP BY port_name
ORDER BY port_name;

-- Grant access to views
GRANT SELECT ON tide_data_normalized TO anon;
GRANT SELECT ON tide_data_normalized TO authenticated;
GRANT SELECT ON tide_statistics TO anon;
GRANT SELECT ON tide_statistics TO authenticated;

-- Insert sample data (optional - for testing)
INSERT INTO tide_data (port_name, line_number, raw_line, date_1, day_1, time_1, height_1, time_2, height_2, time_3, height_3, time_4, height_4) VALUES
('ADEN', 1, 'Sample tide data line 1', '2025-08-01', 'FRI', '0029', 1.3, '0412', 1.1, '1142', 1.9, '1745', 0.8),
('MUMBAI', 2, 'Sample tide data line 2', '2025-08-01', 'FRI', '0030', 1.5, '0415', 1.2, '1145', 2.1, '1750', 0.9);

-- Create a function to get tide data by port and date range
CREATE OR REPLACE FUNCTION get_tide_data_by_port_and_date(
    port_name_param VARCHAR(100),
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    port_name VARCHAR(100),
    date_1 DATE,
    day_1 VARCHAR(10),
    time_1 VARCHAR(10),
    height_1 NUMERIC(5,2),
    time_2 VARCHAR(10),
    height_2 NUMERIC(5,2),
    time_3 VARCHAR(10),
    height_3 NUMERIC(5,2),
    time_4 VARCHAR(10),
    height_4 NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.port_name,
        t.date_1,
        t.day_1,
        t.time_1,
        t.height_1,
        t.time_2,
        t.height_2,
        t.time_3,
        t.height_3,
        t.time_4,
        t.height_4
    FROM tide_data t
    WHERE t.port_name ILIKE '%' || port_name_param || '%'
    AND (start_date IS NULL OR t.date_1 >= start_date)
    AND (end_date IS NULL OR t.date_1 <= end_date)
    ORDER BY t.date_1, t.line_number;
END;
$$ LANGUAGE plpgsql;
