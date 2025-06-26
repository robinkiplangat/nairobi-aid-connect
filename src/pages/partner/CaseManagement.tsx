
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, User, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const CaseManagement = () => {
  const [selectedCase, setSelectedCase] = useState<number | null>(null);

  // Mock data for cases
  const cases = [
    {
      id: 1,
      type: 'Medical',
      status: 'Active',
      location: 'Nairobi CBD',
      coordinates: { lat: -1.2921, lng: 36.8219 },
      requestedAt: '2024-01-15 14:30',
      description: 'Individual needs immediate medical attention',
      volunteer: 'Dr. Sarah Mwangi',
      priority: 'High'
    },
    {
      id: 2,
      type: 'Legal',
      status: 'Pending',
      location: 'Westlands',
      coordinates: { lat: -1.2676, lng: 36.8062 },
      requestedAt: '2024-01-15 14:18',
      description: 'Legal assistance required for detainee',
      volunteer: null,
      priority: 'Medium'
    },
    {
      id: 3,
      type: 'Shelter',
      status: 'Resolved',
      location: 'Kibera',
      coordinates: { lat: -1.3133, lng: 36.7892 },
      requestedAt: '2024-01-15 13:45',
      description: 'Safe shelter needed urgently',
      volunteer: 'John Kamau',
      priority: 'High'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'destructive';
      case 'Pending': return 'secondary';
      case 'Resolved': return 'default';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/partner" className="text-blue-600 hover:text-blue-500">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Case Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                Export Cases
              </Button>
              <Link to="/partner/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cases List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Cases</CardTitle>
                <CardDescription>Manage emergency requests and volunteer assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="all">All Cases</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {cases.map((case_) => (
                      <div 
                        key={case_.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCase === case_.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCase(case_.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              case_.type === 'Medical' ? 'bg-red-100 text-red-600' :
                              case_.type === 'Legal' ? 'bg-blue-100 text-blue-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {case_.type === 'Medical' ? <AlertTriangle className="h-4 w-4" /> :
                               case_.type === 'Legal' ? <User className="h-4 w-4" /> :
                               <CheckCircle className="h-4 w-4" />}
                            </div>
                            <div>
                              <h3 className="font-medium">{case_.type} Request</h3>
                              <p className="text-sm text-gray-500">Case #{case_.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getPriorityColor(case_.priority)}>{case_.priority}</Badge>
                            <Badge variant={getStatusColor(case_.status)}>{case_.status}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{case_.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{case_.requestedAt}</span>
                          </div>
                        </div>

                        {case_.volunteer && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Assigned to: </span>
                            <span className="font-medium">{case_.volunteer}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Case Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
                <CardDescription>
                  {selectedCase ? `Case #${selectedCase}` : 'Select a case to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCase ? (
                  <div className="space-y-4">
                    {(() => {
                      const case_ = cases.find(c => c.id === selectedCase);
                      if (!case_) return null;
                      
                      return (
                        <>
                          <div>
                            <h4 className="font-medium mb-2">Request Type</h4>
                            <Badge variant="outline">{case_.type}</Badge>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Status</h4>
                            <Badge variant={getStatusColor(case_.status)}>{case_.status}</Badge>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Priority</h4>
                            <Badge variant={getPriorityColor(case_.priority)}>{case_.priority}</Badge>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Location</h4>
                            <p className="text-sm text-gray-600">{case_.location}</p>
                            <p className="text-xs text-gray-500">
                              {case_.coordinates.lat}, {case_.coordinates.lng}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-gray-600">{case_.description}</p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Requested At</h4>
                            <p className="text-sm text-gray-600">{case_.requestedAt}</p>
                          </div>

                          {case_.volunteer && (
                            <div>
                              <h4 className="font-medium mb-2">Assigned Volunteer</h4>
                              <p className="text-sm text-gray-600">{case_.volunteer}</p>
                            </div>
                          )}

                          <div className="space-y-2 pt-4">
                            {case_.status === 'Pending' && (
                              <Button className="w-full" size="sm">
                                Assign Volunteer
                              </Button>
                            )}
                            {case_.status === 'Active' && (
                              <Button variant="outline" className="w-full" size="sm">
                                Mark as Resolved
                              </Button>
                            )}
                            <Button variant="outline" className="w-full" size="sm">
                              Contact Volunteer
                            </Button>
                            <Button variant="outline" className="w-full" size="sm">
                              View on Map
                            </Button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a case from the list to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseManagement;
