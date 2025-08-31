import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Home, 
  Map, 
  Database, 
  Brain, 
  Settings, 
  Activity,
  ArrowLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  X,
  Waves
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    backend: false,
    supabase: false,
    mlService: false
  });

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: Home, current: location.pathname === '/dashboard' },
    { name: 'Interactive Map', href: '/dashboard/map', icon: Map, current: location.pathname === '/dashboard/map' },
    { name: 'Tide Data', href: '/dashboard/data', icon: Database, current: location.pathname === '/dashboard/data' },
    { name: 'ML Predictions', href: '/dashboard/ml', icon: Brain, current: location.pathname === '/dashboard/ml' },
  ];

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    // Check backend
    try {
      const response = await fetch('http://localhost:3001/health');
      setSystemStatus(prev => ({ ...prev, backend: response.ok }));
    } catch {
      setSystemStatus(prev => ({ ...prev, backend: false }));
    }

    // Check Supabase
    try {
      const response = await fetch('http://localhost:3001/api/coastal/locations');
      setSystemStatus(prev => ({ ...prev, supabase: response.ok }));
    } catch {
      setSystemStatus(prev => ({ ...prev, supabase: false }));
    }

    // Check ML Service
    try {
      const response = await fetch('http://localhost:5001/health');
      setSystemStatus(prev => ({ ...prev, mlService: response.ok }));
    } catch {
      setSystemStatus(prev => ({ ...prev, mlService: false }));
    }
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  const overallHealth = Object.values(systemStatus).filter(Boolean).length / Object.keys(systemStatus).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:block">Back to Home</span>
              </Link>
              
              <div className="hidden lg:flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                  <Waves className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Coastal Threat System</h1>
                  <p className="text-xs text-gray-500">Real-time Monitoring Dashboard</p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search locations..." 
                  className="bg-transparent border-none outline-none text-sm w-48"
                />
              </div>

              {/* System Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${overallHealth === 1 ? 'bg-green-500' : overallHealth > 0.5 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-xs text-gray-600 hidden sm:block">
                  {Math.round(overallHealth * 100)}% Healthy
                </span>
              </div>

              {/* Notifications */}
              <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
              </button>

              {/* Settings */}
              <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            {isSidebarOpen && (
              <div className="lg:hidden">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <Waves className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Coastal Threat</h2>
                    <p className="text-xs text-gray-500">Dashboard</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3 mobile-nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    item.current
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${item.current ? 'text-blue-500' : 'text-gray-400'}`} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            {isSidebarOpen ? (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">System Health</p>
                    <p className="text-xs text-gray-600">{Math.round(overallHealth * 100)}% operational</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className={`w-3 h-3 rounded-full ${overallHealth === 1 ? 'bg-green-500' : overallHealth > 0.5 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <Outlet context={{ systemStatus, onRefresh: checkSystemStatus }} />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                  <Waves className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Coastal Threat</h2>
                  <p className="text-xs text-gray-500">Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
                    <div className="ml-3 flex-1">
                      <span className="block">{item.name}</span>
                      <span className={`text-xs ${active ? 'text-blue-100' : 'text-gray-500'}`}>
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;