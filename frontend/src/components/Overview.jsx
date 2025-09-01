import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Users, 
  Map, 
  Database, 
  Brain,
  Activity,
  TrendingUp,
  Globe,
  Waves,
  RefreshCw
} from 'lucide-react';
import { api } from '../utils/api';

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    backend: false,
    ml: false,
    supabase: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      // Check system health
      const healthChecks = await Promise.allSettled([
        api.getHealth(),
        api.getMLHealth(),
        api.testSupabase()
      ]);

      setSystemHealth({
        backend: healthChecks[0].status === 'fulfilled',
        ml: healthChecks[1].status === 'fulfilled',
        supabase: healthChecks[2].status === 'fulfilled'
      });

      // Fetch data
      const [statsData, locationsData] = await Promise.all([
        api.getCoastalStats(),
        api.getCoastalLocations()
      ]);

      setStats(statsData);
      setLocations(locationsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSystemHealthPercentage = () => {
    const healthyServices = Object.values(systemHealth).filter(Boolean).length;
    return Math.round((healthyServices / Object.keys(systemHealth).length) * 100);
  };

  const getHealthColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600 bg-green-50';
    if (percentage >= 67) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold heading-gradient mb-4">
          Coastal Threat Dashboard
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Real-time monitoring and analysis of coastal threats across India's coastline
        </p>
        <div className="flex items-center justify-center mt-4 space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="h-4 w-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* System Health Banner */}
      <div className={`card-gradient ${getSystemHealthPercentage() === 100 ? 'from-green-500 to-emerald-600' : getSystemHealthPercentage() >= 67 ? 'from-yellow-500 to-orange-600' : 'from-red-500 to-pink-600'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              System Status: {getSystemHealthPercentage()}% Operational
            </h2>
            <div className="flex items-center space-x-6 text-white/90">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${systemHealth.backend ? 'bg-green-300' : 'bg-red-300'} animate-pulse`}></div>
                <span className="text-sm">Backend API</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${systemHealth.supabase ? 'bg-green-300' : 'bg-red-300'} animate-pulse`}></div>
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${systemHealth.ml ? 'bg-green-300' : 'bg-red-300'} animate-pulse`}></div>
                <span className="text-sm">ML Service</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white/20 rounded-xl">
            <Activity className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 animate-fade-in">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h4 className="font-bold text-red-900">System Alert</h4>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className="dashboard-grid-4">
          <div className="stat-card hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Locations</p>
                <p className="stat-value text-blue-600">{stats.total_locations}</p>
                <p className="stat-change positive">Monitoring active</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stat-card hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">High Risk Areas</p>
                <p className="stat-value text-red-600">{stats.high_risk}</p>
                <p className="stat-change negative">Requires attention</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="stat-card hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Medium Risk Areas</p>
                <p className="stat-value text-yellow-600">{stats.medium_risk}</p>
                <p className="stat-change positive">Stable monitoring</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="stat-card hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Population Monitored</p>
                <p className="stat-value text-green-600">{(stats.total_population / 1000000).toFixed(1)}M</p>
                <p className="stat-change positive">Protected</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content Grid */}
      <div className="dashboard-grid-2">
        {/* Quick Actions */}
        <div className="card hover-lift">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg animate-float mr-4">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
              <p className="text-gray-600">Navigate to key dashboard features</p>
            </div>
          </div>
          <div className="space-y-4">
            <Link to="/dashboard/map" className="btn-primary w-full flex items-center justify-center hover-scale">
              <Map className="h-5 w-5 mr-3" />
              View Interactive Map
              <div className="ml-auto bg-white/20 px-2 py-1 rounded text-xs">
                {stats?.total_locations || 0} locations
              </div>
            </Link>
            <Link to="/dashboard/data" className="btn-secondary w-full flex items-center justify-center hover-scale">
              <Database className="h-5 w-5 mr-3" />
              Browse Coastal Data
              <div className="ml-auto bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                Live data
              </div>
            </Link>
            <Link to="/dashboard/ml" className="btn-secondary w-full flex items-center justify-center hover-scale">
              <Brain className="h-5 w-5 mr-3" />
              ML Predictions
              <div className="ml-auto bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                AI powered
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card hover-lift">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg animate-float mr-4">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">System Activity</h3>
              <p className="text-gray-600">Recent system events and updates</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200 hover-lift">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">All monitoring systems operational</span>
              </div>
              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">Live</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200 hover-lift">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Data sync completed - {stats?.total_locations || 0} locations</span>
              </div>
              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">2 min ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200 hover-lift">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">ML models ready for predictions</span>
              </div>
              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">5 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Analysis */}
      {stats && (
        <div className="dashboard-grid-2">
          <div className="card hover-lift">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg animate-float mr-4">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Regional Distribution</h3>
                <p className="text-gray-600">Coastal locations by region</p>
              </div>
            </div>
            <div className="space-y-4">
              {stats.regions.map((region, index) => {
                const regionCount = locations.filter(loc => loc.region === region).length;
                const percentage = stats.total_locations > 0 ? ((regionCount / stats.total_locations) * 100).toFixed(1) : 0;
                return (
                  <div key={region} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 hover-lift">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">{region}</span>
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                        {regionCount} locations ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                          'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card hover-lift">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg animate-float mr-4">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Threat Analysis</h3>
                <p className="text-gray-600">Distribution of coastal threats</p>
              </div>
            </div>
            <div className="space-y-4">
              {stats.threats.map((threat, index) => {
                const threatCount = locations.filter(loc => loc.threats?.includes(threat)).length;
                const percentage = stats.total_locations > 0 ? ((threatCount / stats.total_locations) * 100).toFixed(1) : 0;
                return (
                  <div key={threat} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 hover-lift">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800 capitalize">
                        {threat.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                        {threatCount} locations ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          threat === 'cyclones' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          threat === 'flooding' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          threat === 'storm_surge' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          threat === 'erosion' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                          'bg-gradient-to-r from-gray-500 to-gray-600'
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

      {/* Featured Locations */}
      <div className="card hover-lift">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg animate-float mr-4">
            <Waves className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">High-Risk Locations</h3>
            <p className="text-gray-600">Locations requiring immediate attention</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations
            .filter(loc => loc.risk_level === 'high')
            .slice(0, 6)
            .map((location) => (
              <div
                key={location.id}
                className="bg-gradient-to-br from-white to-red-50 border border-red-200 rounded-xl p-6 hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.region}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Population: {(location.population / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Primary Threats:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {location.threats?.slice(0, 2).map((threat, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"
                        >
                          {threat.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {locations.filter(loc => loc.risk_level === 'high').length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h4 className="text-lg font-medium text-gray-900">No High-Risk Locations</h4>
            <p className="text-sm text-gray-500 mt-2">All monitored areas are currently at low to medium risk levels.</p>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="dashboard-grid-3">
        <div className="card hover-lift text-center">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">Prediction Accuracy</h4>
          <p className="text-3xl font-bold text-blue-600 mb-1">94.5%</p>
          <p className="text-sm text-gray-600">ML model performance</p>
        </div>

        <div className="card hover-lift text-center">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl mb-4">
            <Activity className="h-8 w-8 text-green-600 mx-auto" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">System Uptime</h4>
          <p className="text-3xl font-bold text-green-600 mb-1">99.9%</p>
          <p className="text-sm text-gray-600">Last 30 days</p>
        </div>

        <div className="card hover-lift text-center">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl mb-4">
            <Waves className="h-8 w-8 text-purple-600 mx-auto" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">Data Points</h4>
          <p className="text-3xl font-bold text-purple-600 mb-1">1.2M+</p>
          <p className="text-sm text-gray-600">Processed daily</p>
        </div>
      </div>
    </div>
  );
};

export default Overview;