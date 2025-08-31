import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Map, Database, Brain, Activity } from 'lucide-react'

const Navigation = () => {
  const location = useLocation()
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, path: '/' },
    { id: 'map', label: 'Interactive Map', icon: Map, path: '/map' },
    { id: 'data', label: 'Tide Data', icon: Database, path: '/data' },
    { id: 'ml', label: 'ML Predictions', icon: Brain, path: '/ml' },
    { id: 'status', label: 'System Status', icon: Activity, path: '/status' }
  ]

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = location.pathname === tab.path
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
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
  )
}

export default Navigation