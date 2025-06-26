
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Settings, Users, Code, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const VolunteerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('volunteers');

  // Mock data for volunteers
  const volunteers = [
    { id: 1, name: 'Dr. Sarah Mwangi', type: 'Medical', status: 'Active', code: 'MED001', lastActive: '2 hours ago', cases: 15 },
    { id: 2, name: 'John Kamau', type: 'Shelter', status: 'Active', code: 'SHE003', lastActive: '30 min ago', cases: 8 },
    { id: 3, name: 'Advocate Mary Wanjiku', type: 'Legal', status: 'Inactive', code: 'LEG002', lastActive: '1 day ago', cases: 22 },
    { id: 4, name: 'James Ochieng', type: 'Medical', status: 'Active', code: 'MED005', lastActive: '1 hour ago', cases: 12 },
  ];

  // Mock data for volunteer codes
  const volunteerCodes = [
    { id: 1, code: 'VOLUNTEER2024', type: 'General', status: 'Active', uses: 5, maxUses: 10, createdBy: 'Admin' },
    { id: 2, code: 'MEDIC123', type: 'Medical', status: 'Active', uses: 3, maxUses: 5, createdBy: 'Dr. Mwangi' },
    { id: 3, code: 'LEGAL456', type: 'Legal', status: 'Active', uses: 2, maxUses: 3, createdBy: 'Legal Team' },
    { id: 4, code: 'SHELTER789', type: 'Shelter', status: 'Expired', uses: 10, maxUses: 10, createdBy: 'Admin' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Inactive': return 'secondary';
      case 'Expired': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Medical': return 'destructive';
      case 'Legal': return 'default';
      case 'Shelter': return 'secondary';
      case 'General': return 'outline';
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
              <Link to="/partner" className="text-blue-600 hover:text-blue-500 font-medium">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Volunteer Management</h1>
            </div>
            <div className="flex items-center space-x-3">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Volunteer Resources</h2>
          <p className="text-gray-600">Manage volunteers and verification codes for your organization</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="volunteers" className="data-[state=active]:bg-white">
              <Users className="h-4 w-4 mr-2" />
              Volunteers
            </TabsTrigger>
            <TabsTrigger value="codes" className="data-[state=active]:bg-white">
              <Code className="h-4 w-4 mr-2" />
              Verification Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="volunteers" className="space-y-6">
            {/* Search and Filter */}
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search volunteers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/80"
                      />
                    </div>
                  </div>
                  <Button variant="outline" className="bg-white/80 hover:bg-white">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button className="bg-gray-900 hover:bg-gray-800">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Volunteer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Volunteers List */}
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Active Volunteers</CardTitle>
                <CardDescription className="text-gray-600">Manage your organization's verified volunteers</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {volunteers.map((volunteer) => (
                    <div key={volunteer.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100/50">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {volunteer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{volunteer.name}</p>
                          <p className="text-sm text-gray-500">Code: {volunteer.code} • {volunteer.cases} cases completed</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getTypeColor(volunteer.type)} className="font-medium">
                          {volunteer.type}
                        </Badge>
                        <Badge variant={getStatusColor(volunteer.status)} className="font-medium">
                          {volunteer.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{volunteer.lastActive}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codes" className="space-y-6">
            {/* Code Generation */}
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Generate New Code</CardTitle>
                <CardDescription className="text-gray-600">Create verification codes for new volunteers</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="code-type">Code Type</Label>
                    <Input id="code-type" placeholder="Medical, Legal, Shelter..." className="bg-white/80" />
                  </div>
                  <div>
                    <Label htmlFor="max-uses">Max Uses</Label>
                    <Input id="max-uses" type="number" placeholder="10" className="bg-white/80" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800">Generate Code</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Codes List */}
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Verification Codes</CardTitle>
                <CardDescription className="text-gray-600">Manage and monitor verification code usage</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {volunteerCodes.map((codeItem) => (
                    <div key={codeItem.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100/50">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Code className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 font-mono">{codeItem.code}</p>
                          <p className="text-sm text-gray-500">
                            Created by {codeItem.createdBy} • {codeItem.uses}/{codeItem.maxUses} uses
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getTypeColor(codeItem.type)} className="font-medium">
                          {codeItem.type}
                        </Badge>
                        <Badge variant={getStatusColor(codeItem.status)} className="font-medium">
                          {codeItem.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VolunteerManagement;
