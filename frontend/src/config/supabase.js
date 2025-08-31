import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for coastal data
export const coastalDataAPI = {
  // Get all coastal locations
  async getLocations() {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Get location by ID
  async getLocationById(id) {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Search locations
  async searchLocations(query) {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .or(`name.ilike.%${query}%,country.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Get locations by country
  async getLocationsByCountry(country) {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .eq('country', country)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Get locations by region
  async getLocationsByRegion(region) {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .eq('region', region)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Get locations by risk level
  async getLocationsByRiskLevel(riskLevel) {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .eq('risk_level', riskLevel)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Get locations by threat type
  async getLocationsByThreat(threatType) {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('*')
      .contains('threats', [threatType])
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Get location statistics
  async getLocationStats() {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('*')
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      byCountry: {},
      byRegion: {},
      byRiskLevel: {},
      byType: {}
    }
    
    data.forEach(location => {
      // Count by country
      stats.byCountry[location.country] = (stats.byCountry[location.country] || 0) + 1
      
      // Count by region
      stats.byRegion[location.region] = (stats.byRegion[location.region] || 0) + 1
      
      // Count by risk level
      stats.byRiskLevel[location.risk_level] = (stats.byRiskLevel[location.risk_level] || 0) + 1
      
      // Count by type
      stats.byType[location.type] = (stats.byType[location.type] || 0) + 1
    })
    
    return stats
  },

  // Get available filter options
  async getFilters() {
    const { data, error } = await supabase
      .from('coastal_locations')
      .select('country, region, risk_level, type, threats')
    
    if (error) throw error
    
    const filters = {
      countries: [...new Set(data.map(loc => loc.country))].sort(),
      regions: [...new Set(data.map(loc => loc.region))].sort(),
      riskLevels: [...new Set(data.map(loc => loc.risk_level))].sort(),
      types: [...new Set(data.map(loc => loc.type))].sort(),
      threats: [...new Set(data.flatMap(loc => loc.threats || []))].sort()
    }
    
    return filters
  }
}

export default supabase
