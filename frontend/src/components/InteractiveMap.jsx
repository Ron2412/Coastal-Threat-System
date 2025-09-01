import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { MapPin, Info, Users, AlertTriangle, Navigation, Waves, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const InteractiveMap = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Center of India
  const [mapZoom, setMapZoom] = useState(5);
  const [filterRisk, setFilterRisk] = useState('all');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getCoastalLocations();
      setLocations(data || []);
    } catch (err) {
      setError('Failed to load coastal locations');
      console.error('Locations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskRadius = (riskLevel, population) => {
    const baseRadius = riskLevel === 'high' ? 18 : riskLevel === 'medium' ? 12 : 8;
    const populationFactor = Math.log10((population || 100000) / 100000) * 3;
    return Math.max(6, baseRadius + populationFactor);
  };

  const filteredLocations = filterRisk === 'all' 
    ? locations 
    : locations.filter(loc => loc.risk_level === filterRisk);

  const focusOnLocation = (location) => {
    setMapCenter([location.coordinates.lat, location.coordinates.lng]);
    setMapZoom(10);
    setSelectedLocation(location);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading coastal map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold heading-gradient mb-4">
          Interactive Coastal Map
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore coastal locations and their threat levels across India's coastline
        </p>
        <div className="flex items-center justify-center mt-4 space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Navigation className="h-4 w-4" />
            <span>{filteredLocations.length} locations displayed</span>
          </div>
          <button
            onClick={fetchLocations}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl animate-fade-in">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Waves className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Risk Level Filter:</span>
            </div>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="form-input w-auto min-w-[120px]"
            >
              <option value="all">All Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setMapCenter([20.5937, 78.9629]);
                setMapZoom(5);
                setSelectedLocation(null);
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <Navigation className="h-4 w-4" />
              <span>Reset View</span>
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-96 lg:h-[600px] rounded-xl overflow-hidden shadow-lg">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="z-10"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {filteredLocations.map((location) => (
              <CircleMarker
                key={location.id}
                center={[location.coordinates.lat, location.coordinates.lng]}
                radius={getRiskRadius(location.risk_level, location.population)}
                fillColor={getRiskColor(location.risk_level)}
                color={getRiskColor(location.risk_level)}
                weight={3}
                opacity={0.9}
                fillOpacity={0.7}
                eventHandlers={{
                  click: () => setSelectedLocation(location)
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[250px]">
                    <h3 className="font-bold text-xl text-gray-900 mb-3">{location.name}</h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium text-gray-600">Region:</span>
                          <p className="text-gray-900">{location.region}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Country:</span>
                          <p className="text-gray-900">{location.country}</p>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Population:</span>
                        <p className="text-gray-900 font-semibold">{(location.population / 1000000).toFixed(1)}M people</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Risk Level:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${
                          location.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                          location.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {location.risk_level.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Primary Threats:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {location.threats?.map((threat, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                            >
                              {threat.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <button
                          onClick={() => focusOnLocation(location)}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Map Legend */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            Risk Level Legend
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm hover-lift">
              <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse"></div>
              <div>
                <span className="font-bold text-red-600 text-lg">High Risk</span>
                <p className="text-xs text-gray-600">Immediate threat to coastal areas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm hover-lift">
              <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
              <div>
                <span className="font-bold text-yellow-600 text-lg">Medium Risk</span>
                <p className="text-xs text-gray-600">Moderate threat levels detected</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm hover-lift">
              <div className="w-6 h-6 rounded-full bg-green-500"></div>
              <div>
                <span className="font-bold text-green-600 text-lg">Low Risk</span>
                <p className="text-xs text-gray-600">Minimal threat detected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Grid */}
      <div className="card hover-lift">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg animate-float mr-4">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Monitored Locations</h3>
            <p className="text-gray-600">Detailed view of all coastal monitoring points</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:border-blue-300"
              onClick={() => focusOnLocation(location)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">{location.name}</h4>
                  <p className="text-sm text-gray-600">{location.region}, {location.country}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {location.coordinates?.lat?.toFixed(4)}, {location.coordinates?.lng?.toFixed(4)}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full animate-pulse`} style={{ backgroundColor: getRiskColor(location.risk_level) }}></div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Population:</span>
                  <span className="font-bold text-gray-900">{(location.population / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Risk Level:</span>
                  <span className={`font-bold capitalize px-3 py-1 rounded-full text-xs ${
                    location.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                    location.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {location.risk_level}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Port Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{location.type?.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-600 mb-2 font-medium">Primary Threats:</p>
                <div className="flex flex-wrap gap-1">
                  {location.threats?.slice(0, 3).map((threat, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                    >
                      {threat.replace('_', ' ')}
                    </span>
                  ))}
                  {location.threats?.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      +{location.threats.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Focus on Map
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLocations.length === 0 && !loading && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900">No locations found</h4>
            <p className="text-sm text-gray-500 mt-2">
              {filterRisk === 'all' 
                ? 'No coastal locations are currently available.' 
                : `No locations found with ${filterRisk} risk level.`}
            </p>
          </div>
        )}
      </div>

      {/* Location Details Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full animate-pulse`} style={{ backgroundColor: getRiskColor(selectedLocation.risk_level) }}></div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedLocation.name}</h3>
                    <p className="text-gray-600">{selectedLocation.region}, {selectedLocation.country}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-blue-600" />
                      Location Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coordinates:</span>
                        <span className="font-mono font-medium">{selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Population:</span>
                        <span className="font-bold">{(selectedLocation.population / 1000000).toFixed(1)}M people</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Port Type:</span>
                        <span className="font-medium capitalize">{selectedLocation.type?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Level:</span>
                        <span className={`font-bold capitalize px-3 py-1 rounded-full text-xs ${
                          selectedLocation.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                          selectedLocation.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedLocation.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Description</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedLocation.description}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Threat Assessment
                  </h4>
                  <div className="space-y-3">
                    {selectedLocation.threats?.map((threat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-sm font-medium text-red-800 capitalize">
                          {threat.replace('_', ' ')}
                        </span>
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;