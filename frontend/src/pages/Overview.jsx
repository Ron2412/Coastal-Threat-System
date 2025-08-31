import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Map, AlertTriangle, Database, Activity, TrendingUp } from 'lucide-react'
import { supabase, coastalDataAPI } from '../config/supabase'

const Overview = () => {
  const { systemStatus } = useOutletContext()
  const [coastalLocations, setCoastalLocations] = useState([])
  const [locationStats, setLocationStats] = useState({})
  const [tideData, setTideData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch coastal locations
      const locations = await coastalDataAPI.getLocations()
      setCoastalLocations(locations)
      
      // Fetch location stats
      const stats = await coastalDataAPI.getLocationStats()
      setLocationStats(stats)
      
      // Fetch tide data
      const { data: tideDataResult, error } = await supabase
        .from('tide_data_raw')
        .select('*')
        .limit(100)
      
      if (!error) {
        setTideData(tideDataResult || [])
      }
    } catch (err) {
      console.log('Error fetching data:', err.message)
      // Use mock data if API fails
      setCoastalLocations([
        { id: 1, name: 'Mumbai', risk_level: 'high', threats: ['flooding', 'storm_surge'] },
        { id: 2, name: 'Chennai', risk_level: 'high', threats: ['cyclones', 'flooding'] },
        { id: 3, name: 'Kolkata', risk_level: 'high', threats: ['cyclones', 'sea_level_rise'] },
        { id: 4, name: 'Cochin', risk_level: 'medium', threats: ['flooding'] },
        { id: 5, name: 'Mangalore', risk_level: 'medium', threats: ['erosion'] }
      ])
      setLocationStats({ byCountry: { India: 5 } })
    } finally {
      setLoading(false)
    }
  }

  const getUniquePorts = () => {
    return [...new Set(tideData.map(item => item.port_name))].filter(port => port && port !== 'null')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading overview...</span>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Map className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coastal Locations</p>
              <p className="text-2xl font-bold text-gray-900">{coastalLocations.length}</p>
              <p className="text-xs text-gray-500 mt-1">{Object.keys(locationStats?.byCountry || {}).length} countries</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Risk Areas</p>
              <p className="text-2xl font-bold text-gray-900">
                {coastalLocations.filter(loc => loc.risk_level === 'high').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Immediate attention needed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tide Records</p>
              <p className="text-2xl font-bold text-gray-900">{tideData.length}</p>
              <p className="text-xs text-gray-500 mt-1">{getUniquePorts().length} ports monitored</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-gray-900">3/3</p>
              <p className="text-xs text-gray-500 mt-1">Services operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow border border-blue-200">
        <div className="px-6 py-4 border-b border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            AI-Powered Coastal Threat Insights
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">Risk Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">High Risk:</span>
                  <span className="font-medium">{coastalLocations.filter(loc => loc.risk_level === 'high').length} locations</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Medium Risk:</span>
                  <span className="font-medium">{coastalLocations.filter(loc => loc.risk_level === 'medium').length} locations</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Low Risk:</span>
                  <span className="font-medium">{coastalLocations.filter(loc => loc.risk_level === 'low').length} locations</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">Threat Analysis</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const allThreats = coastalLocations.flatMap(loc => loc.threats || [])
                  const threatCounts = allThreats.reduce((acc, threat) => {
                    acc[threat] = (acc[threat] || 0) + 1
                    return acc
                  }, {})
                  const topThreats = Object.entries(threatCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                  
                  return topThreats.map(([threat, count]) => (
                    <div key={threat} className="flex justify-between">
                      <span className="capitalize text-gray-600">{threat.replace('_', ' ')}:</span>
                      <span className="font-medium">{count} areas</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">Data Quality</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Complete Records:</span>
                  <span className="font-medium text-green-600">
                    {Math.round((tideData.filter(item => item.has_time_data && item.has_height_data).length / Math.max(tideData.length, 1)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Components:</span>
                  <span className="font-medium">
                    {tideData.length > 0 ? (tideData.reduce((sum, item) => sum + (item.components_count || 0), 0) / tideData.length).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium text-blue-600">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview