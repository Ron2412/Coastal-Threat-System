import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../config/supabase'
import MLPredictions from '../components/MLPredictions'
import TideDataViewer from '../components/TideDataViewer'
import SystemStatus from '../components/SystemStatus'
import { 
  BarChart3, 
  Map, 
  Database, 
  Brain, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Thermometer,
  Droplets
} from 'lucide-react'

// Fix for default markers in react-leaflet
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [tideData, setTideData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mlPredictions, setMlPredictions] = useState(null)
  const [systemStatus, setSystemStatus] = useState({
    backend: false,
    supabase: false,
    mlService: false
  })

  useEffect(() => {
    fetchTideData()
    checkSystemStatus()
  }, [])

  const fetchTideData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tide_data_raw')
        .select('*')
        .limit(100)

      if (error) throw error
      setTideData(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkSystemStatus = async () => {
    // Check backend
    try {
      const response = await fetch('http://localhost:3001/health')
      setSystemStatus(prev => ({ ...prev, backend: response.ok }))
    } catch {
      setSystemStatus(prev => ({ ...prev, backend: false }))
    }

    // Check Supabase
    try {
      const { data } = await supabase.from('tide_data_raw').select('count').limit(1)
      setSystemStatus(prev => ({ ...prev, supabase: !!data }))
    } catch {
      setSystemStatus(prev => ({ ...prev, supabase: false }))
    }

    // Check ML service
    try {
      const response = await fetch('http://localhost:5001/health')
      setSystemStatus(prev => ({ ...prev, mlService: response.ok }))
    } catch {
      setSystemStatus(prev => ({ ...prev, mlService: false }))
    }
  }

  const getUniquePorts = () => {
    const ports = [...new Set(tideData.map(item => item.port_name))]
    return ports.filter(port => port && port !== 'null')
  }

  const getRiskLevel = (port) => {
    const portData = tideData.filter(item => item.port_name === port)
    const avgComponents = portData.reduce((sum, item) => sum + (item.components_count || 0), 0) / portData.length
    
    if (avgComponents > 8) return 'high'
    if (avgComponents > 5) return 'medium'
    return 'low'
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'map', label: 'Interactive Map', icon: Map },
    { id: 'data', label: 'Tide Data', icon: Database },
    { id: 'ml', label: 'ML Predictions', icon: Brain },
    { id: 'status', label: 'System Status', icon: Activity }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Coastal Threat Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchTideData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🌊 Coastal Threat Dashboard</h1>
              <p className="text-gray-600">Real-time tide monitoring and ML-powered predictions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.backend ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">Backend</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.supabase ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.mlService ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">ML Service</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{tideData.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Map className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Ports</p>
                    <p className="text-2xl font-bold text-gray-900">{getUniquePorts().length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Brain className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">ML Models</p>
                    <p className="text-2xl font-bold text-gray-900">2</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">System Status</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.values(systemStatus).filter(Boolean).length}/3
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Port Risk Analysis */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Port Risk Analysis</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getUniquePorts().slice(0, 6).map((port) => {
                    const risk = getRiskLevel(port)
                    const portData = tideData.filter(item => item.port_name === port)
                    const avgComponents = portData.reduce((sum, item) => sum + (item.components_count || 0), 0) / portData.length
                    
                    return (
                      <div key={port} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{port}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getRiskColor(risk)}-100 text-${getRiskColor(risk)}-800`}>
                            {risk.toUpperCase()}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg Components:</span>
                            <span className="font-medium">{avgComponents.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Records:</span>
                            <span className="font-medium">{portData.length}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Interactive Coastal Map</h3>
            </div>
            <div className="p-6">
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainer 
                  center={[20, 80]} 
                  zoom={4} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {getUniquePorts().map((port) => {
                    const risk = getRiskLevel(port)
                    const portData = tideData.filter(item => item.port_name === port)[0]
                    
                    // Generate random coordinates for demo (in real app, use actual coordinates)
                    const lat = 20 + Math.random() * 10
                    const lng = 70 + Math.random() * 20
                    
                    return (
                      <Circle
                        key={port}
                        center={[lat, lng]}
                        radius={risk === 'high' ? 50000 : risk === 'medium' ? 30000 : 20000}
                        pathOptions={{
                          color: getRiskColor(risk),
                          fillColor: getRiskColor(risk),
                          fillOpacity: 0.3
                        }}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-bold">{port}</h3>
                            <p>Risk Level: {risk.toUpperCase()}</p>
                            <p>Records: {tideData.filter(item => item.port_name === port).length}</p>
                          </div>
                        </Popup>
                      </Circle>
                    )
                  })}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <TideDataViewer data={tideData} />
        )}

        {activeTab === 'ml' && (
          <MLPredictions tideData={tideData} />
        )}

        {activeTab === 'status' && (
          <SystemStatus status={systemStatus} onRefresh={checkSystemStatus} />
        )}
      </main>
    </div>
  )
}

export default Dashboard
