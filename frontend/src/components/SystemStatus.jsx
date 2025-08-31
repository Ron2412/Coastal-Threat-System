import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { Activity, CheckCircle, XCircle, RefreshCw, Server, Database, Brain } from 'lucide-react'

const SystemStatus = () => {
  const { systemStatus: status, onRefresh } = useOutletContext()
  const services = [
    {
      name: 'Backend API',
      status: status.backend,
      icon: Server,
      description: 'Node.js Express server providing API endpoints',
      endpoint: 'http://localhost:3001'
    },
    {
      name: 'Supabase Database',
      status: status.supabase,
      icon: Database,
      description: 'PostgreSQL database with real-time capabilities',
      endpoint: 'https://vswnzvzmbbbscctuyfzu.supabase.co'
    },
    {
      name: 'ML Service',
      status: status.mlService,
      icon: Brain,
      description: 'Python ML service for predictions and model management',
      endpoint: 'http://localhost:5001'
    }
  ]

  const overallStatus = Object.values(status).filter(Boolean).length === Object.keys(status).length

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            System Health Overview
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-900">
                {overallStatus ? 'All Systems Operational' : 'System Issues Detected'}
              </h4>
              <p className="text-gray-600 mt-1">
                {Object.values(status).filter(Boolean).length} of {Object.keys(status).length} services are running
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                overallStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {overallStatus ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {overallStatus ? 'Healthy' : 'Issues Detected'}
                </span>
              </div>
              <button
                onClick={onRefresh}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => {
          const Icon = service.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Icon className="h-6 w-6 text-gray-600 mr-3" />
                    <h4 className="text-lg font-medium text-gray-900">{service.name}</h4>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${service.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${service.status ? 'text-green-600' : 'text-red-600'}`}>
                      {service.status ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Endpoint:</span>
                    <span className="text-gray-900 font-mono text-xs">{service.endpoint}</span>
                  </div>
                </div>
                
                {!service.status && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      This service is currently unavailable. Check if the service is running and accessible.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Troubleshooting Guide */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Troubleshooting Guide</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Backend Issues</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check if Node.js server is running</li>
                <li>• Verify port 3001 is not in use</li>
                <li>• Check server logs for errors</li>
                <li>• Ensure environment variables are set</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Database Issues</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Verify Supabase credentials</li>
                <li>• Check network connectivity</li>
                <li>• Ensure tables exist in database</li>
                <li>• Verify RLS policies are correct</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">ML Service Issues</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check if Python service is running</li>
                <li>• Verify port 5001 is available</li>
                <li>• Check ML model files exist</li>
                <li>• Ensure dependencies are installed</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Quick Start Commands</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded border">
                <code className="text-blue-800"># Start Backend</code>
                <br />
                <code className="text-gray-600">cd backend && npm start</code>
              </div>
              <div className="bg-white p-2 rounded border">
                <code className="text-blue-800"># Start ML Service</code>
                <br />
                <code className="text-gray-600">cd ml-service && python app.py</code>
              </div>
              <div className="bg-white p-2 rounded border">
                <code className="text-blue-800"># Start Frontend</code>
                <br />
                <code className="text-gray-600">cd frontend && npm run dev</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {overallStatus ? '100%' : `${Math.round((Object.values(status).filter(Boolean).length / Object.keys(status).length) * 100)}%`}
              </div>
              <p className="text-sm text-gray-600 mt-1">Uptime</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Object.values(status).filter(Boolean).length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Services Online</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {Object.values(status).filter(Boolean).length === 0 ? 'Critical' : 
                 Object.values(status).filter(Boolean).length < Object.keys(status).length ? 'Warning' : 'Normal'}
              </div>
              <p className="text-sm text-gray-600 mt-1">System Status</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {new Date().toLocaleTimeString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">Last Check</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemStatus
