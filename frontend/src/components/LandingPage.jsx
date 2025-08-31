import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  MapPin, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Activity,
  ArrowRight,
  Globe,
  Waves,
  Eye
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: MapPin,
      title: 'Strategic Coastal Mapping',
      description: 'Government-grade visualization of coastal threats and security zones with classified risk assessment.',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Intelligence',
      description: 'AI-powered threat prediction models for national coastal security and emergency preparedness.',
      color: 'green'
    },
    {
      icon: Activity,
      title: 'Real-Time Surveillance',
      description: '24/7 monitoring of coastal conditions, weather patterns, and potential security threats.',
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'National Security Assessment',
      description: 'Comprehensive risk analysis for critical coastal infrastructure and population centers.',
      color: 'red'
    }
  ];

  const stats = [
    { label: 'Coastal Locations', value: '50+', icon: Globe },
    { label: 'Population Monitored', value: '100M+', icon: Users },
    { label: 'Threat Indicators', value: '24/7', icon: AlertTriangle },
    { label: 'Data Points', value: '1M+', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Simple Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Waves className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Coastal Threat Monitor</span>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Shield className="mr-2 h-4 w-4" />
              Access System
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10"></div>
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur-2xl opacity-30 animate-pulse scale-150"></div>
                <div className="relative bg-white p-6 rounded-full shadow-2xl border border-blue-100">
                  <Waves className="h-16 w-16 text-blue-600" />
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Coastal Threat
              </span>
              <br />
              <span className="text-gray-800 text-4xl md:text-5xl font-medium">Monitoring System</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Government-grade AI-powered monitoring and prediction system for coastal security across India. 
              <br className="hidden md:block" />
              Designed for policy makers, coastal authorities, and emergency response teams.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link
                to="/dashboard"
                className="group inline-flex items-center px-10 py-5 border border-transparent text-xl font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25"
              >
                <Eye className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                Access Dashboard
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a
                href="#features"
                className="group inline-flex items-center px-10 py-5 border-2 border-blue-600 text-xl font-semibold rounded-2xl text-blue-600 bg-white/80 backdrop-blur-sm hover:bg-blue-600 hover:text-white transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                System Overview
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Floating Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/80 transition-all duration-300 hover:scale-105">
                    <Icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Government-Grade Monitoring System
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive coastal security analysis for government agencies, policy makers, and emergency response teams.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
                green: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
                purple: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
                red: 'bg-gradient-to-br from-red-500 to-red-600 text-white'
              };
              
              return (
                <div key={index} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className={`p-4 rounded-2xl ${colorClasses[feature.color]} mr-4 shadow-lg`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Secure Coastal Infrastructure
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Trusted by government agencies and coastal authorities across India for comprehensive threat monitoring and emergency preparedness.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-blue-600 rounded-full">
                <Waves className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Coastal Threat Monitoring System
            </h3>
            <p className="text-gray-400 mb-8 text-lg max-w-2xl mx-auto leading-relaxed">
              Protecting coastal communities through advanced monitoring and prediction technology.
            </p>
            <div className="text-sm text-gray-500">
              &copy; 2024 Coastal Threat Monitoring System. Built for coastal safety and environmental protection.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
