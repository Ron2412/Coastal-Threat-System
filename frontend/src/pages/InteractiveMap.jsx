import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const InteractiveMap = () => {
  const { systemStatus } = useOutletContext()
  const [coastalLocations, setCoastalLocations] = useState([])
  const [locationStats, setLocationStats] = useState({})
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Use mock coastal locations with real coordinates
      const mockLocations = [
        {
          id: 1,
          name: 'Mumbai',
          country: 'India',
          region: 'West Coast',
          risk_level: 'high',
          threats: ['flooding', 'storm_surge', 'erosion'],
          coordinates: { lat: 19.0760, lng: 72.8777 }
        },
        {
          id: 2,
          name: 'Chennai',
          country: 'India',
          region: 'East Coast',
          risk_level: 'high',
          threats: ['cyclones', 'flooding', 'erosion'],
          coordinates: { lat: 13.0827, lng: 80.2707 }
        },
        {
          id: 3,
          name: 'Kolkata',
          country: 'India',
          region: 'East Coast',
          risk_level: 'high',
          threats: ['cyclones', 'flooding', 'sea_level_rise'],
          coordinates: { lat: 22.5726, lng: 88.3639 }
        },
        {
          id: 4,
          name: 'Cochin',
          country: 'India',
          region: 'West Coast',
          risk_level: 'medium',
          threats: ['flooding', 'erosion'],
          coordinates: { lat: 9.9312, lng: 76.2673 }
        },
        {
          id: 5,
          name: 'Mangalore',
          country: 'India',
          region: 'West Coast',
          risk_level: 'medium',
          threats: ['flooding', 'erosion'],
          coordinates: { lat: 12.9141, lng: 74.8560 }
        }
      ]
      
      setCoastalLocations(mockLocations)
      setLocationStats({ byCountry: { India: 5 } })
    } catch (err) {
      console.log('Error fetching data:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const getUniquePorts = () => {
    return coastalLocations.map(loc => loc.name)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading map...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Interactive Coastal Threat Map</h3>
              <p className="text-sm text-gray-600 mt-1">Explore coastal locations and their risk levels</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>High Risk</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Low Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="h-96 rounded-lg overflow-hidden border">
            <MapContainer 
              center={[15, 78]} 
              zoom={5} 
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Coastal Locations */}
              {coastalLocations.map((location) => {
                const coords = location.coordinates
                if (!coords || !coords.lat || !coords.lng) return null
                
                return (
                  <Circle
                    key={location.id}
                    center={[coords.lat, coords.lng]}
                    radius={location.risk_level === 'high' ? 100000 : location.risk_level === 'medium' ? 60000 : 40000}
                    pathOptions={{
                      color: getRiskColor(location.risk_level),
                      fillColor: getRiskColor(location.risk_level),
                      fillOpacity: 0.3,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="p-3 min-w-64">
                        <h3 className="font-bold text-lg mb-2 text-gray-900">{location.name}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium text-gray-600">Country:</span>
                              <p className="text-gray-900">{location.country}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Region:</span>
                              <p className="text-gray-900">{location.region}</p>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-600">Risk Level:</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full risk-${location.risk_level}`}>
                                {location.risk_level.toUpperCase()}
                              </span>
                            </div>
                            
                            <div>
                              <span className="font-medium text-gray-600">Threats:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {location.threats?.map((threat, index) => (
                                  <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded capitalize">
                                    {threat.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t text-xs text-gray-500">
                            <p>Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                )
              })}
            </MapContainer>
          </div>
        </div>
      </div>
      
      {/* Map Statistics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Map Statistics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{coastalLocations.length}</div>
              <p className="text-sm text-gray-600 mt-1">Total Locations</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {coastalLocations.filter(loc => loc.risk_level === 'high').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">High Risk Areas</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Object.keys(locationStats?.byCountry || {}).length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Countries Covered</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {getUniquePorts().length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Tide Monitoring Ports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteractiveMap