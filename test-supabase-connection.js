#!/usr/bin/env node

/**
 * Test Supabase Connection
 * This script tests if your Supabase configuration is working
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Supabase Connection...')
console.log('================================')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.log('Please check your .env file has:')
  console.log('- SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('✅ Environment variables loaded')
console.log(`📡 Supabase URL: ${supabaseUrl}`)
console.log(`🔑 Service Key: ${supabaseServiceKey.substring(0, 20)}...`)

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    console.log('\n🔄 Testing connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  Table "coastal_locations" does not exist yet')
        console.log('📝 You need to run the schema.sql in Supabase first')
        return false
      } else {
        console.error('❌ Connection error:', error.message)
        return false
      }
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('✅ Table "coastal_locations" exists')
    
    // Test data retrieval
    const { data: locations, error: fetchError } = await supabase
      .from('coastal_locations')
      .select('*')
      .limit(5)
    
    if (fetchError) {
      console.error('❌ Data fetch error:', fetchError.message)
      return false
    }
    
    console.log(`✅ Data fetch successful! Found ${locations.length} locations`)
    
    if (locations.length > 0) {
      console.log('\n📋 Sample data:')
      console.log(JSON.stringify(locations[0], null, 2))
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

async function main() {
  const success = await testConnection()
  
  if (success) {
    console.log('\n🎉 Supabase connection test PASSED!')
    console.log('✅ Your configuration is working correctly')
    console.log('✅ Ready to upload CSV data and train models')
  } else {
    console.log('\n❌ Supabase connection test FAILED!')
    console.log('📝 Please check:')
    console.log('1. Your Supabase project is running')
    console.log('2. API keys are correct')
    console.log('3. Schema has been created')
  }
  
  process.exit(success ? 0 : 1)
}

main().catch(console.error)
