#!/usr/bin/env node

/**
 * CSV to Supabase Upload Script
 * 
 * This script helps you upload your CSV dataset to Supabase.
 * Make sure to:
 * 1. Set up your Supabase project
 * 2. Run the schema.sql in Supabase SQL Editor
 * 3. Update the configuration below
 * 4. Place your CSV file in the same directory
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import csv from 'csv-parser'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Supabase configuration - UPDATE THESE VALUES
const SUPABASE_URL = process.env.SUPABASE_URL || 'your_supabase_project_url'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key'

// CSV file path - UPDATE THIS TO YOUR CSV FILE NAME
const CSV_FILE_PATH = './your-coastal-data.csv'

// Column mapping - UPDATE THESE TO MATCH YOUR CSV COLUMNS
const COLUMN_MAPPING = {
  // Example mappings - adjust based on your CSV structure
  'Location_Name': 'name',
  'Country': 'country',
  'Latitude': 'lat',
  'Longitude': 'lng',
  'Region': 'region',
  'Port_Type': 'type',
  'Population': 'population',
  'Risk_Level': 'risk_level',
  'Threats': 'threats',
  'Description': 'description'
}

// Risk level mapping - adjust based on your data
const RISK_LEVEL_MAPPING = {
  'LOW': 'low',
  'MEDIUM': 'medium',
  'HIGH': 'high',
  'Low': 'low',
  'Medium': 'medium',
  'High': 'high'
}

// Port type mapping - adjust based on your data
const PORT_TYPE_MAPPING = {
  'MAJOR_PORT': 'major_port',
  'MINOR_PORT': 'minor_port',
  'OIL_TERMINAL': 'oil_terminal',
  'ISLAND_PORT': 'island_port',
  'Major Port': 'major_port',
  'Minor Port': 'minor_port',
  'Oil Terminal': 'oil_terminal',
  'Island Port': 'island_port'
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Function to transform CSV row to database format
function transformRow(row) {
  const transformed = {}
  
  // Map each column
  Object.keys(COLUMN_MAPPING).forEach(csvColumn => {
    const dbColumn = COLUMN_MAPPING[csvColumn]
    let value = row[csvColumn]
    
    // Handle special transformations
    switch (dbColumn) {
      case 'coordinates':
        const lat = parseFloat(row['Latitude'] || row['lat'] || 0)
        const lng = parseFloat(row['Longitude'] || row['lng'] || 0)
        transformed.coordinates = { lat, lng }
        break
        
      case 'risk_level':
        const riskValue = value?.toUpperCase()
        transformed.risk_level = RISK_LEVEL_MAPPING[riskValue] || 'medium'
        break
        
      case 'type':
        const typeValue = value?.toUpperCase()
        transformed.type = PORT_TYPE_MAPPING[typeValue] || 'minor_port'
        break
        
      case 'threats':
        // Handle threats as array - adjust based on your CSV format
        if (typeof value === 'string') {
          // If threats are comma-separated
          transformed.threats = value.split(',').map(t => t.trim()).filter(Boolean)
        } else if (Array.isArray(value)) {
          transformed.threats = value
        } else {
          transformed.threats = []
        }
        break
        
      case 'population':
        // Keep population as string or convert to number
        transformed.population = value || 'Unknown'
        break
        
      default:
        transformed[dbColumn] = value || null
    }
  })
  
  return transformed
}

// Function to upload data to Supabase
async function uploadToSupabase(data) {
  console.log(`\n📤 Uploading ${data.length} records to Supabase...`)
  
  try {
    // Clear existing data (optional - remove if you want to append)
    console.log('🗑️  Clearing existing data...')
    const { error: deleteError } = await supabase
      .from('coastal_locations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteError) {
      console.error('❌ Error clearing data:', deleteError)
      return
    }
    
    console.log('✅ Existing data cleared')
    
    // Upload new data in batches
    const BATCH_SIZE = 100
    let uploaded = 0
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      
      const { error } = await supabase
        .from('coastal_locations')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Error uploading batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)
        return
      }
      
      uploaded += batch.length
      console.log(`📊 Uploaded ${uploaded}/${data.length} records...`)
    }
    
    console.log('✅ All data uploaded successfully!')
    
  } catch (error) {
    console.error('❌ Upload failed:', error)
  }
}

// Main function
async function main() {
  console.log('🚀 CSV to Supabase Upload Script')
  console.log('================================')
  
  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`)
    console.log('\n📝 Please:')
    console.log('1. Place your CSV file in this directory')
    console.log('2. Update CSV_FILE_PATH in this script')
    console.log('3. Update COLUMN_MAPPING to match your CSV columns')
    return
  }
  
  // Check Supabase configuration
  if (SUPABASE_URL === 'your_supabase_project_url' || SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key') {
    console.error('❌ Supabase configuration not set')
    console.log('\n📝 Please:')
    console.log('1. Create a .env file with your Supabase credentials')
    console.log('2. Or update the configuration variables in this script')
    return
  }
  
  console.log(`📁 Reading CSV file: ${CSV_FILE_PATH}`)
  
  const data = []
  
  // Read and parse CSV
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      const transformed = transformRow(row)
      if (transformed.name && transformed.coordinates) {
        data.push(transformed)
      }
    })
    .on('end', async () => {
      console.log(`📊 Parsed ${data.length} records from CSV`)
      
      if (data.length === 0) {
        console.log('❌ No valid data found. Check your CSV format and column mapping.')
        return
      }
      
      // Show sample of transformed data
      console.log('\n📋 Sample transformed data:')
      console.log(JSON.stringify(data[0], null, 2))
      
      // Confirm upload
      console.log('\n❓ Proceed with upload? (y/n)')
      process.stdin.once('data', async (input) => {
        if (input.toString().trim().toLowerCase() === 'y') {
          await uploadToSupabase(data)
        } else {
          console.log('❌ Upload cancelled')
        }
        process.exit(0)
      })
    })
    .on('error', (error) => {
      console.error('❌ Error reading CSV:', error)
    })
}

// Run the script
main().catch(console.error)
