import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { 
  BarChart3, 
  Map, 
  Database, 
  Brain, 
  Activity
} from 'lucide-react'

const Layout = () => {
  const location = useLocation()
  const [systemStatus, setSystemStatus] = useState({
    backend: false,
    supabase: false,
    mlService: false
  })

  useEffect(() => {
    checkSystemStatus()
  }, [])

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

  const tabs = [
    { id: '/', label: 'Overview', icon: BarChart3 },
    { id: '/map', label: 'Interactive Map', icon: Map },
    { id: '/data', label: 'Tide Data', icon: Database },
    { id: '/ml', label: 'ML Predictions', icon: Brain },
    { id: '/status', label: 'System Status', icon: Activity }
  ]

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
              const isActive = location.pathname === tab.id
              return (
                <Link
                  key={tab.id}
                  to={tab.id}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ systemStatus, onRefresh: checkSystemStatus }} />
      </main>
    </div>
  )
}

export default Layout