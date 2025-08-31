import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, AlertTriangle, Shield, Users, Map, Database, Brain } from 'lucide-react';
import { api } from '../utils/api';

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, locationsData] = await Promise.all([
        api.getCoastalStats(),
        api.getCoastalLocations()
      ]);
      setStats(statsData);
      setLocations(locationsData);
    } catch (err) {
      setError('Failed to load data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600">
          Real-time monitoring and analysis of coastal threats across India's coastline
        </p>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 text-white">
          <h2 className="text-4xl font-bold mb-3">
            Coastal Threat Monitoring Dashboard
          </h2>
          <p className="text-xl text-blue-100 mb-6">
            Real-time monitoring and analysis of coastal threats across India
          </p>
          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white border border-white border-opacity-30">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              System Active
            </div>
            <div className="text-sm text-blue-100">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      {stats && (
        <div className="dashboard-grid-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Locations</p>
                <p className="stat-value text-blue-600">{stats.total_locations}</p>
                <p className="stat-change positive">+2 this week</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">High Risk Areas</p>
                <p className="stat-value text-red-600">{stats.high_risk}</p>
                <p className="stat-change negative">+1 since yesterday</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Medium Risk Areas</p>
                <p className="stat-value text-yellow-600">{stats.medium_risk}</p>
                <p className="stat-change positive">Stable</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Low Risk Areas</p>
                <p className="stat-value text-green-600">{stats.low_risk}</p>
                <p className="stat-change positive">Safe zones</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content Grid */}
      <div className="dashboard-grid-2">
        {/* Population Impact */}
        {stats && (
          <div className="card-gradient">
            <h3 className="text-xl font-bold mb-4 text-white">Population Impact</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold mb-2 text-white">
                  {(stats.total_population / 1000000).toFixed(1)}M
                </p>
                <p className="text-blue-100">People in monitored areas</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/dashboard/map" className="btn-primary w-full flex items-center justify-center">
              <Map className="h-5 w-5 mr-2" />
              View Interactive Map
            </Link>
            <Link to="/dashboard/data" className="btn-secondary w-full flex items-center justify-center">
              <Database className="h-5 w-5 mr-2" />
              Browse Tide Data
            </Link>
            <Link to="/dashboard/ml" className="btn-secondary w-full flex items-center justify-center">
              <Brain className="h-5 w-5 mr-2" />
              Generate ML Predictions
            </Link>
          </div>
        </div>
      </div>

      {/* Regional Analysis */}
      {stats && (
        <div className="dashboard-grid-2">
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Regional Distribution</h3>
            <div className="space-y-4">
              {stats.regions.map((region, index) => {
                const regionCount = locations.filter(loc => loc.region === region).length;
                const percentage = ((regionCount / stats.total_locations) * 100).toFixed(1);
                return (
                  <div key={region} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">{region}</span>
                      <span className="text-sm text-gray-600">{regionCount} locations ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 
                          index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Threat Analysis</h3>
            <div className="space-y-4">
              {stats.threats.map((threat, index) => {
                const threatCount = locations.filter(loc => loc.threats?.includes(threat)).length;
                const percentage = ((threatCount / stats.total_locations) * 100).toFixed(1);
                return (
                  <div key={threat} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800 capitalize">
                        {threat.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">{threatCount} locations ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          threat === 'cyclones' ? 'bg-red-500' :
                          threat === 'flooding' ? 'bg-blue-500' :
                          threat === 'storm_surge' ? 'bg-orange-500' :
                          threat === 'erosion' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* System Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
        <h3 className="text-xl font-bold text-gray-900 mb-6">System Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">All monitoring systems operational</span>
            </div>
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">Just now</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Real data integration active - {stats?.total_locations || 0} locations monitored</span>
            </div>
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">2 min ago</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Database sync completed</span>
            </div>
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">5 min ago</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">View Reports</p>
                <p className="text-sm text-gray-500">Latest threat assessments</p>
              </div>
            </div>
          </button>

          <button className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Export Data</p>
                <p className="text-sm text-gray-500">Download monitoring data</p>
              </div>
            </div>
          </button>

          <button className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">System Status</p>
                <p className="text-sm text-gray-500">Monitor system health</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Overview;
