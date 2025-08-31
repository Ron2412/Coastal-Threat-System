import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { MapPin, Info, Users, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
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
    const baseRadius = riskLevel === 'high' ? 15 : riskLevel === 'medium' ? 10 : 8;
    const populationFactor = Math.log10(population / 100000) * 2;
    return Math.max(5, baseRadius + populationFactor);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interactive Coastal Map</h1>
        <p className="text-gray-600">Explore coastal locations and their threat levels across India</p>
      </div>

      {/* Map Container */}
      <div className="card">
        <div className="h-96 lg:h-[600px] rounded-lg overflow-hidden">
          <MapContainer
            center={[20.5937, 78.9629]} // Center of India
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            className="z-10"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {locations.map((location) => (
              <CircleMarker
                key={location.id}
                center={[location.coordinates.lat, location.coordinates.lng]}
                radius={getRiskRadius(location.risk_level, location.population)}
                fillColor={getRiskColor(location.risk_level)}
                color={getRiskColor(location.risk_level)}
                weight={2}
                opacity={0.8}
                fillOpacity={0.6}
                eventHandlers={{
                  click: () => setSelectedLocation(location)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{location.name}</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Region:</span> {location.region}, {location.country}</p>
                      <p><span className="font-medium">Population:</span> {location.population?.toLocaleString()}</p>
                      <p><span className="font-medium">Risk Level:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          location.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                          location.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {location.risk_level}
                        </span>
                      </p>
                      <div>
                        <span className="font-medium">Threats:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {location.threats?.map((threat, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              {threat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Map Legend */}
        <div className="p-6 bg-gray-50 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <div>
                <span className="font-medium text-red-600">High Risk</span>
                <p className="text-xs text-gray-500">Immediate threat to coastal areas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <div>
                <span className="font-medium text-yellow-600">Medium Risk</span>
                <p className="text-xs text-gray-500">Moderate threat levels</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <div>
                <span className="font-medium text-green-600">Low Risk</span>
                <p className="text-xs text-gray-500">Minimal threat detected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Grid */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Monitored Locations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => setSelectedLocation(location)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{location.name}</h4>
                    <p className="text-sm text-gray-500">{location.region}, {location.country}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {location.coordinates?.lat?.toFixed(4)}, {location.coordinates?.lng?.toFixed(4)}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: getRiskColor(location.risk_level) }}></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Population:</span>
                    <span className="font-medium">{location.population?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Risk Level:</span>
                    <span className={`font-medium capitalize ${
                      location.risk_level === 'high' ? 'text-red-600' :
                      location.risk_level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {location.risk_level}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-2">Primary Threats:</p>
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Details Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedLocation.name}</h3>
                  <p className="text-gray-600">{selectedLocation.region}, {selectedLocation.country}</p>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Location Details</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Coordinates:</span>
                      <p className="font-medium">{selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Population:</span>
                      <p className="font-medium">{selectedLocation.population.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Risk Level:</span>
                      <p className={`font-medium capitalize ${
                        selectedLocation.risk_level === 'high' ? 'text-red-600' :
                        selectedLocation.risk_level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {selectedLocation.risk_level}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="mt-1 text-sm text-gray-600">{selectedLocation.description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Threats</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLocation.threats.map((threat, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                      >
                        {threat}
                      </span>
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
