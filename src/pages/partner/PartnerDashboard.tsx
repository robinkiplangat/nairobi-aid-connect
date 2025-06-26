
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, Users, Clock, Settings, LogOut, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const PartnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const stats = {
    activeCases: 12,
    pendingRequests: 8,
    volunteers: 45,
    averageResponseTime: '3.2 min'
  };

  const recentCases = [
    { id: 1, type: 'Medical', location: 'Nairobi CBD', status: 'Active', time: '5 min ago' },
    { id: 2, type: 'Legal', location: 'Westlands', status: 'Pending', time: '12 min ago' },
    { id: 3, type: 'Shelter', location: 'Kibera', status: 'Resolved', time: '25 min ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'destructive';
      case 'Pending': return 'secondary';
      case 'Resolved': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div 
      className="min-h-screen relative"
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
              <h1 className="text-xl font-semibold text-gray-900">SOS Nairobi</h1>
              <span className="text-sm text-gray-500 font-medium">Partner Dashboard</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/partner/volunteers">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Volunteers
                </Button>
              </Link>
              <Link to="/partner/settings">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Monitor emergency response activities and manage resources</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
            <TabsTrigger value="cases" className="data-[state=active]:bg-white">Cases</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50 hover:bg-white/95 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Active Cases</CardTitle>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900">{stats.activeCases}</div>
                  <p className="text-xs text-gray-500 mt-1">+2 from last hour</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50 hover:bg-white/95 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Pending Requests</CardTitle>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</div>
                  <p className="text-xs text-gray-500 mt-1">-1 from last hour</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50 hover:bg-white/95 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Active Volunteers</CardTitle>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900">{stats.volunteers}</div>
                  <p className="text-xs text-gray-500 mt-1">+5 from yesterday</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50 hover:bg-white/95 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Avg Response Time</CardTitle>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900">{stats.averageResponseTime}</div>
                  <p className="text-xs text-gray-500 mt-1">-0.5 min from avg</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Cases */}
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Cases</CardTitle>
                <CardDescription className="text-gray-600">Latest emergency requests and their status</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {recentCases.map((case_) => (
                    <div key={case_.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100/50">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <MapPin className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{case_.type} Request</p>
                          <p className="text-sm text-gray-500">{case_.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusColor(case_.status)} className="font-medium">
                          {case_.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{case_.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link to="/partner/cases">
                    <Button variant="outline" className="w-full bg-white/80 hover:bg-white">
                      View All Cases
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Case Management</CardTitle>
                <CardDescription className="text-gray-600">Manage and track all emergency cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Full case management interface</p>
                  <Link to="/partner/cases">
                    <Button className="bg-gray-900 hover:bg-gray-800">Go to Case Management</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Analytics & Reports</CardTitle>
                <CardDescription className="text-gray-600">View detailed analytics and generate reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Analytics dashboard coming soon</p>
                  <Button variant="outline" disabled className="bg-white/80">View Analytics</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PartnerDashboard;
