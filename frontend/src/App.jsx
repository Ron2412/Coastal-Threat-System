import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Layout from './components/Layout'
import Overview from './components/Overview'
import InteractiveMap from './components/InteractiveMap'
import TideData from './components/TideData'
import MLPredictions from './components/MLPredictions'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="map" element={<InteractiveMap />} />
            <Route path="data" element={<TideData />} />
            <Route path="ml" element={<MLPredictions />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  )
}

export default App
