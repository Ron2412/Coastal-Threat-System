import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export const useCoastalData = () => {
  const [tideData, setTideData] = useState([])
  const [coastalLocations, setCoastalLocations] = useState([])
  const [locationStats, setLocationStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [systemStatus, setSystemStatus] = useState({
    backend: false,
    supabase: false,
    mlService: false
  })

  const fetchTideData = async () => {
    try {
      const { data, error } = await supabase
        .from('tide_data_raw')
        .select('*')
        .limit(100)

      if (error) throw error
      setTideData(data || [])
    } catch (err) {
      console.error('Error fetching tide data:', err)
      setTideData([])
    }
  }

  const fetchCoastalLocations = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/coastal/locations`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setCoastalLocations(result.data || [])
    } catch (err) {
      console.error('Error fetching coastal locations:', err)
      setCoastalLocations([])
    }
  }

  const fetchLocationStats = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/coastal/stats`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setLocationStats(result.data)
    } catch (err) {
      console.error('Error fetching location stats:', err)
      setLocationStats(null)
    } finally {
      setLoading(false)
    }
  }

  const checkSystemStatus = async () => {
    // Check backend
    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setSystemStatus(prev => ({ ...prev, backend: response.ok && data.status === 'healthy' }))
    } catch (err) {
      console.log('Backend check failed:', err)
      setSystemStatus(prev => ({ ...prev, backend: false }))
    }

    // Check database via backend API
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/coastal/locations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setSystemStatus(prev => ({ ...prev, supabase: response.ok && data.success }))
    } catch (err) {
      console.log('Database check failed:', err)
      setSystemStatus(prev => ({ ...prev, supabase: false }))
    }

    // Check ML service
    try {
      const response = await fetch('http://localhost:5001/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setSystemStatus(prev => ({ ...prev, mlService: response.ok && data.status === 'healthy' }))
    } catch (err) {
      console.log('ML service check failed:', err)
      setSystemStatus(prev => ({ ...prev, mlService: false }))
    }
  }

  const getUniquePorts = () => {
    const ports = [...new Set(tideData.map(item => item.port_name))]
    return ports.filter(port => port && port !== 'null' && port.trim() !== '')
  }

  const getRiskLevel = (port) => {
    const portData = tideData.filter(item => item.port_name === port)
    if (portData.length === 0) return 'low'
    
    const avgComponents = portData.reduce((sum, item) => sum + (item.components_count || 0), 0) / portData.length
    const hasTimeData = portData.some(item => item.has_time_data)
    const hasHeightData = portData.some(item => item.has_height_data)
    
    let riskScore = 0
    
    if (avgComponents > 10) riskScore += 40
    else if (avgComponents > 7) riskScore += 30
    else if (avgComponents > 5) riskScore += 20
    else riskScore += 10
    
    if (hasTimeData && hasHeightData) riskScore += 30
    else if (hasTimeData || hasHeightData) riskScore += 15
    
    if (portData.length > 50) riskScore += 30
    else if (portData.length > 20) riskScore += 20
    else riskScore += 10
    
    if (riskScore >= 70) return 'high'
    if (riskScore >= 40) return 'medium'
    return 'low'
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return '#dc2626'
      case 'medium': return '#ea580c'
      case 'low': return '#059669'
      default: return '#6b7280'
    }
  }

  useEffect(() => {
    fetchTideData()
    fetchCoastalLocations()
    fetchLocationStats()
    checkSystemStatus()
    
    // Check system status every 30 seconds
    const statusInterval = setInterval(checkSystemStatus, 30000)
    
    return () => clearInterval(statusInterval)
  }, [])

  return {
    tideData,
    coastalLocations,
    locationStats,
    loading,
    error,
    systemStatus,
    getUniquePorts,
    getRiskLevel,
    getRiskColor,
    refetch: () => {
      fetchTideData()
      fetchCoastalLocations()
      fetchLocationStats()
      checkSystemStatus()
    }
  }
}