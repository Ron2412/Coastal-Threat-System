#!/usr/bin/env node

/**
 * Tide Data to Supabase Upload Script
 * 
 * This script uploads your tide data CSV to Supabase.
 * Your CSV has columns: port_name, line_number, raw_line, time_1...time_4, height_1...height_4, etc.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import csv from 'csv-parser'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// CSV file path - UPDATE THIS TO YOUR CSV FILE NAME
const CSV_FILE_PATH = './your-tide-data.csv'

// Column mapping for your tide data CSV
const COLUMN_MAPPING = {
  'port_name': 'port_name',
  'line_number': 'line_number',
  'raw_line': 'raw_line',
  'date_1': 'date_1',
  'date_2': 'date_2',
  'day_1': 'day_1',
  'day_2': 'day_2',
  'time_1': 'time_1',
  'time_2': 'time_2',
  'time_3': 'time_3',
  'time_4': 'time_4',
  'height_1': 'height_1',
  'height_2': 'height_2',
  'height_3': 'height_3',
  'height_4': 'height_4',
  'component_1': 'component_1',
  'component_2': 'component_2',
  'component_3': 'component_3',
  'component_4': 'component_4',
  'component_5': 'component_5',
  'component_6': 'component_6',
  'component_7': 'component_7',
  'component_8': 'component_8',
  'component_9': 'component_9',
  'component_10': 'component_10'
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
      case 'line_number':
        // Convert line_number to integer
        transformed[dbColumn] = value ? parseInt(value) : null
        break
        
      case 'date_1':
      case 'date_2':
        // Convert date strings to Date objects
        if (value && value.trim()) {
          // Handle different date formats
          try {
            // Try parsing as YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              transformed[dbColumn] = value
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
              // Convert MM/DD/YYYY to YYYY-MM-DD
              const [month, day, year] = value.split('/')
              transformed[dbColumn] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
              // Convert MM-DD-YYYY to YYYY-MM-DD
              const [month, day, year] = value.split('-')
              transformed[dbColumn] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            } else {
              transformed[dbColumn] = null
            }
          } catch (error) {
            transformed[dbColumn] = null
          }
        } else {
          transformed[dbColumn] = null
        }
        break
        
      case 'height_1':
      case 'height_2':
      case 'height_3':
      case 'height_4':
        // Convert height to numeric
        if (value && value.trim()) {
          const height = parseFloat(value)
          transformed[dbColumn] = isNaN(height) ? null : height
        } else {
          transformed[dbColumn] = null
        }
        break
        
      case 'time_1':
      case 'time_2':
      case 'time_3':
      case 'time_4':
        // Keep time as string (format: HHMM)
        transformed[dbColumn] = value && value.trim() ? value.trim() : null
        break
        
      default:
        // For all other fields, keep as is
        transformed[dbColumn] = value && value.trim() ? value.trim() : null
    }
  })
  
  return transformed
}

// Function to upload data to Supabase
async function uploadToSupabase(data) {
  console.log(`\n📤 Uploading ${data.length} tide data records to Supabase...`)
  
  try {
    // Clear existing data (optional - remove if you want to append)
    console.log('🗑️  Clearing existing tide data...')
    const { error: deleteError } = await supabase
      .from('tide_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteError) {
      console.error('❌ Error clearing data:', deleteError)
      return
    }
    
    console.log('✅ Existing tide data cleared')
    
    // Upload new data in batches
    const BATCH_SIZE = 100
    let uploaded = 0
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      
      const { error } = await supabase
        .from('tide_data')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Error uploading batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)
        return
      }
      
      uploaded += batch.length
      console.log(`📊 Uploaded ${uploaded}/${data.length} records...`)
    }
    
    console.log('✅ All tide data uploaded successfully!')
    
    // Show summary statistics
    await showUploadSummary()
    
  } catch (error) {
    console.error('❌ Upload failed:', error)
  }
}

// Function to show upload summary
async function showUploadSummary() {
  try {
    const { data: stats, error } = await supabase
      .from('tide_statistics')
      .select('*')
    
    if (error) {
      console.error('❌ Error fetching statistics:', error)
      return
    }
    
    console.log('\n📊 Upload Summary:')
    console.log('==================')
    
    stats.forEach(stat => {
      console.log(`\n📍 Port: ${stat.port_name}`)
      console.log(`   📅 Date Range: ${stat.earliest_date} to ${stat.latest_date}`)
      console.log(`   📊 Total Records: ${stat.total_records}`)
      console.log(`   📈 Height Range: ${stat.min_height}m to ${stat.max_height}m`)
      console.log(`   📊 Average Heights: T1:${stat.avg_height_1?.toFixed(2)}m, T2:${stat.avg_height_2?.toFixed(2)}m, T3:${stat.avg_height_3?.toFixed(2)}m, T4:${stat.avg_height_4?.toFixed(2)}m`)
    })
    
  } catch (error) {
    console.error('❌ Error showing summary:', error)
  }
}

// Main function
async function main() {
  console.log('🌊 Tide Data to Supabase Upload Script')
  console.log('=====================================')
  
  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`)
    console.log('\n📝 Please:')
    console.log('1. Place your tide data CSV file in this directory')
    console.log('2. Update CSV_FILE_PATH in this script to match your filename')
    console.log('3. Ensure your CSV has the expected columns')
    return
  }
  
  // Check Supabase configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase configuration not set')
    console.log('\n📝 Please check your .env file has:')
    console.log('- SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
    return
  }
  
  console.log(`📁 Reading CSV file: ${CSV_FILE_PATH}`)
  
  const data = []
  
  // Read and parse CSV
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      const transformed = transformRow(row)
      if (transformed.port_name) {
        data.push(transformed)
      }
    })
    .on('end', async () => {
      console.log(`📊 Parsed ${data.length} tide data records from CSV`)
      
      if (data.length === 0) {
        console.log('❌ No valid data found. Check your CSV format.')
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
