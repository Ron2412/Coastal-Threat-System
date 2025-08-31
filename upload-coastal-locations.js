const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const coastalLocationsData = [
  {
    name: 'Mumbai',
    country: 'India',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    region: 'Arabian Sea',
    type: 'major_port',
    population: '20.4M',
    risk_level: 'high',
    threats: ['flooding', 'storm_surge', 'erosion', 'sea_level_rise'],
    description: 'Major financial and commercial hub on the west coast of India. Highly vulnerable to monsoon flooding and sea level rise.'
  },
  {
    name: 'Chennai',
    country: 'India',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    region: 'Bay of Bengal',
    type: 'major_port',
    population: '11.0M',
    risk_level: 'high',
    threats: ['cyclones', 'flooding', 'erosion', 'storm_surge'],
    description: 'Major port city on the east coast, frequently affected by cyclones and coastal flooding.'
  },
  {
    name: 'Kolkata',
    country: 'India',
    coordinates: { lat: 22.5726, lng: 88.3639 },
    region: 'Bay of Bengal',
    type: 'major_port',
    population: '14.8M',
    risk_level: 'high',
    threats: ['cyclones', 'flooding', 'sea_level_rise', 'erosion'],
    description: 'Major port city in eastern India, vulnerable to cyclones and river flooding.'
  },
  {
    name: 'Kochi',
    country: 'India',
    coordinates: { lat: 9.9312, lng: 76.2673 },
    region: 'Arabian Sea',
    type: 'major_port',
    population: '2.1M',
    risk_level: 'medium',
    threats: ['flooding', 'erosion', 'storm_surge'],
    description: 'Major port city in Kerala, known for its backwaters and spice trade.'
  },
  {
    name: 'Visakhapatnam',
    country: 'India',
    coordinates: { lat: 17.6868, lng: 83.2185 },
    region: 'Bay of Bengal',
    type: 'major_port',
    population: '2.0M',
    risk_level: 'medium',
    threats: ['cyclones', 'flooding', 'erosion'],
    description: 'Major port city and naval base on the east coast of India.'
  },
  {
    name: 'Kandla',
    country: 'India',
    coordinates: { lat: 23.0225, lng: 70.2208 },
    region: 'Arabian Sea',
    type: 'major_port',
    population: '0.1M',
    risk_level: 'medium',
    threats: ['storm_surge', 'erosion', 'flooding'],
    description: 'Major cargo port in Gujarat, important for trade with Middle East and Africa.'
  },
  {
    name: 'Paradip',
    country: 'India',
    coordinates: { lat: 20.3102, lng: 86.6169 },
    region: 'Bay of Bengal',
    type: 'major_port',
    population: '0.3M',
    risk_level: 'high',
    threats: ['cyclones', 'storm_surge', 'flooding'],
    description: 'Major port in Odisha, frequently affected by severe cyclones.'
  },
  {
    name: 'Tuticorin',
    country: 'India',
    coordinates: { lat: 8.7642, lng: 78.1348 },
    region: 'Bay of Bengal',
    type: 'major_port',
    population: '0.4M',
    risk_level: 'medium',
    threats: ['cyclones', 'erosion', 'flooding'],
    description: 'Important port city in Tamil Nadu for cargo and fishing.'
  },
  {
    name: 'Mangalore',
    country: 'India',
    coordinates: { lat: 12.9141, lng: 74.8560 },
    region: 'Arabian Sea',
    type: 'minor_port',
    population: '0.6M',
    risk_level: 'medium',
    threats: ['flooding', 'erosion', 'storm_surge'],
    description: 'Port city in Karnataka, important for coffee and spice exports.'
  },
  {
    name: 'Haldia',
    country: 'India',
    coordinates: { lat: 22.0583, lng: 88.0667 },
    region: 'Bay of Bengal',
    type: 'major_port',
    population: '0.2M',
    risk_level: 'high',
    threats: ['cyclones', 'flooding', 'erosion', 'sea_level_rise'],
    description: 'Major industrial port near Kolkata, vulnerable to cyclones and flooding.'
  },
  {
    name: 'Goa',
    country: 'India',
    coordinates: { lat: 15.2993, lng: 74.1240 },
    region: 'Arabian Sea',
    type: 'minor_port',
    population: '1.5M',
    risk_level: 'low',
    threats: ['erosion', 'flooding'],
    description: 'Popular tourist destination with beautiful beaches and Portuguese heritage.'
  },
  {
    name: 'Puducherry',
    country: 'India',
    coordinates: { lat: 11.9416, lng: 79.8083 },
    region: 'Bay of Bengal',
    type: 'minor_port',
    population: '1.2M',
    risk_level: 'medium',
    threats: ['cyclones', 'erosion', 'flooding'],
    description: 'Former French colony with unique cultural heritage, vulnerable to coastal erosion.'
  },
  {
    name: 'Karwar',
    country: 'India',
    coordinates: { lat: 14.8142, lng: 74.1292 },
    region: 'Arabian Sea',
    type: 'minor_port',
    population: '0.2M',
    risk_level: 'low',
    threats: ['erosion', 'flooding'],
    description: 'Naval base and port town in Karnataka with pristine beaches.'
  },
  {
    name: 'Kakinada',
    country: 'India',
    coordinates: { lat: 16.9891, lng: 82.2475 },
    region: 'Bay of Bengal',
    type: 'minor_port',
    population: '0.4M',
    risk_level: 'high',
    threats: ['cyclones', 'storm_surge', 'flooding'],
    description: 'Port city in Andhra Pradesh, important for natural gas and petroleum.'
  },
  {
    name: 'Machilipatnam',
    country: 'India',
    coordinates: { lat: 16.1875, lng: 81.1389 },
    region: 'Bay of Bengal',
    type: 'minor_port',
    population: '0.2M',
    risk_level: 'high',
    threats: ['cyclones', 'storm_surge', 'flooding', 'erosion'],
    description: 'Historic port city in Andhra Pradesh, highly vulnerable to cyclones.'
  }
]

async function uploadCoastalLocations() {
  try {
    console.log('Starting upload of coastal locations data...')
    
    // First, check if data already exists
    const { data: existingData, error: checkError } = await supabase
      .from('coastal_locations')
      .select('name')
      .limit(1)
    
    if (checkError) {
      console.error('Error checking existing data:', checkError)
      return
    }
    
    if (existingData && existingData.length > 0) {
      console.log('Data already exists. Clearing existing data first...')
      const { error: deleteError } = await supabase
        .from('coastal_locations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      
      if (deleteError) {
        console.error('Error clearing existing data:', deleteError)
        return
      }
    }
    
    // Insert new data
    const { data, error } = await supabase
      .from('coastal_locations')
      .insert(coastalLocationsData)
      .select()
    
    if (error) {
      console.error('Error uploading coastal locations:', error)
      return
    }
    
    console.log(`Successfully uploaded ${data.length} coastal locations:`)
    data.forEach(location => {
      console.log(`- ${location.name}, ${location.country} (${location.risk_level} risk)`)
    })
    
    // Verify the upload
    const { data: verifyData, error: verifyError } = await supabase
      .from('coastal_locations')
      .select('count')
    
    if (!verifyError) {
      console.log(`\nTotal locations in database: ${verifyData.length}`)
    }
    
    console.log('\nUpload completed successfully!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the upload
uploadCoastalLocations()