import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import InteractiveMap from './pages/InteractiveMap'
import Dashboard from './pages/Dashboard'
import MLPredictions from './components/MLPredictions'
import TideDataViewer from './components/TideDataViewer'
import SystemStatus from './components/SystemStatus'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="map" element={<InteractiveMap />} />
            <Route path="data" element={<TideDataViewer />} />
            <Route path="ml" element={<MLPredictions />} />
            <Route path="status" element={<SystemStatus />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </div>
  )
}

export default App
