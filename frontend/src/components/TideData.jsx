import React, { useState, useEffect } from 'react';
import { Search, MapPin, Waves, Calendar, Filter } from 'lucide-react';
import { api } from '../utils/api';

const TideData = () => {
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = locations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [searchQuery, locations]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await api.getCoastalLocations();
      setLocations(data);
      setFilteredLocations(data);
    } catch (err) {
      setError('Failed to load tide data');
      console.error('Tide data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tide Data & Coastal Monitoring</h1>
        <p className="text-gray-600">Comprehensive data analysis of coastal locations and threat assessments</p>
      </div>

      {/* Search and Filter Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredLocations.length}</span> of <span className="font-semibold">{locations.length}</span> locations
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search locations, regions, or countries..."
              className="input-field pl-10 w-full sm:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinates
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Population
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threats
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      <div className="text-sm text-gray-500">{location.region}, {location.country}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {location.coordinates?.lat?.toFixed(4)}, {location.coordinates?.lng?.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRiskBadgeColor(location.risk_level)}`}>
                      {location.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {location.population?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {location.threats?.slice(0, 2).map((threat, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                        >
                          {threat.replace('_', ' ')}
                        </span>
                      ))}
                      {location.threats?.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{location.threats.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLocations.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No locations found</h3>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria or clear the search to see all locations.</p>
          </div>
        )}

        {filteredLocations.length === 0 && !searchQuery && locations.length === 0 && (
          <div className="text-center py-12">
            <Waves className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No coastal data available</h3>
            <p className="text-sm text-gray-500 mt-2">Coastal location data is currently being loaded or unavailable.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TideData;
