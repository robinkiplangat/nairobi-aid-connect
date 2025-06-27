
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, ArrowLeft, MapPin, Users, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResourceStatus = () => {
  const resources = [
    { id: 1, name: 'Medical Supplies', status: 'Available', quantity: 25, location: 'Nairobi CBD', lastUpdated: '2 hours ago' },
    { id: 2, name: 'Emergency Vehicles', status: 'In Use', quantity: 8, location: 'Westlands', lastUpdated: '15 min ago' },
    { id: 3, name: 'Communication Equipment', status: 'Available', quantity: 12, location: 'Kibera', lastUpdated: '1 hour ago' },
    { id: 4, name: 'Legal Support Team', status: 'Available', quantity: 5, location: 'City Center', lastUpdated: '30 min ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700 border-green-200';
      case 'In Use': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Unavailable': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div 
      className="min-h-screen relative bg-gray-50"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.95), rgba(248, 250, 252, 0.95)), url('https://images.unsplash.com/photo-1570284613060-766c33850e79?q=80&w=2070&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/partner" className="text-blue-600 hover:text-blue-500 font-medium flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Resource Status</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="bg-white/80 hover:bg-white">
                Update Resources
              </Button>
              <Link to="/partner/settings">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource Management</h2>
          <p className="text-gray-600">Monitor and manage available resources and equipment</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Total Resources</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">50</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Available</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">42</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">In Use</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-yellow-600">8</div>
            </CardContent>
          </Card>
        </div>

        {/* Resources List */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Resources Overview</CardTitle>
            <CardDescription className="text-gray-600">Current status of all available resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{resource.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{resource.location}</span>
                        </div>
                        <span>Qty: {resource.quantity}</span>
                        <span>Updated {resource.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`font-medium border ${getStatusColor(resource.status)}`}>
                    {resource.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResourceStatus;
