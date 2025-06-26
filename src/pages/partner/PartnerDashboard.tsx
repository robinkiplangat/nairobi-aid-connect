
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, Users, Clock, Settings, LogOut } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">SOS Nairobi Partner Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/partner/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Case Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCases}</div>
                  <p className="text-xs text-muted-foreground">+2 from last hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                  <p className="text-xs text-muted-foreground">-1 from last hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Volunteers</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.volunteers}</div>
                  <p className="text-xs text-muted-foreground">+5 from yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageResponseTime}</div>
                  <p className="text-xs text-muted-foreground">-0.5 min from avg</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Cases */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Cases</CardTitle>
                <CardDescription>Latest emergency requests and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCases.map((case_) => (
                    <div key={case_.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{case_.type} Request</p>
                          <p className="text-sm text-gray-500">{case_.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusColor(case_.status)}>{case_.status}</Badge>
                        <span className="text-sm text-gray-500">{case_.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link to="/partner/cases">
                    <Button variant="outline" className="w-full">
                      View All Cases
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases">
            <Card>
              <CardHeader>
                <CardTitle>Case Management</CardTitle>
                <CardDescription>Manage and track all emergency cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Full case management interface</p>
                  <Link to="/partner/cases">
                    <Button>Go to Case Management</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>View detailed analytics and generate reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Analytics dashboard coming soon</p>
                  <Button variant="outline" disabled>View Analytics</Button>
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
